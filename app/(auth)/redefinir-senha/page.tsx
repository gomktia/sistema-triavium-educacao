'use client';

import { useState, useTransition } from 'react';
import { resetPassword } from '@/app/actions/password';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        startTransition(async () => {
            const result = await resetPassword(password);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setError(result.error);
            }
        });
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div className="p-8 sm:p-12">
                        <div className="mb-10 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-100 mb-6">
                                <span className="font-black text-2xl tracking-tight">TR</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nova Senha</h1>
                            <p className="text-sm text-slate-500 mt-2 font-medium">
                                {success ? 'Senha redefinida com sucesso!' : 'Escolha sua nova senha de acesso'}
                            </p>
                        </div>

                        {success ? (
                            <div className="space-y-6">
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center">
                                    <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-emerald-700">Senha alterada com sucesso!</p>
                                    <p className="text-xs text-emerald-600 mt-2">Redirecionando para o login...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="password"
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                                    >
                                        Nova Senha
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                            minLength={8}
                                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
                                    >
                                        Confirmar Nova Senha
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repita a nova senha"
                                            required
                                            minLength={8}
                                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-rose-600 flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 inline-block shrink-0" /> {error}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Redefinindo...
                                        </>
                                    ) : (
                                        'Redefinir Senha'
                                    )}
                                </Button>

                                <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                                    Voltar para login
                                </Link>
                            </form>
                        )}
                    </div>

                    <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            © 2026 Triavium Educação e Desenvolvimento LTDA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
