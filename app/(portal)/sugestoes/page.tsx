'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Send, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/app/actions/feedback';

export default function SugestoesPage() {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !description.trim()) {
            toast.error('Preencha todos os campos');
            return;
        }

        startTransition(async () => {
            try {
                await submitFeedback({ subject, description });
                toast.success('Sugestao enviada com sucesso!');
                setSubmitted(true);
                setSubject('');
                setDescription('');
            } catch (error: any) {
                toast.error(error.message || 'Erro ao enviar sugestao');
            }
        });
    };

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
                <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden">
                    <CardContent className="p-12 text-center">
                        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="text-emerald-600" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">Obrigado pelo feedback!</h2>
                        <p className="text-slate-500 mb-8">
                            Sua sugestao foi recebida e sera analisada pela nossa equipe.
                        </p>
                        <Button
                            onClick={() => setSubmitted(false)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Sparkles size={16} className="mr-2" />
                            Enviar outra sugestao
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="text-center space-y-3 pt-8">
                <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-200 ring-4 ring-white">
                    <Lightbulb className="text-white" size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Canal de Sugestoes</h1>
                <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                    Sua opiniao e muito importante! Compartilhe ideias de melhorias ou novas funcionalidades para o sistema.
                </p>
            </div>

            <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Assunto
                            </Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Resuma sua sugestao em poucas palavras..."
                                className="h-12 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Descricao
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descreva sua sugestao com detalhes. Quanto mais informacoes, melhor poderemos avaliar..."
                                className="min-h-[180px] rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-100 resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black shadow-xl shadow-amber-200 transition-all"
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} className="mr-2" />
                                    Enviar Sugestao
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-slate-400">
                Todas as sugestoes sao analisadas pela equipe Triavium.
            </p>
        </div>
    );
}
