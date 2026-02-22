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
import { Plus, Loader2, School } from 'lucide-react';
import { createClassroom } from '@/app/actions/classrooms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GRADES = [
    { value: 'ANO_1_EM', label: '1a Serie EM' },
    { value: 'ANO_2_EM', label: '2a Serie EM' },
    { value: 'ANO_3_EM', label: '3a Serie EM' },
];

const SHIFTS = [
    { value: 'MANHA', label: 'Manha' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' },
    { value: 'INTEGRAL', label: 'Integral' },
];

interface CreateClassroomDialogProps {
    variant?: 'default' | 'empty';
}

export function CreateClassroomDialog({ variant = 'default' }: CreateClassroomDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('ANO_1_EM');
    const [shift, setShift] = useState('MANHA');
    const [isPending, startTransition] = useTransition();

    const currentYear = new Date().getFullYear();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Informe o nome da turma');
            return;
        }

        startTransition(async () => {
            try {
                await createClassroom({
                    name: name.trim(),
                    grade: grade as any,
                    year: currentYear,
                    shift,
                });
                toast.success('Turma criada com sucesso!');
                setName('');
                setOpen(false);
            } catch (error: any) {
                toast.error(error.message || 'Erro ao criar turma');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === 'empty' ? (
                    <Button className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                        Criar primeira turma agora
                    </Button>
                ) : (
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                        <Plus className="mr-2 h-5 w-5" />
                        Nova Turma
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <School size={24} />
                    </div>
                    <DialogTitle className="text-xl font-black">Nova Turma</DialogTitle>
                    <DialogDescription>
                        Crie uma nova turma para organizar seus alunos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Nome da Turma
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Turma A, 1o Ano A..."
                            className="h-12 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Serie
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {GRADES.map((g) => (
                                <button
                                    key={g.value}
                                    type="button"
                                    onClick={() => setGrade(g.value)}
                                    className={cn(
                                        "p-3 rounded-xl border-2 text-sm font-bold transition-all",
                                        grade === g.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-100 text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Turno
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {SHIFTS.map((s) => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setShift(s.value)}
                                    className={cn(
                                        "p-2 rounded-xl border-2 text-xs font-bold transition-all",
                                        shift === s.value
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-100 text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    {s.label}
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
                                'Criar Turma'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
