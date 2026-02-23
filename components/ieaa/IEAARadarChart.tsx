
'use client';

import { IEAADimensionScore } from '@/src/core/types';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    Tooltip,
} from 'recharts';

interface IEAARadarChartProps {
    dimensions: IEAADimensionScore[];
}

export function IEAARadarChart({ dimensions }: IEAARadarChartProps) {
    const data = dimensions.map(d => ({
        dimension: d.label.replace('Estratégias ', '').replace('Controle ', '').replace('Componente ', ''),
        score: d.percentage,
        fullMark: 100,
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickCount={5}
                        axisLine={false}
                    />
                    <Radar
                        name="Seu Perfil"
                        dataKey="score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        dot={{
                            r: 4,
                            fill: '#10b981',
                            stroke: '#fff',
                            strokeWidth: 2,
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            padding: '12px 16px',
                        }}
                        formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Pontuação']}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
