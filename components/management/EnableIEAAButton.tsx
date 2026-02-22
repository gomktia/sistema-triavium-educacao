
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { enableIEAAForClassroom } from '@/app/actions/classrooms';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EnableIEAAButtonProps {
    classroomId: string;
    classroomName: string;
    studentCount: number;
}

export function EnableIEAAButton({ classroomId, classroomName, studentCount }: EnableIEAAButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isEnabled, setIsEnabled] = useState(false);

    const handleEnable = async () => {
        startTransition(async () => {
            const result = await enableIEAAForClassroom(classroomId);

            if (result.success) {
                setIsEnabled(true);
                toast.success(`IEAA liberado para ${result.count} alunos da turma ${classroomName}`);
            } else {
                toast.error(result.error || 'Erro ao liberar IEAA');
            }
        });
    };

    if (isEnabled) {
        return (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                <CheckCircle2 size={18} />
                <span className="text-sm font-bold">IEAA Liberado</span>
            </div>
        );
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                    disabled={isPending || studentCount === 0}
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <BookOpen size={16} />
                    )}
                    Liberar IEAA
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <BookOpen className="text-emerald-600" size={20} />
                        Liberar IEAA para Turma
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            Ao confirmar, o questionário <strong>IEAA (Inventário de Estratégias de Aprendizagem e Autorregulação)</strong> será
                            habilitado para todos os <strong>{studentCount} alunos</strong> da turma <strong>{classroomName}</strong>.
                        </p>
                        <p className="text-xs text-slate-400">
                            Os alunos poderão acessar o questionário através do menu "IEAA" em suas contas.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleEnable}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        Liberar para {studentCount} alunos
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
