'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
    id: string;
    name: string;
    grade: string;
    tier?: string | null;
}

interface ExportStudentsPDFProps {
    students: Student[];
    organizationName?: string;
}

export function ExportStudentsPDF({ students, organizationName = 'Triavium' }: ExportStudentsPDFProps) {
    const [isPending, startTransition] = useTransition();

    const handleExport = () => {
        startTransition(async () => {
            try {
                // Importar dinamicamente para evitar problemas de SSR
                const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

                const styles = StyleSheet.create({
                    page: {
                        padding: 40,
                        fontFamily: 'Helvetica',
                    },
                    header: {
                        marginBottom: 30,
                        borderBottomWidth: 2,
                        borderBottomColor: '#4f46e5',
                        paddingBottom: 15,
                    },
                    title: {
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#1e293b',
                    },
                    subtitle: {
                        fontSize: 12,
                        color: '#64748b',
                        marginTop: 5,
                    },
                    table: {
                        marginTop: 20,
                    },
                    tableHeader: {
                        flexDirection: 'row',
                        backgroundColor: '#f1f5f9',
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#e2e8f0',
                    },
                    tableRow: {
                        flexDirection: 'row',
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f1f5f9',
                    },
                    colName: {
                        width: '50%',
                        fontSize: 10,
                    },
                    colGrade: {
                        width: '25%',
                        fontSize: 10,
                    },
                    colTier: {
                        width: '25%',
                        fontSize: 10,
                    },
                    headerText: {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#475569',
                        textTransform: 'uppercase',
                    },
                    tier1: {
                        color: '#059669',
                    },
                    tier2: {
                        color: '#d97706',
                    },
                    tier3: {
                        color: '#dc2626',
                    },
                    footer: {
                        position: 'absolute',
                        bottom: 30,
                        left: 40,
                        right: 40,
                        fontSize: 8,
                        color: '#94a3b8',
                        textAlign: 'center',
                        borderTopWidth: 1,
                        borderTopColor: '#e2e8f0',
                        paddingTop: 10,
                    },
                });

                const getTierStyle = (tier: string | null | undefined) => {
                    if (tier === 'TIER_1') return styles.tier1;
                    if (tier === 'TIER_2') return styles.tier2;
                    if (tier === 'TIER_3') return styles.tier3;
                    return {};
                };

                const getTierLabel = (tier: string | null | undefined) => {
                    if (tier === 'TIER_1') return 'Baixo Risco';
                    if (tier === 'TIER_2') return 'Risco Moderado';
                    if (tier === 'TIER_3') return 'Alto Risco';
                    return 'Pendente';
                };

                const getGradeLabel = (grade: string) => {
                    if (grade === 'ANO_1_EM') return '1a Serie EM';
                    if (grade === 'ANO_2_EM') return '2a Serie EM';
                    if (grade === 'ANO_3_EM') return '3a Serie EM';
                    return grade;
                };

                const MyDocument = () => (
                    <Document>
                        <Page size="A4" style={styles.page}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Relatorio de Alunos</Text>
                                <Text style={styles.subtitle}>
                                    {organizationName} - Gerado em {new Date().toLocaleDateString('pt-BR')}
                                </Text>
                            </View>

                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.colName, styles.headerText]}>Nome</Text>
                                    <Text style={[styles.colGrade, styles.headerText]}>Serie</Text>
                                    <Text style={[styles.colTier, styles.headerText]}>Status de Risco</Text>
                                </View>

                                {students.map((student, index) => (
                                    <View key={student.id} style={styles.tableRow}>
                                        <Text style={styles.colName}>{student.name}</Text>
                                        <Text style={styles.colGrade}>{getGradeLabel(student.grade)}</Text>
                                        <Text style={[styles.colTier, getTierStyle(student.tier)]}>
                                            {getTierLabel(student.tier)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <Text style={styles.footer}>
                                Este documento e confidencial e de uso exclusivo da instituicao.
                                Triavium Educacao e Desenvolvimento LTDA
                            </Text>
                        </Page>
                    </Document>
                );

                const blob = await pdf(<MyDocument />).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `relatorio-alunos-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success('PDF exportado com sucesso!');
            } catch (error: any) {
                console.error('Error generating PDF:', error);
                toast.error('Erro ao gerar PDF');
            }
        });
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isPending || students.length === 0}
            variant="outline"
            className="border-slate-200 hover:border-indigo-500 hover:text-indigo-600"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <FileDown className="h-4 w-4 mr-2" />
            )}
            Exportar Lista (PDF)
        </Button>
    );
}
