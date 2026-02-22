import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

export interface ResolvedTenant {
    id: string;
    slug: string;
    name: string;
    customDomain: string | null;
    logoUrl: string | null;
    isActive: boolean;
}

export type TenantResolutionResult =
    | { type: 'tenant'; tenant: ResolvedTenant }
    | { type: 'marketing' }
    | { type: 'not_found' };

const MAIN_DOMAINS = [
    'triavium.com.br',
    'www.triavium.com.br',
    'sistema-triavium-educacao.vercel.app',
    'localhost:3000',
    'localhost',
];

const IGNORED_SUBDOMAINS = ['www', 'app', 'api'];

export function extractSubdomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0];

    // Check if it's a main domain (no tenant subdomain)
    if (MAIN_DOMAINS.some(d => hostname.includes(d.split(':')[0]))) {
        const parts = host.split('.');

        // For triavium.com.br: need at least 4 parts for subdomain (sub.triavium.com.br)
        // For localhost: need at least 2 parts (sub.localhost)
        if (host.includes('triavium.com.br') && parts.length >= 4) {
            const subdomain = parts[0];
            if (!IGNORED_SUBDOMAINS.includes(subdomain)) {
                return subdomain;
            }
        } else if (host.includes('vercel.app') && parts.length >= 4) {
            const subdomain = parts[0];
            if (!IGNORED_SUBDOMAINS.includes(subdomain)) {
                return subdomain;
            }
        } else if (host.includes('localhost') && parts.length >= 2) {
            const subdomain = parts[0];
            if (subdomain !== 'localhost' && !IGNORED_SUBDOMAINS.includes(subdomain)) {
                return subdomain;
            }
        }
    }

    return null;
}

export function isMainDomain(hostname: string): boolean {
    const host = hostname.split(':')[0];

    // Check exact matches for root/www
    for (const domain of MAIN_DOMAINS) {
        const domainHost = domain.split(':')[0];
        if (host === domainHost || host === `www.${domainHost}`) {
            return true;
        }
    }

    // localhost without subdomain
    if (host === 'localhost') {
        return true;
    }

    return false;
}

export function isCustomDomain(hostname: string): boolean {
    const host = hostname.split(':')[0];

    // If it's not a triavium domain, vercel app, or localhost, it's a custom domain
    return !MAIN_DOMAINS.some(d => host.includes(d.split(':')[0]));
}

export async function resolveTenant(request: NextRequest): Promise<TenantResolutionResult> {
    const hostname = request.headers.get('host') || 'localhost:3000';

    // Priority 0: Main domain (www, root) → Marketing
    if (isMainDomain(hostname) && !extractSubdomain(hostname)) {
        return { type: 'marketing' };
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll() {
                    // Read-only in this context
                },
            },
        }
    );

    // Priority 1: Custom domain match
    if (isCustomDomain(hostname)) {
        const customDomain = hostname.split(':')[0]; // Remove port

        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, slug, name, customDomain, logoUrl, isActive')
            .eq('customDomain', customDomain)
            .eq('isActive', true)
            .single();

        if (tenant) {
            return {
                type: 'tenant',
                tenant: {
                    id: tenant.id,
                    slug: tenant.slug,
                    name: tenant.name,
                    customDomain: tenant.customDomain,
                    logoUrl: tenant.logoUrl,
                    isActive: tenant.isActive,
                },
            };
        }

        return { type: 'not_found' };
    }

    // Priority 2: Subdomain match by slug
    const subdomain = extractSubdomain(hostname);

    if (subdomain) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, slug, name, customDomain, logoUrl, isActive')
            .eq('slug', subdomain)
            .eq('isActive', true)
            .single();

        if (tenant) {
            return {
                type: 'tenant',
                tenant: {
                    id: tenant.id,
                    slug: tenant.slug,
                    name: tenant.name,
                    customDomain: tenant.customDomain,
                    logoUrl: tenant.logoUrl,
                    isActive: tenant.isActive,
                },
            };
        }

        return { type: 'not_found' };
    }

    // Default: Marketing page
    return { type: 'marketing' };
}

export function getTenantUrl(tenant: { slug: string; customDomain?: string | null }): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br';

    // Prefer custom domain if available
    if (tenant.customDomain) {
        return `https://${tenant.customDomain}`;
    }

    // Otherwise use subdomain
    const url = new URL(baseUrl);
    return `${url.protocol}//${tenant.slug}.${url.host}`;
}
