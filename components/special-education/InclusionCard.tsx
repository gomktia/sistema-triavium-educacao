
import { Lightbulb, Info } from 'lucide-react';

export function InclusionCard({ needs }: { needs: any }) {
    if (!needs) return null;
    const { tea, tdah, ah_sd, details } = needs;
    if (!tea && !tdah && !ah_sd) return null;

    return (
        <div className="bg-white rounded-3xl p-6 border-l-4 border-violet-500 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Info className="text-violet-500" size={20} />
                Necessidades Educacionais Específicas
            </h3>
            <div className="flex gap-2 flex-wrap">
                {tea && <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold">TEA</span>}
                {tdah && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">TDAH</span>}
                {ah_sd && <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">AH/SD</span>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <Lightbulb size={16} className="text-yellow-500" />
                    Estratégias de Manejo
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 font-medium ml-1">
                    {tea && (
                        <>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Antecipe mudanças na rotina com avisos visuais prévios.</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Evite sobrecarga sensorial (barulho excessivo/luzes fortes).</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Use linguagem direta e literal, evitando metáforas complexas.</li>
                        </>
                    )}
                    {tdah && (
                        <>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Quebre instruções complexas em passos menores e sequenciais.</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Permita movimento controlado ou pausas ativas durante tarefas longas.</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Reforce comportamentos positivos imediatamente.</li>
                        </>
                    )}
                    {ah_sd && (
                        <>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Ofereça projetos de desafios e aprofundamento para evitar tédio.</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Estimule a autonomia e liderança em trabalhos de grupo.</li>
                            <li className="flex items-start gap-2 before:content-['•'] before:text-slate-300">Monitore sinais de perfeccionismo excessivo ou isolamento social.</li>
                        </>
                    )}
                </ul>
            </div>
            {details && (
                <div className="text-xs text-slate-500 bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                    <span className="font-bold text-yellow-700 uppercase block mb-1">Observações Clínicas:</span>
                    {details}
                </div>
            )}
        </div>
    );
}
