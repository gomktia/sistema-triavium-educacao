'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { FamilySocioemotionalResult, FamilySocioemotionalZone } from '@/src/core/types';
import { getFamilySocioemotionalRadarData, getFamilySocioemotionalInterventions } from '@/src/core/logic/family-socioemotional';
import { FAMILY_SOCIOEMOTIONAL_ZONE_LABELS } from '@/src/core/content/family-socioemotional-items';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Heart, Star, TrendingUp } from 'lucide-react';

const ZONE_STYLES: Record<FamilySocioemotionalZone, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
    [FamilySocioemotionalZone.MAESTRIA]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Star },
    [FamilySocioemotionalZone.PROXIMAL]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: TrendingUp },
    [FamilySocioemotionalZone.ATENCAO]:  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle },
};

function ZoneBadge({ zone }: { zone: FamilySocioemotionalZone }) {
    const style = ZONE_STYLES[zone];
    const zoneInfo = FAMILY_SOCIOEMOTIONAL_ZONE_LABELS[zone];
    const Icon = style.icon;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border",
            style.bg, style.text, style.border
        )}>
            <Icon size={12} strokeWidth={2.5} />
            {zoneInfo.label}
        </span>
    );
}

function ResultRadarChart({ result }: { result: FamilySocioemotionalResult }) {
    const data = getFamilySocioemotionalRadarData(result);

    return (
        <div className="w-full h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Percepção Familiar"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.2}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

interface FamilySocioemotionalResultViewProps {
    result: FamilySocioemotionalResult;
    showInterventions?: boolean; // false for parent view, true for gestor/psych
}

export function FamilySocioemotionalResultView({ result, showInterventions = false }: FamilySocioemotionalResultViewProps) {
    const interventions = getFamilySocioemotionalInterventions(result);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="md:col-span-5">
                    <ResultRadarChart result={result} />
                </div>
                <div className="md:col-span-7 space-y-3">
                    {result.axes.map(axis => {
                        const zoneInfo = FAMILY_SOCIOEMOTIONAL_ZONE_LABELS[axis.zone];
                        return (
                            <div key={axis.axis} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-slate-700 text-xs">{axis.label}</span>
                                    <ZoneBadge zone={axis.zone} />
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-2xl font-black text-slate-900">{axis.score}</span>
                                    <span className="text-sm text-slate-400 font-bold">/15</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${(axis.score / 15) * 100}%`,
                                            backgroundColor: zoneInfo.color,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Positive feedback for parents */}
            {!showInterventions && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Heart size={20} className="text-violet-500" />
                        <h3 className="text-sm font-black text-violet-900">A participação da família faz a diferença!</h3>
                    </div>
                    <p className="text-xs text-violet-700 leading-relaxed">
                        Sua percepção é fundamental para que a escola compreenda o(a) estudante de forma integral.
                        Ao compartilhar como você observa as competências socioemocionais em casa, contribuímos juntos para um
                        acompanhamento mais preciso e acolhedor. Os dados informados serão triangulados com as avaliações
                        realizadas na escola, respeitando sempre a privacidade da família.
                    </p>
                </div>
            )}

            {/* Intervention suggestions (gestor/psych view only) */}
            {showInterventions && interventions.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Sugestões de Intervenção</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {interventions.map((int, i) => (
                            <div key={i} className={cn(
                                "p-4 rounded-2xl border",
                                int.zone === FamilySocioemotionalZone.ATENCAO ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    <ZoneBadge zone={int.zone} />
                                    <span className="text-xs font-bold text-slate-700">{int.axis}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{int.suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px] text-slate-400 text-center font-medium px-4">
                Este instrumento tem finalidade exclusivamente pedagógica e não constitui diagnóstico clínico.
                A percepção parental deve ser triangulada com autoavaliações e observações docentes.
            </p>
        </div>
    );
}
