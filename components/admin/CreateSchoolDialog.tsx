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
import { Building2, Loader2, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ORG_TYPES = [
    { value: 'EDUCATIONAL', label: 'Escola' },
    { value: 'MILITARY', label: 'Militar' },
    { value: 'CORPORATE', label: 'Corporativo' },
    { value: 'SPORTS', label: 'Esportivo' },
];

export function CreateSchoolDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [form, setForm] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        organizationType: 'EDUCATIONAL',
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setForm(prev => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim() || !form.slug.trim()) {
            toast.error('Preencha os campos obrigatorios');
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/create-school', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao criar escola');
                }

                const data = await response.json();
                toast.success(`Escola "${form.name}" criada com sucesso!`);
                toast.info(`Subdominio: ${form.slug}.triavium.com.br`);
                setOpen(false);
                resetForm();

                // Revalidar pagina
                window.location.reload();
            } catch (error: any) {
                toast.error(error.message || 'Erro ao criar escola');
            }
        });
    };

    const resetForm = () => {
        setForm({
            name: '',
            slug: '',
            email: '',
            phone: '',
            city: '',
            state: '',
            organizationType: 'EDUCATIONAL',
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-xs uppercase">
                    Cadastrar Nova Escola
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <Building2 size={24} />
                    </div>
                    <DialogTitle className="text-xl font-black">Nova Organizacao</DialogTitle>
                    <DialogDescription>
                        Cadastre uma nova escola ou organizacao no Triavium SaaS.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Nome da Organizacao *
                            </Label>
                            <Input
                                value={form.name}
                                onChange={handleNameChange}
                                placeholder="Ex: Colegio Modelo"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Subdominio *
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={form.slug}
                                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                    placeholder="colegio-modelo"
                                    className="h-12 rounded-xl flex-1"
                                />
                                <span className="text-sm text-slate-400 font-mono whitespace-nowrap">
                                    .triavium.com.br
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="contato@escola.com"
                                    className="h-11 rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Telefone
                            </Label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(11) 99999-9999"
                                    className="h-11 rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Cidade
                            </Label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={form.city}
                                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Sao Paulo"
                                    className="h-11 rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Estado
                            </Label>
                            <Input
                                value={form.state}
                                onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                                placeholder="SP"
                                maxLength={2}
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Tipo de Organizacao
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {ORG_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, organizationType: t.value }))}
                                    className={cn(
                                        "p-3 rounded-xl border-2 text-sm font-bold transition-all",
                                        form.organizationType === t.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-100 text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    {t.label}
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
                                'Criar Organizacao'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
