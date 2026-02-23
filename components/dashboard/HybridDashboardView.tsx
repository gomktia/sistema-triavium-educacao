
'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';

export function HybridDashboardView({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-slate-50 p-12 text-center rounded-3xl border border-dashed border-slate-200">
                <BrainCircuit className="mx-auto mb-2 text-slate-300" size={48} />
                <p className="text-slate-500 font-bold">Sem dados suficientes para análise cruzada.</p>
                <p className="text-xs text-slate-400">É necessário que os alunos tenham completado tanto o Big Five quanto a triagem de risco.</p>
            </div>
        );
    }

    // Chart Data mapping
    // We filter out incomplete data if any passed
    const validData = data.filter(d => d.stability !== undefined && d.internalizing !== undefined);

    const chartData = validData.map(item => ({
        x: item.stability, // Estabilidade Emocional (1-5)
        y: item.internalizing, // Risco Internalizante (0-15)
        z: item.riskTier, // Size/Color logic
        name: item.name
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-sky-500" />
                    Correlação: Estabilidade vs. Internalização
                </h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Estabilidade"
                                domain={[1, 5]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                label={{ value: 'Estabilidade Emocional (1=Baixa, 5=Alta)', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 10 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Risco"
                                domain={[0, 15]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                label={{ value: 'Risco Internalizante (0-15)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
                                                <p className="font-bold text-slate-800 mb-1">{d.name}</p>
                                                <p className="text-slate-500">Estabilidade: <span className="font-bold text-indigo-600">{d.x.toFixed(1)}</span></p>
                                                <p className="text-slate-500">Risco Int.: <span className="font-bold text-rose-600">{d.y}</span></p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Alunos" data={chartData} fill="#8884d8">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.z === 3 ? '#f43f5e' : entry.z === 2 ? '#f59e0b' : '#10b981'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 flex justify-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"></span> Baixo Risco
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-amber-500 rounded-full shadow-sm shadow-amber-200"></span> Moderado
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-rose-500 rounded-full shadow-sm shadow-rose-200"></span> Alto Risco
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Insights de Risco Cruzado
                    </h3>
                </div>

                {validData.filter(d => d.stability && d.stability < 2.5 && d.internalizing && d.internalizing >= 6).length > 0 ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm">
                        <h4 className="font-bold text-rose-800 text-sm mb-2 flex items-center gap-2">
                            🚨 Vulnerabilidade Extrema
                        </h4>
                        <p className="text-xs text-rose-700 mb-4 font-medium leading-relaxed">
                            Alunos com <strong>Baixa Estabilidade Emocional</strong> (Traço) e <strong>Alto Risco Internalizante</strong> (Estado Atual).
                            Este grupo apresenta a maior probabilidade estatística de desenvolver transtornos de humor severos.
                        </p>
                        <ul className="space-y-2">
                            {validData.filter(d => d.stability < 2.5 && d.internalizing >= 6).map((s, idx) => (
                                <li key={idx} className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600 transition-colors">{s.name}</span>
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">Estab: {s.stability.toFixed(1)}</span>
                                        <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded">Risco: {s.internalizing}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-emerald-700 text-sm font-medium flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp size={16} />
                        </div>
                        Nenhum aluno identificado no quadrante de vulnerabilidade extrema (Baixa Estabilidade + Alto Risco).
                    </div>
                )}

                {/* Secondary Insight: Conscientiousness vs Externalizing */}
                {validData.filter(d => d.conscientiousness && d.conscientiousness < 2.5 && d.externalizing && d.externalizing >= 6).length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
                        <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                            ⚠️ Risco de Conduta
                        </h4>
                        <p className="text-xs text-amber-700 mb-4 font-medium leading-relaxed">
                            Alunos com <strong>Baixa Conscienciosidade</strong> (Impulsividade) e <strong>Alto Risco Externalizante</strong>.
                            Maior propensão a comportamentos disruptivos e infrações disciplinares.
                        </p>
                        <ul className="space-y-2">
                            {validData.filter(d => d.conscientiousness < 2.5 && d.externalizing >= 6).map((s, idx) => (
                                <li key={idx} className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-amber-600 transition-colors">{s.name}</span>
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Cons: {s.conscientiousness.toFixed(1)}</span>
                                        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Ext: {s.externalizing}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
