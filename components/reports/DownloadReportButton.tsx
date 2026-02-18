'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { TalentReport } from './TalentReport';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DownloadReportButtonProps {
    studentName: string;
    grade: string;
    signatureStrengths: any[];
}

export function DownloadReportButton({ studentName, grade, signatureStrengths }: DownloadReportButtonProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button
                variant="outline"
                disabled
                className="bg-white border-slate-200 text-slate-600"
            >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando PDF...
            </Button>
        );
    }

    return (
        <PDFDownloadLink
            document={
                <TalentReport
                    studentName={studentName}
                    grade={grade}
                    signatureStrengths={signatureStrengths}
                />
            }
            fileName={`Mapa_de_Talentos_${studentName.replace(/ /g, '_')}.pdf`}
        >
            {({ blob, url, loading, error }) => (
                <Button
                    variant="outline"
                    disabled={loading}
                    className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="mr-2 h-4 w-4" />
                    )}
                    Baixar Mapa de Talentos (PDF)
                </Button>
            )}
        </PDFDownloadLink>
    );
}
