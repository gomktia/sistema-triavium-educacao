'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateExcelReport } from '@/app/actions/reports';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

export function GeneralListExport() {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const result = await generateExcelReport();

            if (result.success && result.base64 && result.filename) {
                // Convert base64 to blob
                const byteCharacters = atob(result.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success("Relatório gerado com sucesso!");
            } else {
                toast.error(result.error || "Erro ao gerar relatório.");
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Erro na conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={loading}
            variant="outline"
            className="w-full text-xs font-extrabold uppercase tracking-wider rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 active:scale-95 transition-all h-10"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Agora
                </>
            )}
        </Button>
    );
}
