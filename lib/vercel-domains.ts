/**
 * Vercel Domains API Integration
 *
 * Required environment variables:
 * - VERCEL_API_TOKEN: Your Vercel API token (from https://vercel.com/account/tokens)
 * - VERCEL_PROJECT_ID: The project ID (found in project settings)
 * - VERCEL_TEAM_ID: (Optional) Team ID if using a team account
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelDomainResponse {
    name: string;
    apexName: string;
    projectId: string;
    verified: boolean;
    verification?: Array<{
        type: string;
        domain: string;
        value: string;
        reason: string;
    }>;
    error?: {
        code: string;
        message: string;
    };
}

interface DomainResult {
    success: boolean;
    domain?: string;
    verified?: boolean;
    verificationRecords?: Array<{
        type: string;
        name: string;
        value: string;
    }>;
    error?: string;
}

function getVercelHeaders(): HeadersInit {
    const token = process.env.VERCEL_API_TOKEN;

    if (!token) {
        throw new Error('VERCEL_API_TOKEN não configurado');
    }

    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

function getTeamQuery(): string {
    const teamId = process.env.VERCEL_TEAM_ID;
    return teamId ? `?teamId=${teamId}` : '';
}

/**
 * Add a custom domain to the Vercel project
 */
export async function addDomainToVercel(domain: string): Promise<DomainResult> {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
        return { success: false, error: 'VERCEL_PROJECT_ID não configurado' };
    }

    try {
        const response = await fetch(
            `${VERCEL_API_BASE}/v10/projects/${projectId}/domains${getTeamQuery()}`,
            {
                method: 'POST',
                headers: getVercelHeaders(),
                body: JSON.stringify({ name: domain }),
            }
        );

        const data: VercelDomainResponse = await response.json();

        if (!response.ok) {
            // Handle specific error codes
            if (data.error?.code === 'domain_already_in_use') {
                return { success: false, error: 'Este domínio já está em uso em outro projeto' };
            }
            if (data.error?.code === 'invalid_domain') {
                return { success: false, error: 'Domínio inválido' };
            }
            return { success: false, error: data.error?.message || 'Erro ao adicionar domínio' };
        }

        // If domain needs verification, return the DNS records
        if (data.verification && data.verification.length > 0) {
            return {
                success: true,
                domain: data.name,
                verified: false,
                verificationRecords: data.verification.map((v) => ({
                    type: v.type,
                    name: v.domain,
                    value: v.value,
                })),
            };
        }

        return {
            success: true,
            domain: data.name,
            verified: data.verified,
        };
    } catch (error: any) {
        console.error('Error adding domain to Vercel:', error);
        return { success: false, error: error.message || 'Erro de conexão com Vercel API' };
    }
}

/**
 * Remove a custom domain from the Vercel project
 */
export async function removeDomainFromVercel(domain: string): Promise<DomainResult> {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
        return { success: false, error: 'VERCEL_PROJECT_ID não configurado' };
    }

    try {
        const response = await fetch(
            `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}${getTeamQuery()}`,
            {
                method: 'DELETE',
                headers: getVercelHeaders(),
            }
        );

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erro ao remover domínio' };
        }

        return { success: true, domain };
    } catch (error: any) {
        console.error('Error removing domain from Vercel:', error);
        return { success: false, error: error.message || 'Erro de conexão com Vercel API' };
    }
}

/**
 * Check domain verification status
 */
export async function checkDomainVerification(domain: string): Promise<DomainResult> {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
        return { success: false, error: 'VERCEL_PROJECT_ID não configurado' };
    }

    try {
        const response = await fetch(
            `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}${getTeamQuery()}`,
            {
                method: 'GET',
                headers: getVercelHeaders(),
            }
        );

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Domínio não encontrado' };
        }

        const data: VercelDomainResponse = await response.json();

        return {
            success: true,
            domain: data.name,
            verified: data.verified,
            verificationRecords: data.verification?.map((v) => ({
                type: v.type,
                name: v.domain,
                value: v.value,
            })),
        };
    } catch (error: any) {
        console.error('Error checking domain verification:', error);
        return { success: false, error: error.message || 'Erro de conexão com Vercel API' };
    }
}

/**
 * Verify a domain (trigger verification check)
 */
export async function verifyDomain(domain: string): Promise<DomainResult> {
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
        return { success: false, error: 'VERCEL_PROJECT_ID não configurado' };
    }

    try {
        const response = await fetch(
            `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}/verify${getTeamQuery()}`,
            {
                method: 'POST',
                headers: getVercelHeaders(),
            }
        );

        const data: VercelDomainResponse = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error?.message || 'Erro ao verificar domínio' };
        }

        return {
            success: true,
            domain: data.name,
            verified: data.verified,
        };
    } catch (error: any) {
        console.error('Error verifying domain:', error);
        return { success: false, error: error.message || 'Erro de conexão com Vercel API' };
    }
}
