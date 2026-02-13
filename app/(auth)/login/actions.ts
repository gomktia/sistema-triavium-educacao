'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getHomeForRole } from '@/lib/auth';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Preencha todos os campos.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('[LOGIN] Supabase auth error:', error.message, '| email:', email);
        return { error: 'Email ou senha incorretos.' };
    }

    // Vincular UID ao registro Prisma se ainda não vinculado
    const supabaseUid = data.user?.id;
    if (supabaseUid) {
        const existingByUid = await prisma.user.findFirst({
            where: { supabaseUid },
            select: { id: true, role: true },
        });

        if (existingByUid) {
            // Já vinculado — redirecionar
            redirect(getHomeForRole(existingByUid.role));
        }

        // Tentar vincular por email
        const dbUser = await prisma.user.findFirst({
            where: { email },
            select: { id: true, role: true, supabaseUid: true },
        });

        if (dbUser) {
            if (!dbUser.supabaseUid) {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { supabaseUid },
                });
                console.log('[LOGIN] Linked UID', supabaseUid, 'to user', email);
            }
            redirect(getHomeForRole(dbUser.role));
        }

        // Autenticou no Supabase mas não existe no Prisma
        console.error('[LOGIN] User authenticated but not found in database:', email);
        await supabase.auth.signOut();
        return { error: 'Usuário não cadastrado no sistema. Contacte o administrador.' };
    }

    redirect('/');
}
