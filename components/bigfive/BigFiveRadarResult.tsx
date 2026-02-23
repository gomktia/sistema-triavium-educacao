
'use client';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { BigFiveScore } from '@/src/core/types';

export function BigFiveRadarResult({ scores }: { scores: BigFiveScore[] }) {
    const data = scores.map(s => ({
        subject: s.label,
        value: s.score,
        fullMark: 5,
    }));

    return (
        <div className="w-full h-[300px] sm:h-[400px] bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Pontuação"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="#6366f1"
                        fillOpacity={0.2}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
