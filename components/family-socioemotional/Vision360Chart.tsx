'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import { BigFiveScore, BigFiveDomain, FamilySocioemotionalResult } from '@/src/core/types';
import { FAMILY_SOCIOEMOTIONAL_AXES_INFO } from '@/src/core/content/family-socioemotional-items';

/**
 * Mapeamento dos domínios Big Five para labels curtas do radar
 */
const DOMAIN_SHORT_LABELS: Record<BigFiveDomain, string> = {
    [BigFiveDomain.CONSCIENCIOSIDADE]: 'Conscienciosidade',
    [BigFiveDomain.ESTABILIDADE]: 'Estabilidade',
    [BigFiveDomain.AMABILIDADE]: 'Amabilidade',
    [BigFiveDomain.EXTROVERSAO]: 'Extroversão',
    [BigFiveDomain.ABERTURA]: 'Abertura',
};

interface Vision360ChartProps {
    bigFiveScores: BigFiveScore[];
    familyResult: FamilySocioemotionalResult;
}

/**
 * Radar chart comparando a autoavaliação Big Five do aluno
 * com a percepção dos pais (Heteroavaliação Familiar).
 * Ambos normalizados para escala 0-5.
 */
export function Vision360Chart({ bigFiveScores, familyResult }: Vision360ChartProps) {
    // Build comparison data using Big Five domains as the common axis
    const data = Object.values(BigFiveDomain).map(domain => {
        const bigFiveScore = bigFiveScores.find(s => s.domain === domain);
        const familyAxis = Object.values(familyResult.axes).find(a => a.bigFiveDomain === domain);

        return {
            subject: DOMAIN_SHORT_LABELS[domain],
            aluno: bigFiveScore?.score ?? 0,
            familia: familyAxis ? Number(((familyAxis.score / 15) * 5).toFixed(2)) : 0,
            fullMark: 5,
        };
    });

    return (
        <div className="w-full h-[300px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Autoavaliação (Aluno)"
                        dataKey="aluno"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="#6366f1"
                        fillOpacity={0.15}
                    />
                    <Radar
                        name="Percepção Familiar"
                        dataKey="familia"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="#8b5cf6"
                        fillOpacity={0.15}
                        strokeDasharray="5 5"
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
