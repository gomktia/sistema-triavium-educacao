'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendPasswordResetEmail } from '@/lib/mail';
import { ok, fail, type ActionResult } from '@/lib/action-result';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Supabase credentials missing (Service Role Key)');
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

const GENERIC_MESSAGE = 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br';

export async function requestPasswordReset(email: string): Promise<ActionResult<{ message: string }>> {
    try {
        const normalized = email.trim().toLowerCase();

        if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            return fail('Informe um e-mail válido.');
        }

        const dbUser = await prisma.user.findFirst({
            where: { email: normalized },
        });

        if (!dbUser) {
            return ok({ message: GENERIC_MESSAGE });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: normalized,
            options: {
                redirectTo: `${APP_URL}/auth/callback?next=/redefinir-senha`,
            },
        });

        if (error) {
            console.error('[PASSWORD_RESET] generateLink error:', error);
            return ok({ message: GENERIC_MESSAGE });
        }

        const resetLink = data.properties?.action_link;
        if (resetLink) {
            await sendPasswordResetEmail({ to: normalized, resetLink });
        }

        await logAudit({
            tenantId: dbUser.tenantId,
            userId: dbUser.id,
            action: 'PASSWORD_RESET_REQUESTED',
        });

        return ok({ message: GENERIC_MESSAGE });
    } catch (error) {
        console.error('[PASSWORD_RESET] Unexpected error:', error);
        return ok({ message: GENERIC_MESSAGE });
    }
}

export async function resetPassword(newPassword: string): Promise<ActionResult<null>> {
    try {
        if (!newPassword || newPassword.length < 8) {
            return fail('A senha deve ter no mínimo 8 caracteres.');
        }

        const supabase = await createServerSupabase();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return fail('Sessão expirada. Solicite um novo link de recuperação.');
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            console.error('[PASSWORD_RESET] updateUser error:', error);
            return fail('Erro ao redefinir senha. Tente novamente.');
        }

        const dbUser = await prisma.user.findFirst({
            where: { OR: [{ supabaseUid: user.id }, { email: user.email || '' }] },
        });

        if (dbUser) {
            await logAudit({
                tenantId: dbUser.tenantId,
                userId: dbUser.id,
                action: 'PASSWORD_RESET_COMPLETED',
            });
        }

        return ok(null);
    } catch (error) {
        console.error('[PASSWORD_RESET] Unexpected error:', error);
        return fail('Erro inesperado. Tente novamente.');
    }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult<null>> {
    try {
        if (!newPassword || newPassword.length < 8) {
            return fail('A nova senha deve ter no mínimo 8 caracteres.');
        }

        const user = await getCurrentUser();
        if (!user) {
            return fail('Usuário não autenticado.');
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            return fail('Senha atual incorreta.');
        }

        const supabase = await createServerSupabase();
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            console.error('[CHANGE_PASSWORD] updateUser error:', error);
            return fail('Erro ao alterar senha. Tente novamente.');
        }

        await logAudit({
            tenantId: user.tenantId,
            userId: user.id,
            action: 'PASSWORD_CHANGED',
        });

        return ok(null);
    } catch (error) {
        console.error('[CHANGE_PASSWORD] Unexpected error:', error);
        return fail('Erro inesperado. Tente novamente.');
    }
}
