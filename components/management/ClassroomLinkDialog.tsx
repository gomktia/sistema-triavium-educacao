'use client';

import { useState, useTransition } from 'react';
import { updateTeacherClassrooms } from '@/app/actions/teacher-classrooms';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap } from 'lucide-react';

interface ClassroomLinkDialogProps {
    teacherId: string;
    teacherName: string;
    allClassrooms: { id: string; name: string; grade: string }[];
    linkedClassroomIds: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClassroomLinkDialog({
    teacherId,
    teacherName,
    allClassrooms,
    linkedClassroomIds: initialLinkedIds,
    open,
    onOpenChange
}: ClassroomLinkDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialLinkedIds);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (classroomId: string) => {
        setSelectedIds(prev =>
            prev.includes(classroomId)
                ? prev.filter(id => id !== classroomId)
                : [...prev, classroomId]
        );
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateTeacherClassrooms(teacherId, selectedIds);
                toast.success('Vínculos atualizados com sucesso!');
                onOpenChange(false);
            } catch (error: any) {
                toast.error(error.message || 'Erro ao atualizar vínculos');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Gerenciar Turmas de {teacherName}
                    </DialogTitle>
                    <DialogDescription>
                        Selecione as turmas que este professor pode acessar.
                        Apenas alunos das turmas marcadas estarão visíveis para o professor.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-3">
                        {allClassrooms.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Nenhuma turma cadastrada
                            </p>
                        ) : (
                            allClassrooms.map(classroom => (
                                <label
                                    key={classroom.id}
                                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                                >
                                    <Checkbox
                                        checked={selectedIds.includes(classroom.id)}
                                        onCheckedChange={() => handleToggle(classroom.id)}
                                        disabled={isPending}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{classroom.name}</p>
                                        <p className="text-xs text-muted-foreground">{classroom.grade}</p>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || allClassrooms.length === 0}
                    >
                        {isPending ? 'Salvando...' : 'Salvar Vínculos'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
