import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addDomainToVercel, removeDomainFromVercel, verifyDomain } from '@/lib/vercel-domains';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { tenantId, customDomain, action } = body;

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, slug: true, customDomain: true },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
        }

        // Action: remove domain
        if (action === 'remove') {
            if (!tenant.customDomain) {
                return NextResponse.json({ error: 'Tenant não possui domínio personalizado' }, { status: 400 });
            }

            // Remove from Vercel
            const vercelResult = await removeDomainFromVercel(tenant.customDomain);

            if (!vercelResult.success) {
                console.error('Failed to remove domain from Vercel:', vercelResult.error);
                // Continue anyway to clean up database
            }

            // Remove from database
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { customDomain: null },
            });

            return NextResponse.json({
                success: true,
                message: 'Domínio removido com sucesso',
            });
        }

        // Action: verify domain
        if (action === 'verify') {
            if (!tenant.customDomain) {
                return NextResponse.json({ error: 'Tenant não possui domínio personalizado' }, { status: 400 });
            }

            const vercelResult = await verifyDomain(tenant.customDomain);

            return NextResponse.json({
                success: vercelResult.success,
                verified: vercelResult.verified,
                error: vercelResult.error,
            });
        }

        // Action: add/update domain
        if (!customDomain) {
            return NextResponse.json({ error: 'customDomain é obrigatório' }, { status: 400 });
        }

        // Validate domain format
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(customDomain)) {
            return NextResponse.json({ error: 'Formato de domínio inválido' }, { status: 400 });
        }

        // Check if domain is already in use by another tenant
        const existingTenant = await prisma.tenant.findFirst({
            where: {
                customDomain,
                id: { not: tenantId },
            },
        });

        if (existingTenant) {
            return NextResponse.json(
                { error: 'Este domínio já está em uso por outra organização' },
                { status: 400 }
            );
        }

        // Remove old domain from Vercel if changing
        if (tenant.customDomain && tenant.customDomain !== customDomain) {
            await removeDomainFromVercel(tenant.customDomain);
        }

        // Add new domain to Vercel
        const vercelResult = await addDomainToVercel(customDomain);

        if (!vercelResult.success) {
            return NextResponse.json(
                { error: vercelResult.error || 'Erro ao registrar domínio na Vercel' },
                { status: 400 }
            );
        }

        // Update database
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { customDomain },
        });

        return NextResponse.json({
            success: true,
            domain: customDomain,
            verified: vercelResult.verified,
            verificationRecords: vercelResult.verificationRecords,
            message: vercelResult.verified
                ? 'Domínio configurado e verificado com sucesso!'
                : 'Domínio registrado. Configure os registros DNS abaixo para verificação.',
        });
    } catch (error: any) {
        console.error('Error managing tenant domain:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                customDomain: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
        }

        // If tenant has custom domain, check verification status
        let verificationStatus = null;
        if (tenant.customDomain) {
            const { verifyDomain } = await import('@/lib/vercel-domains');
            const result = await verifyDomain(tenant.customDomain);
            verificationStatus = {
                verified: result.verified,
                records: result.verificationRecords,
            };
        }

        return NextResponse.json({
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                customDomain: tenant.customDomain,
                subdomainUrl: `https://${tenant.slug}.triavium.com.br`,
            },
            verificationStatus,
        });
    } catch (error: any) {
        console.error('Error getting tenant domain info:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
