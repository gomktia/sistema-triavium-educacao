import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Verificar se e super admin
        await requireSuperAdmin();

        const body = await request.json();
        const { name, slug, email, phone, city, state, organizationType } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Nome e slug sao obrigatorios' },
                { status: 400 }
            );
        }

        // Verificar se slug ja existe
        const existingTenant = await prisma.tenant.findUnique({
            where: { slug }
        });

        if (existingTenant) {
            return NextResponse.json(
                { error: 'Este subdominio ja esta em uso' },
                { status: 400 }
            );
        }

        // Criar tenant
        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                email: email || null,
                phone: phone || null,
                city: city || null,
                state: state || null,
                organizationType: organizationType || 'EDUCATIONAL',
                isActive: true,
                subscriptionStatus: 'active',
            }
        });

        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                subdomain: `${tenant.slug}.triavium.com.br`
            }
        });
    } catch (error: any) {
        console.error('Error creating school:', error);

        if (error.message === 'Access denied') {
            return NextResponse.json(
                { error: 'Acesso negado' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
