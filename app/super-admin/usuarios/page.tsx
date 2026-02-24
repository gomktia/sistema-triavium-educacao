import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { getUsers } from '@/app/actions/super-admin';
import { UsersManager } from './users-manager';

export const metadata = {
    title: 'Gestao de Usuarios | Triavium SaaS',
};

export default async function UsuariosPage() {
    await requireSuperAdmin();

    const [initialData, tenants] = await Promise.all([
        getUsers(),
        prisma.tenant.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return <UsersManager initialData={initialData} tenants={tenants} />;
}
