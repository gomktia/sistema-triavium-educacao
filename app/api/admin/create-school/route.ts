import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSchoolSchema } from '@/lib/validators/admin';
import { createSchoolLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        if (!createSchoolLimiter.check(clientIp)) {
            return NextResponse.json(
                { error: 'Limite de criacao de escolas atingido. Aguarde 5 minutos.' },
                { status: 429 }
            );
        }

        // Verificar se e super admin
        await requireSuperAdmin();

        const body = await request.json();
        const parsed = createSchoolSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, slug, email, phone, city, state, organizationType } = parsed.data;

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
