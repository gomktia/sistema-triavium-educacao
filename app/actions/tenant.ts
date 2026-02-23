'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateTenantSettings(formData: FormData) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
        return { error: 'Não autorizado.' };
    }

    const name = formData.get('name') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const customDomain = formData.get('customDomain') as string;
    const cnpj = formData.get('cnpj') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;

    if (!name) {
        return { error: 'O nome da escola é obrigatório.' };
    }

    if (state && state.length !== 2) {
        return { error: 'O estado deve ter exatamente 2 caracteres (ex: SP, RJ).' };
    }

    if (cnpj) {
        const digits = cnpj.replace(/\D/g, '');
        if (digits.length !== 11 && digits.length !== 14) {
            return { error: 'CNPJ deve ter 11 ou 14 dígitos.' };
        }
    }

    try {
        await prisma.tenant.update({
            where: { id: user.tenantId },
            data: {
                name,
                logoUrl: logoUrl || null,
                customDomain: customDomain || null,
                cnpj: cnpj || null,
                phone: phone || null,
                email: email || null,
                address: address || null,
                city: city || null,
                state: state || null,
            },
        });

        revalidatePath('/escola/configuracoes');
        revalidatePath('/inicio');
        return { success: true };
    } catch (e: any) {
        console.error('Error updating tenant:', e.message);
        return { error: 'Erro ao salvar configurações.' };
    }
}
