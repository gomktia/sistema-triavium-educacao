
'use client';

import { useState } from 'react';
import { sendStudentMessage } from '@/app/actions/minha-voz'; // Assuming user has path mapping
// If fails, I will revert to relative path ../../actions...
import { toast } from 'sonner';
import { Loader2, MessageCircleHeart } from 'lucide-react';

export default function MinhaVozPage() {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // @ts-ignore
            const result = await sendStudentMessage(message);

            if (result.success) {
                toast.success('Mensagem enviada com sucesso. Estamos aqui por você!');
                setMessage('');
            } else {
                toast.error(result.error || 'Erro ao enviar mensagem.');
            }
        } catch (error) {
            toast.error('Erro de conexão. Tente novamente.');
        }
        setIsSending(false);
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-700 pb-[env(safe-area-inset-bottom,20px)] min-h-[100dvh] flex flex-col">
            <div className="text-center space-y-3 pt-8">
                <div className="h-20 w-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-200 ring-4 ring-white">
                    <MessageCircleHeart className="text-white" size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Minha Voz</h1>
                <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                    Este é um espaço seguro. Se você precisa conversar, desabafar ou pedir ajuda, escreva aqui.
                    Nossa equipe de apoio escolar receberá sua mensagem com sigilo e carinho.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] space-y-6 border border-slate-100 relative overflow-hidden flex-1 flex flex-col sticky bottom-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500" />

                <div>
                    <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest pl-1">
                        Como você está se sentindo?
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escreva livremente aqui..."
                        className="w-full h-48 p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none resize-none text-slate-700 placeholder:text-slate-400 font-medium leading-relaxed text-lg"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSending || !message.trim()}
                    className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-xl hover:shadow-rose-200/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                    {isSending ? <Loader2 className="animate-spin" /> : (
                        <>
                            <span>Enviar Mensagem Segura</span>
                            <MessageCircleHeart size={20} />
                        </>
                    )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wide">
                    Sua mensagem será lida apenas pela equipe de psicologia.
                </p>
            </form>

            {/* Immediate Help Info */}
            <div className="bg-emerald-50 rounded-3xl p-6 text-center border-2 border-emerald-100/50">
                <p className="text-emerald-800 font-bold mb-1">Precisa de ajuda urgente?</p>
                <p className="text-sm text-emerald-600 mb-4 font-medium">O CVV oferece apoio emocional gratuito 24h.</p>
                <a
                    href="tel:188"
                    className="inline-flex items-center justify-center bg-emerald-600 text-white font-black px-8 py-3 rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 text-lg"
                >
                    Ligue 188
                </a>
            </div>
        </div>
    );
}
