import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const getCachedTenant = unstable_cache(
    async (tenantId: string) => {
        return prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                subscriptionStatus: true,
                onboardingCompleted: true,
                name: true,
                organizationType: true,
            },
        });
    },
    ['tenant'],
    { revalidate: 300, tags: ['tenant'] }
);
