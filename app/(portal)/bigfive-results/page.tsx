
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMyBigFive } from '@/app/actions/assessment';
import { BigFiveScore } from '@/src/core/types';
import { BigFiveRadarResult } from '@/components/bigfive/BigFiveRadarResult';

export const metadata = {
    title: 'Seu Perfil Big Five | Triavium',
};

export default async function BigFiveResultsPage() {
    const user = await getCurrentUser();

    if (!user) redirect('/');

    const assessment = await getMyBigFive();

    if (!assessment || !assessment.processedScores) {
        redirect('/bigfive');
    }

    const scores = assessment.processedScores as unknown as BigFiveScore[];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seu Perfil de Personalidade</h1>
                    <p className="text-slate-500 mt-1">Análise baseada nos 5 Grandes Domínios (Big Five).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Radar Chart */}
                <div className="lg:col-span-1 sticky top-8">
                    <BigFiveRadarResult scores={scores} />
                    <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide">Como interpretar?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            O gráfico mostra o equilíbrio entre os seus traços.
                            Áreas mais expandidas indicam tendências mais fortes.
                            Não existe perfil "melhor" ou "pior", apenas características diferentes que se adaptam a contextos diferentes.
                        </p>
                    </div>
                </div>

                {/* Score Details */}
                <div className="lg:col-span-1 space-y-4">
                    {scores.map((s) => (
                        <div key={s.domain} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-shadow">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-800 text-lg">{s.label}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-600">{s.score.toFixed(1)}</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.level === 'Alto' ? 'bg-indigo-50 text-indigo-600' :
                                            s.level === 'Baixo' ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        {s.level}
                                    </span>
                                </div>
                            </div>

                            {/* Bar Visual */}
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${s.level === 'Alto' ? 'bg-indigo-500' :
                                            s.level === 'Baixo' ? 'bg-amber-500' :
                                                'bg-slate-400'
                                        }`}
                                    style={{ width: `${(s.score / 5) * 100}%` }}
                                />
                            </div>

                            <p className="text-sm text-slate-500 leading-relaxed">
                                {s.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nota Ética */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium">
                    Este instrumento tem finalidade exclusivamente pedagógica e não constitui diagnóstico clínico.
                </p>
            </div>
        </div>
    );
}
