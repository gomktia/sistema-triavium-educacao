'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '@/app/actions/password';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (newPassword.length < 8) {
            setError('A nova senha deve ter no mínimo 8 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (currentPassword === newPassword) {
            setError('A nova senha deve ser diferente da atual.');
            return;
        }

        startTransition(async () => {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                setSuccess(true);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(result.error);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha Atual</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Senha</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Repita a nova senha"
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900"
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

            {success && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-emerald-700">Senha alterada com sucesso!</p>
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-indigo-200"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando...
                        </>
                    ) : (
                        'Atualizar Senha'
                    )}
                </Button>
            </div>
        </form>
    );
}
