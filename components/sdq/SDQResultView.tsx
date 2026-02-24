'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { SDQResult, SDQBand } from '@/src/core/types';
import { getSDQRadarData, getSDQInterventions } from '@/src/core/logic/sdq';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, AlertCircle, Heart } from 'lucide-react';

const BAND_STYLES: Record<SDQBand, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
    [SDQBand.NORMAL]:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    [SDQBand.BORDERLINE]: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: AlertCircle },
    [SDQBand.ABNORMAL]:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    icon: AlertTriangle },
};

interface SDQResultViewProps {
    teacherResult?: SDQResult | null;
    parentResult?: SDQResult | null;
}

function SDQRadarChart({ result, color = '#0d9488' }: { result: SDQResult; color?: string }) {
    const data = getSDQRadarData(result);

    return (
        <div className="w-full h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                        name="Pontuação"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        fill={color}
                        fillOpacity={0.2}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color, fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

function BandBadge({ band, label }: { band: SDQBand; label: string }) {
    const style = BAND_STYLES[band];
    const Icon = style.icon;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border",
            style.bg, style.text, style.border
        )}>
            <Icon size={12} strokeWidth={2.5} />
            {label}
        </span>
    );
}

function SDQSingleResult({ result, title }: { result: SDQResult; title: string }) {
    const interventions = getSDQInterventions(result);
    const color = result.version === 'TEACHER' ? '#6366f1' : '#0d9488';

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Heart size={16} className={result.version === 'TEACHER' ? 'text-indigo-500' : 'text-teal-500'} />
                {title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="md:col-span-5">
                    <SDQRadarChart result={result} color={color} />
                </div>
                <div className="md:col-span-7 space-y-3">
                    {/* Total Difficulties */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Total de Dificuldades</span>
                            <BandBadge band={result.totalDifficultiesBand} label={result.totalDifficultiesBandLabel} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">{result.totalDifficulties}</span>
                            <span className="text-sm text-slate-400 font-bold">/40</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    result.totalDifficultiesBand === SDQBand.NORMAL ? 'bg-emerald-500' :
                                    result.totalDifficultiesBand === SDQBand.BORDERLINE ? 'bg-amber-500' : 'bg-rose-500'
                                )}
                                style={{ width: `${(result.totalDifficulties / 40) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Prosocial (separate, inverted) */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-wide">Comportamento Pró-Social</span>
                            <BandBadge band={result.prosocialBand} label={result.prosocialBandLabel} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-700">{result.prosocialScore}</span>
                            <span className="text-sm text-emerald-400 font-bold">/10</span>
                        </div>
                        <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mt-2">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(result.prosocialScore / 10) * 100}%` }} />
                        </div>
                    </div>

                    {/* Subscale breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                        {result.subscales.filter(s => s.subscale !== 'PROSOCIAL').map(s => (
                            <div key={s.subscale} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700 text-[11px]">{s.label}</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide",
                                        s.band === SDQBand.NORMAL ? 'bg-emerald-100 text-emerald-700' :
                                        s.band === SDQBand.BORDERLINE ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    )}>{s.bandLabel}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full rounded-full",
                                        s.band === SDQBand.NORMAL ? 'bg-emerald-500' :
                                        s.band === SDQBand.BORDERLINE ? 'bg-amber-500' : 'bg-rose-500'
                                    )} style={{ width: `${(s.score / 10) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interventions */}
            {interventions.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Sugestões de Intervenção</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {interventions.map((int, i) => (
                            <div key={i} className={cn(
                                "p-4 rounded-2xl border",
                                int.band === SDQBand.ABNORMAL ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BandBadge band={int.band} label={int.band === SDQBand.ABNORMAL ? 'Anormal' : 'Limítrofe'} />
                                    <span className="text-xs font-bold text-slate-700">{int.area}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{int.suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SDQResultView({ teacherResult, parentResult }: SDQResultViewProps) {
    if (!teacherResult && !parentResult) {
        return (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                <h3 className="text-slate-500 font-bold mb-2">SDQ Não Disponível</h3>
                <p className="text-slate-400 text-sm">Nenhum resultado SDQ encontrado para este aluno.</p>
            </div>
        );
    }

    // Side by side when both exist
    if (teacherResult && parentResult) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <SDQSingleResult result={teacherResult} title="SDQ — Versão Professor" />
                    <SDQSingleResult result={parentResult} title="SDQ — Versão Responsável" />
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium px-4">
                    Este instrumento tem finalidade exclusivamente pedagógica e não constitui diagnóstico clínico.
                </p>
            </div>
        );
    }

    const result = teacherResult || parentResult!;
    const title = result.version === 'TEACHER' ? 'SDQ — Versão Professor' : 'SDQ — Versão Responsável';

    return (
        <div className="space-y-3">
            <SDQSingleResult result={result} title={title} />
            <p className="text-[10px] text-slate-400 text-center font-medium px-4">
                Este instrumento tem finalidade exclusivamente pedagógica e não constitui diagnóstico clínico.
            </p>
        </div>
    );
}
