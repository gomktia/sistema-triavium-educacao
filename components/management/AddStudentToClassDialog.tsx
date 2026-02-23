'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2, Check } from 'lucide-react';
import { addStudentsToClass } from '@/app/actions/classrooms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Student {
    id: string;
    name: string;
    grade: string;
}

interface AddStudentToClassDialogProps {
    classroomId: string;
    classroomName: string;
    availableStudents: Student[];
}

export function AddStudentToClassDialog({ classroomId, classroomName, availableStudents }: AddStudentToClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const toggleStudent = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (selectedIds.length === 0) {
            toast.error('Selecione pelo menos um aluno');
            return;
        }

        startTransition(async () => {
            try {
                await addStudentsToClass(classroomId, selectedIds);
                toast.success(`${selectedIds.length} aluno(s) adicionado(s) com sucesso!`);
                setSelectedIds([]);
                setOpen(false);
            } catch (error: any) {
                toast.error(error.message || 'Erro ao adicionar alunos');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-11 px-6 font-bold shadow-lg shadow-indigo-200">
                    <UserPlus size={18} className="mr-2" />
                    Adicionar Alunos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Adicionar Alunos</DialogTitle>
                    <DialogDescription>
                        Selecione os alunos para adicionar a turma <strong>{classroomName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {availableStudents.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
                        {availableStudents.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => toggleStudent(student.id)}
                                className={cn(
                                    "w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all",
                                    selectedIds.includes(student.id)
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                        {student.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                                </div>
                                {selectedIds.includes(student.id) && (
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-500">
                        <p className="text-sm">Todos os alunos ja estao vinculados a uma turma.</p>
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || selectedIds.length === 0}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            `Adicionar (${selectedIds.length})`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
