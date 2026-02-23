'use client';

import { useEffect } from 'react';

export default function AlunosError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Alunos error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-800">
                    Erro ao carregar alunos
                </h2>
                <p className="text-slate-500 mt-2 max-w-md">
                    Nao foi possivel carregar a lista de alunos. Verifique sua conexao e tente novamente.
                </p>
                {error.digest && (
                    <p className="text-xs text-slate-400 mt-1">Codigo: {error.digest}</p>
                )}
            </div>
            <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tentar novamente
            </button>
        </div>
    );
}
