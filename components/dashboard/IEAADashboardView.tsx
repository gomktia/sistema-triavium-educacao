
'use client';

import { IEAAResult, IEAALevel, IEAAProfile } from '@/src/core/types';
import { IEAA_LEVELS_INFO, IEAA_PROFILES_INFO } from '@/src/core/content/ieaa-items';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts';
import { BookOpen, Users, AlertTriangle, TrendingUp, Target, Brain, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface StudentIEAAData {
    id: string;
    name: string;
    result: IEAAResult;
}

interface IEAADashboardViewProps {
    data: StudentIEAAData[];
}

const PROFILE_COLORS: Record<IEAAProfile, string> = {
    [IEAAProfile.EXECUTIVO]: '#6366f1',
    [IEAAProfile.CIENTISTA]: '#8b5cf6',
    [IEAAProfile.ENGAJADO]: '#10b981',
    [IEAAProfile.VULNERAVEL]: '#f43f5e',
};

const LEVEL_COLORS: Record<IEAALevel, string> = {
    [IEAALevel.REATIVO]: '#f59e0b',
    [IEAALevel.TRANSICAO]: '#3b82f6',
    [IEAALevel.AUTORREGULADO]: '#10b981',
};

export function IEAADashboardView({ data }: IEAADashboardViewProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-slate-50 p-12 text-center rounded-3xl border border-dashed border-slate-200">
                <BookOpen className="mx-auto mb-2 text-slate-300" size={48} />
                <p className="text-slate-500 font-bold">Nenhum aluno completou o IEAA ainda.</p>
                <p className="text-xs text-slate-400">Os dados aparecerão aqui quando os alunos responderem.</p>
            </div>
        );
    }

    // Count by level
    const levelCounts = {
        [IEAALevel.REATIVO]: data.filter(d => d.result.overallLevel === IEAALevel.REATIVO).length,
        [IEAALevel.TRANSICAO]: data.filter(d => d.result.overallLevel === IEAALevel.TRANSICAO).length,
        [IEAALevel.AUTORREGULADO]: data.filter(d => d.result.overallLevel === IEAALevel.AUTORREGULADO).length,
    };

    // Count by profile
    const profileCounts = {
        [IEAAProfile.EXECUTIVO]: data.filter(d => d.result.profile === IEAAProfile.EXECUTIVO).length,
        [IEAAProfile.CIENTISTA]: data.filter(d => d.result.profile === IEAAProfile.CIENTISTA).length,
        [IEAAProfile.ENGAJADO]: data.filter(d => d.result.profile === IEAAProfile.ENGAJADO).length,
        [IEAAProfile.VULNERAVEL]: data.filter(d => d.result.profile === IEAAProfile.VULNERAVEL).length,
    };

    const levelChartData = [
        { name: IEAA_LEVELS_INFO[IEAALevel.REATIVO].label, value: levelCounts[IEAALevel.REATIVO], fill: LEVEL_COLORS[IEAALevel.REATIVO] },
        { name: IEAA_LEVELS_INFO[IEAALevel.TRANSICAO].label, value: levelCounts[IEAALevel.TRANSICAO], fill: LEVEL_COLORS[IEAALevel.TRANSICAO] },
        { name: IEAA_LEVELS_INFO[IEAALevel.AUTORREGULADO].label, value: levelCounts[IEAALevel.AUTORREGULADO], fill: LEVEL_COLORS[IEAALevel.AUTORREGULADO] },
    ];

    const profileChartData = [
        { name: 'Executivo', value: profileCounts[IEAAProfile.EXECUTIVO], fill: PROFILE_COLORS[IEAAProfile.EXECUTIVO] },
        { name: 'Cientista', value: profileCounts[IEAAProfile.CIENTISTA], fill: PROFILE_COLORS[IEAAProfile.CIENTISTA] },
        { name: 'Engajado', value: profileCounts[IEAAProfile.ENGAJADO], fill: PROFILE_COLORS[IEAAProfile.ENGAJADO] },
        { name: 'Vulnerável', value: profileCounts[IEAAProfile.VULNERAVEL], fill: PROFILE_COLORS[IEAAProfile.VULNERAVEL] },
    ].filter(d => d.value > 0);

    // Vulnerable students list
    const vulnerableStudents = data.filter(d => d.result.profile === IEAAProfile.VULNERAVEL);
    const reactiveStudents = data.filter(d => d.result.overallLevel === IEAALevel.REATIVO);

    // Average scores by dimension
    const avgByDimension = data[0].result.dimensions.map((dim, idx) => {
        const avg = data.reduce((sum, d) => sum + d.result.dimensions[idx].percentage, 0) / data.length;
        return {
            dimension: dim.label.replace('Estratégias ', '').replace('Controle ', '').replace('Componente ', ''),
            avg: Math.round(avg),
        };
    });

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{data.length}</p>
                    <p className="text-xs text-slate-500">alunos avaliados</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Autorregulados</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">{levelCounts[IEAALevel.AUTORREGULADO]}</p>
                    <p className="text-xs text-slate-500">{((levelCounts[IEAALevel.AUTORREGULADO] / data.length) * 100).toFixed(0)}% do total</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Reativos</span>
                    </div>
                    <p className="text-3xl font-black text-amber-600">{levelCounts[IEAALevel.REATIVO]}</p>
                    <p className="text-xs text-slate-500">necessitam suporte</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Vulneráveis</span>
                    </div>
                    <p className="text-3xl font-black text-rose-600">{profileCounts[IEAAProfile.VULNERAVEL]}</p>
                    <p className="text-xs text-slate-500">intervenção prioritária</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Level Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Target size={16} className="text-indigo-500" />
                        Distribuição por Nível de Autorregulação
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={levelChartData} layout="vertical" margin={{ left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    }}
                                    formatter={(value) => [`${value} alunos`, 'Quantidade']}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                    {levelChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Profile Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Brain size={16} className="text-purple-500" />
                        Distribuição por Perfil
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={profileChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                >
                                    {profileChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    }}
                                    formatter={(value) => [`${value} alunos`, 'Quantidade']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Average by Dimension */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    Média da Turma por Dimensão
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={avgByDimension} margin={{ top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                }}
                                formatter={(value) => [`${value}%`, 'Média']}
                            />
                            <Bar dataKey="avg" fill="#10b981" radius={[8, 8, 0, 0]}>
                                {avgByDimension.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.avg < 50 ? '#f59e0b' : entry.avg < 74 ? '#3b82f6' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Vulnerable Students Alert */}
            {vulnerableStudents.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-bold text-rose-800 text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Alunos com Perfil Vulnerável - Intervenção Prioritária
                    </h4>
                    <p className="text-xs text-rose-700 mb-4 font-medium leading-relaxed">
                        Estes alunos apresentam fragilidade em 3 ou mais dimensões e necessitam de acompanhamento psicopedagógico imediato.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vulnerableStudents.map((s) => (
                            <Link
                                key={s.id}
                                href={`/alunos/${s.id}`}
                                className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{s.name}</span>
                                    <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                                        {s.result.totalPercentage.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {s.result.dimensions.filter(d => d.percentage < 50).map(d => (
                                        <span key={d.dimension} className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                            {d.label.replace('Estratégias ', '').replace('Controle ', '').replace('Componente ', '')}: {d.percentage.toFixed(0)}%
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
