'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
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
import { UserMinus, Loader2 } from 'lucide-react';
import { removeStudentFromClass } from '@/app/actions/classrooms';
import { toast } from 'sonner';

interface RemoveStudentButtonProps {
    studentId: string;
    studentName: string;
}

export function RemoveStudentButton({ studentId, studentName }: RemoveStudentButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleRemove = () => {
        startTransition(async () => {
            try {
                await removeStudentFromClass(studentId);
                toast.success(`${studentName} removido da turma`);
            } catch (error: any) {
                toast.error(error.message || 'Erro ao remover aluno');
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <UserMinus size={16} />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remover aluno da turma?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>{studentName}</strong> sera removido desta turma. Voce pode adiciona-lo novamente depois.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} className="bg-rose-600 hover:bg-rose-700">
                        Remover
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
