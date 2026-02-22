import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { email, name, role, tenantId } = body;

        if (!email || !name || !role) {
            return NextResponse.json(
                { error: 'Email, nome e funcao sao obrigatorios' },
                { status: 400 }
            );
        }

        // Verificar se email ja existe no tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                tenantId: tenantId || user.tenantId,
                email: email.toLowerCase()
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este email ja esta cadastrado nesta organizacao' },
                { status: 400 }
            );
        }

        // Criar usuario pendente (sera ativado quando fizer login)
        const newUser = await prisma.user.create({
            data: {
                tenantId: tenantId || user.tenantId,
                email: email.toLowerCase(),
                name,
                role: role as any,
                isActive: true,
            }
        });

        // Gerar token seguro usando crypto
        const inviteToken = randomBytes(32).toString('hex');
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br'}/convite/${inviteToken}`;

        // Armazenar token no usuario para validacao posterior
        await prisma.user.update({
            where: { id: newUser.id },
            data: { supabaseUid: `invite:${inviteToken}` } // Temporario ate ativar conta
        });

        return NextResponse.json({
            success: true,
            inviteLink,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (error: any) {
        console.error('Error inviting member:', error);

        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
