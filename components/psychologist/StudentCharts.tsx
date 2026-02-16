'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell, AreaChart, Area } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Award, Target, Users } from 'lucide-react'

interface StudentChartsProps {
    evolutionData: {
        window: string
        externalizing: number
        internalizing: number
    }[]
    viaScores?: Record<string, number>
}

const VIRTUE_MAPPING: Record<string, string[]> = {
    'Sabedoria': ['Criatividade', 'Curiosidade', 'Critério', 'Amor ao Aprendizado', 'Perspectiva'],
    'Coragem': ['Bravura', 'Perseverança', 'Honestidade', 'Vitalidade'],
    'Humanidade': ['Amor', 'Bondade', 'Inteligência Social'],
    'Justiça': ['Trabalho em Equipe', 'Equidade', 'Liderança'],
    'Moderação': ['Perdão', 'Humildade', 'Prudência', 'Autocontrole'],
    'Transcendência': ['Apreciação da Beleza', 'Gratidão', 'Esperança', 'Humor', 'Espiritualidade']
}

const VIRTUE_COLORS: Record<string, string> = {
    'Sabedoria': '#8b5cf6',
    'Coragem': '#ef4444',
    'Humanidade': '#ec4899',
    'Justiça': '#3b82f6',
    'Moderação': '#10b981',
    'Transcendência': '#f59e0b'
}

export function StudentCharts({ evolutionData, viaScores }: StudentChartsProps) {
    // Calculate overall risk score (média de ext + int)
    const enrichedEvolutionData = evolutionData.map(d => ({
        ...d,
        overall: Math.round((d.externalizing + d.internalizing) / 2)
    }))

    // Calcular tier atual (baseado na última avaliação)
    const latestData = enrichedEvolutionData[enrichedEvolutionData.length - 1]
    const currentTier = latestData ? (
        latestData.overall <= 3 ? 1 : latestData.overall <= 8 ? 2 : 3
    ) : null

    // Calcular tendência
    const trend = enrichedEvolutionData.length >= 2
        ? enrichedEvolutionData[enrichedEvolutionData.length - 1].overall - enrichedEvolutionData[enrichedEvolutionData.length - 2].overall
        : 0

    // normalizar viaScores (pode vir como Record<string, number> ou StrengthScore[])
    const normalizedViaScores: Record<string, number> = {}
    if (viaScores) {
        if (Array.isArray(viaScores)) {
            // Se for array de StrengthScore, converter para mapa
            viaScores.forEach((s: any) => {
                if (s.label && s.normalizedScore !== undefined) {
                    normalizedViaScores[s.label] = s.normalizedScore / 20; // converter de 0-100 para 0-5
                }
            });
        } else {
            // Se já for mapa, usar direto
            Object.assign(normalizedViaScores, viaScores);
        }
    }

    // Processar Top 5 forças VIA
    const top5Strengths = Object.entries(normalizedViaScores).length > 0
        ? Object.entries(normalizedViaScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, score]) => {
                // Encontrar a virtude correspondente
                const virtue = Object.entries(VIRTUE_MAPPING).find(([, strengths]) =>
                    strengths.includes(name)
                )?.[0] || 'Sabedoria'

                const numericScore = typeof score === 'number' ? score : 0;

                return {
                    name,
                    score: numericScore.toFixed(1),
                    percentage: (numericScore / 5) * 100,
                    color: VIRTUE_COLORS[virtue]
                }
            })
        : []

    // Processar dados para o Radar Chart (Agrupado por Virtude)
    const radarData = Object.entries(normalizedViaScores).length > 0 ? Object.entries(VIRTUE_MAPPING).map(([virtue, strengths]) => {
        const totalScore = strengths.reduce((acc, strength) => {
            const val = normalizedViaScores[strength] || 0;
            return acc + (typeof val === 'number' ? val : 0);
        }, 0)
        const average = strengths.length ? Math.round((totalScore / strengths.length) * 10) / 10 : 0
        return {
            subject: virtue,
            A: average,
            fullMark: 5
        }
    }) : []

    // Score VIA médio
    const scoresArray = Object.values(normalizedViaScores).filter(v => typeof v === 'number');
    const avgViaScore = scoresArray.length > 0
        ? scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length
        : 0

    // Dados comparativos (mock - idealmente viria do servidor)
    const comparisonData = [
        {
            metric: 'Score SRSS',
            aluno: latestData?.overall || 0,
            turma: 4.2,
            meta: 3.0
        },
        {
            metric: 'Média VIA',
            aluno: avgViaScore,
            turma: 3.8,
            meta: 4.0
        }
    ]

    return (
        <div className="space-y-6 mb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tier Atual */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tier Atual</p>
                            {currentTier && (
                                <Badge
                                    variant="outline"
                                    className={
                                        currentTier === 1 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                            currentTier === 2 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                "bg-rose-50 text-rose-700 border-rose-200"
                                    }
                                >
                                    Camada {currentTier}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900">
                                {currentTier || '-'}
                            </p>
                            <div className="flex items-center gap-1">
                                {trend < 0 && <TrendingDown className="text-emerald-600" size={16} />}
                                {trend > 0 && <TrendingUp className="text-rose-600" size={16} />}
                                {trend === 0 && <Minus className="text-slate-400" size={16} />}
                                <span className={`text-xs font-bold ${trend < 0 ? 'text-emerald-600' :
                                    trend > 0 ? 'text-rose-600' :
                                        'text-slate-400'
                                    }`}>
                                    {trend !== 0 && (trend > 0 ? '+' : '')}{trend}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {trend < 0 ? '↓ Melhorando' : trend > 0 ? '↑ Atenção' : '→ Estável'}
                        </p>
                    </CardContent>
                </Card>

                {/* Score VIA */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score VIA</p>
                            <Award className="text-purple-500" size={18} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900">
                                {avgViaScore > 0 ? avgViaScore.toFixed(1) : '-'}
                            </p>
                            <span className="text-sm text-slate-500">/5.0</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {avgViaScore >= 4.0 ? '✨ Excelente' : avgViaScore >= 3.0 ? '👍 Bom' : avgViaScore > 0 ? '📈 Desenvolvendo' : 'Pendente'}
                        </p>
                    </CardContent>
                </Card>

                {/* Status Geral */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Geral</p>
                            {currentTier === 1 && <CheckCircle2 className="text-emerald-500" size={18} />}
                            {currentTier === 2 && <AlertTriangle className="text-amber-500" size={18} />}
                            {currentTier === 3 && <AlertTriangle className="text-rose-500" size={18} />}
                        </div>
                        <p className="text-lg font-black text-slate-900">
                            {currentTier === 1 ? 'Saudável' : currentTier === 2 ? 'Risco Moderado' : currentTier === 3 ? 'Alto Risco' : 'Avaliando'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {evolutionData.length} avaliações registradas
                        </p>
                    </CardContent>
                </Card>

                {/* Top Força */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Força</p>
                            <Target className="text-indigo-500" size={18} />
                        </div>
                        <p className="text-lg font-black text-slate-900 truncate">
                            {top5Strengths[0]?.name || 'Pendente VIA'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {top5Strengths[0] ? `${top5Strengths[0].score}/5.0` : 'Aguardando questionário'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Evolução APRIMORADO (com área) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Evolução do Risco (SRSS-IE)
                        </CardTitle>
                        <CardDescription>
                            Acompanhamento longitudinal dos fatores de risco ao longo das janelas de triagem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {enrichedEvolutionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={enrichedEvolutionData}>
                                    <defs>
                                        <linearGradient id="colorExt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="window" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 12]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="overall"
                                        name="Score Geral"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="url(#colorOverall)"
                                        dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="externalizing"
                                        name="Externalizante"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fill="url(#colorExt)"
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="internalizing"
                                        name="Internalizante"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#colorInt)"
                                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Dados insuficientes para gerar histórico.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico Comparativo: Aluno vs Turma */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Users size={16} />
                            Comparativo: Aluno vs Turma
                        </CardTitle>
                        <CardDescription>
                            Performance do aluno em relação à média da turma e metas estabelecidas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {comparisonData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="aluno" name="Aluno" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                                    <Bar dataKey="turma" name="Média da Turma" fill="#94a3b8" radius={[0, 8, 8, 0]} />
                                    <Bar dataKey="meta" name="Meta" fill="#10b981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Dados comparativos não disponíveis.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Segunda linha: Top 5 Forças + Radar VIA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Forças VIA (Horizontal Bars) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Award size={16} className="text-amber-500" />
                            Top 5 Forças de Caráter
                        </CardTitle>
                        <CardDescription>
                            As cinco forças de caráter mais desenvolvidas do aluno (VIA).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {top5Strengths.length > 0 ? (
                            <div className="space-y-4 pt-4">
                                {top5Strengths.map((strength, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                                                {strength.name}
                                            </span>
                                            <span className="text-sm font-bold" style={{ color: strength.color }}>
                                                {strength.score}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${strength.percentage}%`,
                                                    backgroundColor: strength.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Questionário VIA ainda não respondido.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico Radar (VIA Virtudes) - MANTIDO e MELHORADO */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Perfil de Virtudes (VIA)
                        </CardTitle>
                        <CardDescription>
                            Distribuição das 24 forças agrupadas pelas 6 virtudes fundamentais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Virtudes"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.25}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                                Questionário VIA ainda não respondido.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
