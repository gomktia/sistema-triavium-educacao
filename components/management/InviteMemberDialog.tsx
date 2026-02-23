'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROLES = [
    { value: 'TEACHER', label: 'Professor', description: 'Pode realizar triagens e visualizar suas turmas' },
    { value: 'PSYCHOLOGIST', label: 'Psicologo', description: 'Acesso completo a perfis de alunos e relatorios' },
    { value: 'COUNSELOR', label: 'Orientador', description: 'Pode gerenciar intervencoes e acompanhar alunos' },
    { value: 'MANAGER', label: 'Gestor', description: 'Acesso administrativo completo da escola' },
];

interface InviteMemberDialogProps {
    tenantId?: string;
}

export function InviteMemberDialog({ tenantId }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('TEACHER');
    const [isPending, startTransition] = useTransition();
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !name.trim()) {
            toast.error('Preencha todos os campos');
            return;
        }

        startTransition(async () => {
            try {
                // TODO: Implementar server action para criar convite
                const response = await fetch('/api/invite-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name, role, tenantId }),
                });

                if (!response.ok) {
                    throw new Error('Erro ao criar convite');
                }

                const data = await response.json();

                if (data.inviteLink) {
                    setInviteLink(data.inviteLink);
                    toast.success('Convite criado! Compartilhe o link com o colaborador.');
                } else {
                    toast.success('Convite enviado por email!');
                    setOpen(false);
                    resetForm();
                }
            } catch (error: any) {
                toast.error(error.message || 'Erro ao enviar convite');
            }
        });
    };

    const resetForm = () => {
        setEmail('');
        setName('');
        setRole('TEACHER');
        setInviteLink(null);
        setCopied(false);
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            toast.success('Link copiado!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-95 transition-all rounded-2xl">
                    <UserPlus size={18} strokeWidth={1.5} className="mr-2" /> Convidar Membro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <UserPlus size={24} />
                    </div>
                    <DialogTitle className="text-xl font-black">Convidar Novo Membro</DialogTitle>
                    <DialogDescription>
                        Adicione um colaborador a sua equipe pedagogica.
                    </DialogDescription>
                </DialogHeader>

                {inviteLink ? (
                    <div className="space-y-6 py-4">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-sm font-bold text-emerald-800 mb-3">
                                Convite criado com sucesso! Compartilhe este link:
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    value={inviteLink}
                                    readOnly
                                    className="text-xs font-mono bg-white"
                                />
                                <Button onClick={copyLink} variant="outline" size="icon">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>
                        <Button onClick={() => { setOpen(false); resetForm(); }} className="w-full">
                            Concluir
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Nome Completo
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome do colaborador"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Email Institucional
                            </Label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@escola.com"
                                    className="h-12 rounded-xl pl-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Funcao
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-left transition-all",
                                            role === r.value
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <p className={cn(
                                            "font-bold text-sm",
                                            role === r.value ? "text-indigo-700" : "text-slate-700"
                                        )}>
                                            {r.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                            {r.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Enviar Convite'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
