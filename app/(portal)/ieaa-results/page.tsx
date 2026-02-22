
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, IEAAResult, IEAADimensionScore, IEAALevel, IEAAProfile } from '@/src/core/types';
import { IEAA_LEVELS_INFO, IEAA_PROFILES_INFO, IEAA_DIMENSIONS_INFO } from '@/src/core/content/ieaa-items';
import { getIEAAInterventions } from '@/src/core/logic/ieaa';
import { IEAARadarChart } from '@/components/ieaa/IEAARadarChart';
import { BookOpen, Brain, Target, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, TrendingUp, Lightbulb, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata = {
    title: 'Resultados IEAA | Triavium',
};

function getLevelIcon(level: IEAALevel) {
    switch (level) {
        case IEAALevel.REATIVO:
            return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        case IEAALevel.TRANSICAO:
            return <TrendingUp className="w-5 h-5 text-blue-500" />;
        case IEAALevel.AUTORREGULADO:
            return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
}

function getLevelColor(level: IEAALevel) {
    switch (level) {
        case IEAALevel.REATIVO:
            return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-500 to-orange-500' };
        case IEAALevel.TRANSICAO:
            return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', gradient: 'from-blue-500 to-indigo-500' };
        case IEAALevel.AUTORREGULADO:
            return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', gradient: 'from-emerald-500 to-teal-500' };
    }
}

function getProfileColor(profile: IEAAProfile) {
    switch (profile) {
        case IEAAProfile.EXECUTIVO:
            return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: Target };
        case IEAAProfile.CIENTISTA:
            return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: Brain };
        case IEAAProfile.ENGAJADO:
            return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Sparkles };
        case IEAAProfile.VULNERAVEL:
            return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: AlertTriangle };
    }
}

function DimensionBar({ dimension }: { dimension: IEAADimensionScore }) {
    const levelColor = getLevelColor(dimension.level);
    const levelInfo = IEAA_LEVELS_INFO[dimension.level];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{dimension.label}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColor.bg} ${levelColor.text}`}>
                        {levelInfo.label}
                    </span>
                    <span className="text-sm font-black text-slate-700">{dimension.percentage.toFixed(0)}%</span>
                </div>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${levelColor.gradient} rounded-full transition-all duration-1000`}
                    style={{ width: `${dimension.percentage}%` }}
                />
            </div>
            <p className="text-xs text-slate-500">{dimension.description}</p>
        </div>
    );
}

export default async function IEAAResultsPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.STUDENT) {
        redirect('/');
    }

    if (!user.studentId) {
        redirect('/');
    }

    const assessment = await prisma.assessment.findFirst({
        where: {
            tenantId: user.tenantId,
            studentId: user.studentId,
            type: 'IEAA',
        },
        select: { processedScores: true, appliedAt: true },
        orderBy: { appliedAt: 'desc' },
    });

    if (!assessment?.processedScores) {
        redirect('/ieaa');
    }

    const result = assessment.processedScores as unknown as IEAAResult;
    const interventions = getIEAAInterventions(result);
    const levelInfo = IEAA_LEVELS_INFO[result.overallLevel];
    const levelColor = getLevelColor(result.overallLevel);
    const profileInfo = IEAA_PROFILES_INFO[result.profile];
    const profileColor = getProfileColor(result.profile);
    const ProfileIcon = profileColor.icon;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <div className="text-center max-w-xl mx-auto space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-200">
                    <BookOpen size={28} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seu Perfil de Aprendizagem</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Resultado do Inventário de Estratégias de Aprendizagem e Autorregulação
                </p>
            </div>

            {/* Main Score Card */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${levelColor.gradient}`} />
                <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {getLevelIcon(result.overallLevel)}
                        <CardTitle className={`text-2xl font-black ${levelColor.text}`}>
                            {levelInfo.label}
                        </CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        {levelInfo.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${levelColor.gradient} flex items-center justify-center shadow-2xl`}>
                                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900">{result.totalPercentage.toFixed(0)}</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">pontos %</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-slate-600 max-w-md mx-auto">
                        <p>{levelInfo.pedagogicalProfile}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Card */}
            <Card className={`border-2 ${profileColor.border} ${profileColor.bg}`}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                            <ProfileIcon className={`w-6 h-6 ${profileColor.text}`} />
                        </div>
                        <div>
                            <CardTitle className={`${profileColor.text}`}>{profileInfo.label}</CardTitle>
                            <CardDescription className="text-slate-600">{profileInfo.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-2 p-4 bg-white/60 rounded-xl">
                        <Lightbulb className={`w-5 h-5 ${profileColor.text} shrink-0 mt-0.5`} />
                        <div>
                            <p className="text-sm font-bold text-slate-700 mb-1">Recomendação de Desenvolvimento</p>
                            <p className="text-sm text-slate-600">{profileInfo.interventionFocus}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Visão Multidimensional
                    </CardTitle>
                    <CardDescription>
                        Visualização do seu perfil nas 4 dimensões da autorregulação
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IEAARadarChart dimensions={result.dimensions} />
                </CardContent>
            </Card>

            {/* Dimension Breakdown */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        Análise por Dimensão
                    </CardTitle>
                    <CardDescription>
                        Detalhamento do seu desempenho em cada área
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {result.dimensions.map((dim) => (
                        <DimensionBar key={dim.dimension} dimension={dim} />
                    ))}
                </CardContent>
            </Card>

            {/* Interventions */}
            {interventions.length > 0 && (
                <Card className="border-0 shadow-lg border-l-4 border-l-amber-400">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Sugestões de Desenvolvimento
                        </CardTitle>
                        <CardDescription>
                            Áreas prioritárias para aprimorar sua aprendizagem
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {interventions.map((intervention, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        intervention.priority === 'Alta' ? 'bg-rose-100 text-rose-700' :
                                        intervention.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-200 text-slate-600'
                                    }`}>
                                        Prioridade {intervention.priority}
                                    </span>
                                    <span className="font-bold text-slate-800">{intervention.dimension}</span>
                                </div>
                                <ul className="space-y-2">
                                    {intervention.suggestions.map((suggestion, sIdx) => (
                                        <li key={sIdx} className="flex items-start gap-2 text-sm text-slate-600">
                                            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Ethical Note */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-600">Nota sobre interpretação dos resultados</p>
                    <p>
                        Este inventário avalia estratégias de aprendizagem e não inteligência.
                        As estratégias podem ser desenvolvidas com prática e orientação adequada.
                        Os resultados são indicativos e devem ser utilizados como ponto de partida
                        para reflexão e desenvolvimento, sempre com acompanhamento pedagógico qualificado.
                    </p>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
                <Link
                    href="/inicio"
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    Voltar ao Início
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
