'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Search,
    Pencil,
    UserCheck,
    UserX,
    KeyRound,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    getUsers,
    updateUserRole,
    toggleUserActive,
    resetUserPassword,
} from '@/app/actions/super-admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tenant {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    tenantId: string;
    tenant: { name: string };
}

interface UsersData {
    users: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface Filters {
    search: string;
    tenantId: string;
    role: string;
    isActive: string;
    page: number;
}

interface UsersManagerProps {
    initialData: UsersData;
    tenants: Tenant[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gestor',
    PSYCHOLOGIST: 'Psicologo',
    COUNSELOR: 'Orientador',
    TEACHER: 'Professor',
    STUDENT: 'Aluno',
    RESPONSIBLE: 'Responsavel',
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
    ADMIN: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-violet-100 text-violet-700',
    PSYCHOLOGIST: 'bg-emerald-100 text-emerald-700',
    COUNSELOR: 'bg-sky-100 text-sky-700',
    TEACHER: 'bg-amber-100 text-amber-700',
    STUDENT: 'bg-slate-100 text-slate-500',
    RESPONSIBLE: 'bg-slate-100 text-slate-500',
};

const ASSIGNABLE_ROLES = ['ADMIN', 'MANAGER', 'PSYCHOLOGIST', 'COUNSELOR', 'TEACHER'] as const;

const ALL_FILTER_ROLES = [
    'ADMIN',
    'MANAGER',
    'PSYCHOLOGIST',
    'COUNSELOR',
    'TEACHER',
    'STUDENT',
    'RESPONSIBLE',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UsersManager({ initialData, tenants }: UsersManagerProps) {
    const [data, setData] = useState<UsersData>(initialData);
    const [filters, setFilters] = useState<Filters>({
        search: '',
        tenantId: '',
        role: '',
        isActive: '',
        page: 1,
    });
    const [isPending, startTransition] = useTransition();

    // Dialog state
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('');
    const [resetUser, setResetUser] = useState<User | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);

    // Invite form state
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
    const [inviteTenantId, setInviteTenantId] = useState('');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // -------------------------------------------------------------------
    // Fetch users when filters change
    // -------------------------------------------------------------------

    const fetchUsers = useCallback(
        function fetchUsers(overrides?: Partial<Filters>) {
            const merged = { ...filters, ...overrides };

            startTransition(async () => {
                const result = await getUsers({
                    search: merged.search || undefined,
                    tenantId: merged.tenantId || undefined,
                    role: merged.role || undefined,
                    isActive:
                        merged.isActive === 'true'
                            ? true
                            : merged.isActive === 'false'
                              ? false
                              : undefined,
                    page: merged.page,
                    pageSize: 50,
                });
                setData(result);
            });
        },
        [filters]
    );

    function handleSearchChange(value: string) {
        setFilters((prev) => ({ ...prev, search: value, page: 1 }));

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchUsers({ search: value, page: 1 });
        }, 400);
    }

    function handleFilterChange(key: keyof Filters, value: string) {
        const updated = { ...filters, [key]: value, page: 1 };
        setFilters(updated);
        fetchUsers({ [key]: value, page: 1 });
    }

    function handlePageChange(newPage: number) {
        setFilters((prev) => ({ ...prev, page: newPage }));
        fetchUsers({ page: newPage });
    }

    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // -------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------

    function handleEditOpen(user: User) {
        setEditUser(user);
        setEditRole(user.role);
    }

    function handleEditSave() {
        if (!editUser) return;

        startTransition(async () => {
            const result = await updateUserRole(editUser.id, editRole);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(`Funcao de ${editUser.name} atualizada para ${ROLE_LABELS[editRole]}.`);
            setEditUser(null);
            fetchUsers();
        });
    }

    function handleToggleActive(user: User) {
        startTransition(async () => {
            const result = await toggleUserActive(user.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            const status = result.isActive ? 'ativado' : 'desativado';
            toast.success(`${user.name} foi ${status}.`);
            fetchUsers();
        });
    }

    function handleResetConfirm() {
        if (!resetUser) return;

        startTransition(async () => {
            const result = await resetUserPassword(resetUser.id);
            if (result.error) {
                toast.error(result.error);
                setResetUser(null);
                return;
            }
            if (result.recoveryLink) {
                toast.success('Link de recuperacao gerado com sucesso.', {
                    description: 'O link foi copiado para a area de transferencia.',
                    duration: 6000,
                });
                navigator.clipboard.writeText(result.recoveryLink).catch(() => {
                    // Clipboard access may fail silently
                });
            } else {
                toast.success('Link de recuperacao enviado por email.');
            }
            setResetUser(null);
        });
    }

    function handleInviteSubmit() {
        if (!inviteName || !inviteEmail || !inviteRole || !inviteTenantId) {
            toast.error('Preencha todos os campos.');
            return;
        }

        startTransition(async () => {
            const res = await fetch('/api/invite-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    name: inviteName,
                    role: inviteRole,
                    tenantId: inviteTenantId,
                }),
            });

            const body = await res.json();

            if (!res.ok || body.error) {
                toast.error(body.error || 'Erro ao convidar usuario.');
                return;
            }

            if (body.emailSent) {
                toast.success('Convite enviado por email com sucesso.');
            } else {
                toast.success('Usuario criado. Link de convite gerado.', {
                    description: body.emailError || 'Email nao enviado.',
                    duration: 6000,
                });
            }

            setInviteOpen(false);
            setInviteName('');
            setInviteEmail('');
            setInviteRole('');
            setInviteTenantId('');
            fetchUsers();
        });
    }

    // -------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                            <Users size={14} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                            Cross-Tenant
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Gestao de Usuarios
                    </h1>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-xs uppercase"
                    onClick={() => setInviteOpen(true)}
                >
                    <UserPlus size={16} className="mr-2" />
                    Convidar Usuario
                </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select
                    value={filters.tenantId}
                    onValueChange={(v) => handleFilterChange('tenantId', v === '__all__' ? '' : v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Todas as Escolas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Todas as Escolas</SelectItem>
                        {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.role}
                    onValueChange={(v) => handleFilterChange('role', v === '__all__' ? '' : v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Todas as Funcoes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Todas as Funcoes</SelectItem>
                        {ALL_FILTER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.isActive}
                    onValueChange={(v) => handleFilterChange('isActive', v === '__all__' ? '' : v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Todos os Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">
                        {data.total} usuario{data.total !== 1 ? 's' : ''} encontrado
                        {data.total !== 1 ? 's' : ''}
                    </CardTitle>
                    {isPending && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Nome</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Escola</th>
                                    <th className="px-6 py-4">Funcao</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Criado em</th>
                                    <th className="px-6 py-4 text-right">Acoes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {user.tenant.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-black uppercase tracking-widest border-none shadow-none',
                                                    ROLE_BADGE_CLASSES[user.role] ??
                                                        'bg-slate-100 text-slate-500'
                                                )}
                                            >
                                                {ROLE_LABELS[user.role] ?? user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'h-2 w-2 rounded-full',
                                                        user.isActive
                                                            ? 'bg-emerald-500'
                                                            : 'bg-rose-400'
                                                    )}
                                                />
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    {user.isActive ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                                    onClick={() => handleEditOpen(user)}
                                                    title="Editar funcao"
                                                >
                                                    <Pencil size={15} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        'h-8 w-8',
                                                        user.isActive
                                                            ? 'text-slate-400 hover:text-rose-600'
                                                            : 'text-slate-400 hover:text-emerald-600'
                                                    )}
                                                    onClick={() => handleToggleActive(user)}
                                                    title={
                                                        user.isActive
                                                            ? 'Desativar usuario'
                                                            : 'Ativar usuario'
                                                    }
                                                >
                                                    {user.isActive ? (
                                                        <UserX size={15} />
                                                    ) : (
                                                        <UserCheck size={15} />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                                    onClick={() => setResetUser(user)}
                                                    title="Redefinir senha"
                                                >
                                                    <KeyRound size={15} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {data.users.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-sm text-slate-400"
                                        >
                                            Nenhum usuario encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-400">
                                Pagina {data.page} de {data.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page <= 1}
                                    onClick={() => handlePageChange(data.page - 1)}
                                    className="h-8"
                                >
                                    <ChevronLeft size={14} className="mr-1" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page >= data.totalPages}
                                    onClick={() => handlePageChange(data.page + 1)}
                                    className="h-8"
                                >
                                    Proximo
                                    <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Role Dialog */}
            <Dialog open={editUser !== null} onOpenChange={(open) => !open && setEditUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Funcao</DialogTitle>
                        <DialogDescription>
                            Alterar a funcao de {editUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Nova Funcao</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASSIGNABLE_ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {ROLE_LABELS[r]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditUser(null)}>
                                Cancelar
                            </Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={isPending || editRole === editUser?.role}
                                onClick={handleEditSave}
                            >
                                {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reset Password Confirmation Dialog */}
            <Dialog open={resetUser !== null} onOpenChange={(open) => !open && setResetUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Redefinir Senha</DialogTitle>
                        <DialogDescription>
                            Enviar link de redefinicao de senha para {resetUser?.email}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setResetUser(null)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={isPending}
                            onClick={handleResetConfirm}
                        >
                            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                            Confirmar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invite User Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convidar Usuario</DialogTitle>
                        <DialogDescription>
                            Envie um convite para um novo membro da equipe.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Escola</Label>
                            <Select value={inviteTenantId} onValueChange={setInviteTenantId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar escola" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tenants.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Funcao</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar funcao" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASSIGNABLE_ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {ROLE_LABELS[r]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setInviteOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700"
                                disabled={isPending}
                                onClick={handleInviteSubmit}
                            >
                                {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                                Enviar Convite
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
