'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileHeart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyReportDialogProps {
    studentName: string;
    grade: string;
    signatureStrengths: { label: string; virtue: string; description: string; tip: string }[];
    evolutionNarrative: string;
    homeSuggestions: { strengthLabel: string; activities: string[] }[];
    schoolName: string;
    professionalName: string;
    professionalRole: string;
}

const MAX_MESSAGE_LENGTH = 500;

export function FamilyReportDialog({
    studentName,
    grade,
    signatureStrengths,
    evolutionNarrative,
    homeSuggestions,
    schoolName,
    professionalName,
    professionalRole,
}: FamilyReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [personalMessage, setPersonalMessage] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleGeneratePDF = () => {
        startTransition(async () => {
            try {
                const [{ pdf }, { TalentReport }] = await Promise.all([
                    import('@react-pdf/renderer'),
                    import('@/components/reports/TalentReport'),
                ]);

                const blob = await pdf(
                    <TalentReport
                        studentName={studentName}
                        grade={grade}
                        signatureStrengths={signatureStrengths}
                        evolutionNarrative={evolutionNarrative}
                        homeSuggestions={homeSuggestions}
                        schoolName={schoolName}
                        professionalName={professionalName}
                        professionalRole={professionalRole}
                        personalMessage={personalMessage.trim() || undefined}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '-');
                const date = new Date().toISOString().split('T')[0];
                const link = document.createElement('a');
                link.href = url;
                link.download = `relatorio-familia-${safeName}-${date}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success('Relatorio para a familia gerado com sucesso!');
                setOpen(false);
                setPersonalMessage('');
            } catch (error) {
                console.error('Error generating family report PDF:', error);
                toast.error('Erro ao gerar relatorio para a familia');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                >
                    <FileHeart className="h-4 w-4 mr-2" />
                    Relatorio para Familia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Relatorio para a Familia</DialogTitle>
                    <DialogDescription>
                        Gerar relatorio de {studentName} com forcas, evolucao e sugestoes para a familia.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    <Label htmlFor="personal-message">
                        Mensagem personalizada para a familia (opcional)
                    </Label>
                    <Textarea
                        id="personal-message"
                        value={personalMessage}
                        onChange={(e) => {
                            const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                            setPersonalMessage(value);
                        }}
                        placeholder="Escreva uma mensagem personalizada para os responsaveis. Ex: 'O Joao tem demonstrado grande evolucao na capacidade de trabalhar em equipe...'"
                        className="min-h-[120px] resize-none"
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {personalMessage.length}/{MAX_MESSAGE_LENGTH}
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGeneratePDF}
                        disabled={isPending}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <FileHeart className="h-4 w-4 mr-2" />
                        )}
                        {isPending ? 'Gerando...' : 'Gerar PDF'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
