'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Registrar fontes se necessario (usando padrao para evitar erros de setup)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 12,
        color: '#1e293b',
    },
    header: {
        marginBottom: 30,
        borderBottom: '2pt solid #4f46e5',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'black',
        color: '#4f46e5',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase',
    },
    studentInfo: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#334155',
    },
    strengthCard: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    strengthName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    strengthVirtue: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    strengthDesc: {
        fontSize: 9,
        lineHeight: 1.4,
        color: '#475569',
    },
    tipBox: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 4,
    },
    tipText: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#1e40af',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTop: '0.5pt solid #e2e8f0',
        paddingTop: 10,
    },
    // Page 2 styles
    evolutionSection: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#f0fdf4',
        borderLeft: '3pt solid #22c55e',
        borderRadius: 4,
    },
    evolutionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#166534',
        marginBottom: 8,
    },
    evolutionText: {
        fontSize: 10,
        lineHeight: 1.5,
        color: '#334155',
    },
    suggestionCard: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#fefce8',
        borderRadius: 6,
    },
    suggestionStrength: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#854d0e',
        marginBottom: 6,
    },
    suggestionItem: {
        fontSize: 9,
        lineHeight: 1.4,
        color: '#475569',
        marginBottom: 3,
        paddingLeft: 8,
    },
    // Page 3 styles
    messageSection: {
        marginBottom: 20,
        padding: 14,
        borderLeft: '3pt solid #4f46e5',
        borderRadius: 4,
        backgroundColor: '#f8fafc',
    },
    messageTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginBottom: 8,
    },
    messageText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#334155',
        fontStyle: 'italic',
    },
    signatureBlock: {
        marginTop: 40,
        paddingTop: 15,
        borderTop: '1pt solid #e2e8f0',
        alignItems: 'flex-end',
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    signatureRole: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
});

interface Strength {
    label: string;
    virtue: string;
    description: string;
    tip: string;
}

interface TalentReportProps {
    studentName: string;
    grade: string;
    signatureStrengths: Strength[];
    // New optional props for Family Report
    schoolName?: string;
    evolutionNarrative?: string;
    homeSuggestions?: { strengthLabel: string; activities: string[] }[];
    personalMessage?: string;
    professionalName?: string;
    professionalRole?: string;
}

export function TalentReport({
    studentName,
    grade,
    signatureStrengths,
    schoolName,
    evolutionNarrative,
    homeSuggestions,
    personalMessage,
    professionalName,
    professionalRole,
}: TalentReportProps) {
    const isFamilyReport = !!schoolName;
    const reportTitle = isFamilyReport ? 'Relat\u00f3rio para a Fam\u00edlia' : 'Mapa de Talentos';
    const reportSubtitle = isFamilyReport
        ? `${schoolName} - Relat\u00f3rio Individual`
        : 'Sistema de Gest\u00e3o Socioemocional - Relat\u00f3rio Individual';
    const documentTitle = isFamilyReport
        ? `Relat\u00f3rio para Fam\u00edlia - ${studentName}`
        : `Mapa de Talentos - ${studentName}`;

    const showPage2 = !!evolutionNarrative || (homeSuggestions && homeSuggestions.length > 0);
    const showPage3 = !!personalMessage;

    return (
        <Document title={documentTitle}>
            {/* Page 1: Strengths */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>{reportTitle}</Text>
                    <Text style={styles.subtitle}>{reportSubtitle}</Text>
                </View>

                <View style={styles.studentInfo}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{studentName}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>S\u00e9rie: {grade}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                        Data de Emiss\u00e3o: {new Date().toLocaleDateString('pt-BR')}
                    </Text>
                </View>

                <View>
                    <Text style={styles.sectionTitle}>Suas 5 For\u00e7as de Assinatura</Text>
                    <Text style={{ fontSize: 9, marginBottom: 15, color: '#64748b' }}>
                        As for\u00e7as de assinatura s\u00e3o os tra\u00e7os de car\u00e1ter que mais te definem. Us\u00e1-las traz mais satisfa\u00e7\u00e3o e sucesso no seu dia a dia.
                    </Text>

                    {signatureStrengths.map((s, i) => (
                        <View key={i} style={styles.strengthCard}>
                            <Text style={styles.strengthName}>{i + 1}. {s.label}</Text>
                            <Text style={styles.strengthVirtue}>Virtude: {s.virtue}</Text>
                            <Text style={styles.strengthDesc}>{s.description}</Text>
                            <View style={styles.tipBox}>
                                <Text style={styles.tipText}>Dica para a Fam\u00edlia: {s.tip}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>
                    Este documento \u00e9 uma ferramenta pedag\u00f3gica baseada no framework VIA Character.
                    {'\u00a9'} 2026 Sistema de Gest\u00e3o Socioemocional
                </Text>
            </Page>

            {/* Page 2: Evolution + Home Suggestions */}
            {showPage2 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{reportTitle}</Text>
                        <Text style={styles.subtitle}>{reportSubtitle}</Text>
                    </View>

                    {evolutionNarrative && (
                        <View style={styles.evolutionSection}>
                            <Text style={styles.evolutionTitle}>Evolu\u00e7\u00e3o do Desenvolvimento</Text>
                            <Text style={styles.evolutionText}>{evolutionNarrative}</Text>
                        </View>
                    )}

                    {homeSuggestions && homeSuggestions.length > 0 && (
                        <View>
                            <Text style={styles.sectionTitle}>Sugest\u00f5es de Atividades para Casa</Text>
                            <Text style={{ fontSize: 9, marginBottom: 15, color: '#64748b' }}>
                                Baseadas nas for\u00e7as de assinatura, estas atividades ajudam a fortalecer o desenvolvimento socioemocional em fam\u00edlia.
                            </Text>

                            {homeSuggestions.map((suggestion, idx) => (
                                <View key={idx} style={styles.suggestionCard}>
                                    <Text style={styles.suggestionStrength}>{suggestion.strengthLabel}</Text>
                                    {suggestion.activities.map((activity, actIdx) => (
                                        <Text key={actIdx} style={styles.suggestionItem}>
                                            {'\u2022'} {activity}
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.footer}>
                        Este documento \u00e9 uma ferramenta pedag\u00f3gica baseada no framework VIA Character.
                        {'\u00a9'} 2026 Sistema de Gest\u00e3o Socioemocional
                    </Text>
                </Page>
            )}

            {/* Page 3: Personal Message */}
            {showPage3 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Mensagem da Equipe</Text>
                        <Text style={styles.subtitle}>Comunica\u00e7\u00e3o Escola-Fam\u00edlia</Text>
                    </View>

                    <View style={styles.messageSection}>
                        <Text style={styles.messageTitle}>Mensagem para a Fam\u00edlia</Text>
                        <Text style={styles.messageText}>{personalMessage}</Text>
                    </View>

                    <View style={styles.signatureBlock}>
                        {professionalName && (
                            <Text style={styles.signatureName}>{professionalName}</Text>
                        )}
                        {professionalRole && (
                            <Text style={styles.signatureRole}>{professionalRole}</Text>
                        )}
                        <Text style={styles.signatureRole}>
                            {schoolName || 'Institui\u00e7\u00e3o de Ensino'}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
                            Gerado em: {new Date().toLocaleDateString('pt-BR')}
                        </Text>
                    </View>

                    <Text style={styles.footer}>
                        Este documento \u00e9 uma ferramenta pedag\u00f3gica. Em caso de d\u00favidas, entre em contato com a equipe escolar.
                    </Text>
                </Page>
            )}
        </Document>
    );
}
