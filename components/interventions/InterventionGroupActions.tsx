'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { InterventionGroupForm } from './InterventionGroupForm';
import { deleteInterventionGroup } from '@/app/actions/interventions';
import type { OrganizationLabels } from '@/src/lib/utils/labels';

interface StudentOption {
    id: string;
    name: string;
    classroom: { name: string } | null;
}

interface GroupData {
    id: string;
    name: string;
    type: string;
    description: string | null;
    students: { id: string; name: string }[];
}

// ── "Novo Grupo" Button + Dialog ──────────────────────────────

export function CreateGroupButton({ students, labels }: { students: StudentOption[], labels: OrganizationLabels }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-bold"
            >
                <Plus className="mr-2" size={18} />
                Novo Grupo
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Grupo de Intervenção</DialogTitle>
                        <DialogDescription>
                            Defina o tipo de intervenção e selecione os {labels.subjects.toLowerCase()} do grupo.
                        </DialogDescription>
                    </DialogHeader>
                    <InterventionGroupForm
                        students={students}
                        labels={labels}
                        onClose={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Edit Button + Dialog ──────────────────────────────────────

export function EditGroupButton({ group, students, labels }: { group: GroupData; students: StudentOption[], labels: OrganizationLabels }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
                <Pencil size={14} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Grupo</DialogTitle>
                        <DialogDescription>
                            Atualize os dados e a composição de {labels.subjects.toLowerCase()} do grupo &quot;{group.name}&quot;.
                        </DialogDescription>
                    </DialogHeader>
                    <InterventionGroupForm
                        students={students}
                        editingGroup={group}
                        labels={labels}
                        onClose={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Delete Button + Confirmation ──────────────────────────────

export function DeleteGroupButton({ group, labels }: { group: { id: string; name: string }; labels: OrganizationLabels }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        await deleteInterventionGroup(group.id);
        setOpen(false);
        setLoading(false);
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="text-slate-500 hover:text-red-600 transition-colors"
            >
                <Trash2 size={14} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Excluir Grupo</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja desativar o grupo &quot;{group.name}&quot;?
                            Os {labels.subjects.toLowerCase()} não serão removidos do sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="flex-1 rounded-xl h-11"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 rounded-xl h-11 font-bold"
                        >
                            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                            Confirmar Exclusão
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
