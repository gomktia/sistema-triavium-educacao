'use client';

import { useEffect, useState } from 'react';
import { getRecentAlerts } from '@/app/actions/behavior';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentAlertsTab() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRecentAlerts()
            .then((data) => setAlerts(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="py-8 text-center text-slate-500 animate-pulse">
                Carregando alertas de inteligência nativa...
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800">Tudo Normal</h3>
                <p className="text-slate-500">Nenhum alerta comportamental ativo no momento.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((student) => {
                const isRed = student.systemAlertLevel === 'RED';
                const lastLog = student.behaviorLogs[0];

                return (
                    <Link
                        key={student.id}
                        href={`/alunos/${student.id}`}
                        className="block group"
                    >
                        <div
                            className={cn(
                                'relative p-4 rounded-xl border transition-all hover:shadow-md bg-white',
                                isRed
                                    ? 'border-red-200 shadow-red-50 hover:border-red-300'
                                    : 'border-yellow-200 shadow-yellow-50 hover:border-yellow-300'
                            )}
                        >
                            {isRed && (
                                <div className="absolute top-0 right-0 p-1">
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                                        isRed ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    )}
                                >
                                    {isRed ? (
                                        <AlertCircle className="h-6 w-6" />
                                    ) : (
                                        <AlertTriangle className="h-6 w-6" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                {student.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {student.grade} • ID: {student.id.slice(-4)}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'px-2 py-1 rounded-full text-xs font-bold border',
                                                isRed
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            )}
                                        >
                                            {isRed ? 'ALERTA CRÍTICO' : 'ATENÇÃO'}
                                        </span>
                                    </div>

                                    {lastLog && (
                                        <div className="bg-slate-50 rounded-lg p-2.5 mt-1 border border-slate-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                                    {lastLog.category}
                                                    {isRed && lastLog.createdAt && (
                                                        <span className="text-[10px] font-normal text-slate-400 normal-case">
                                                            • há {formatDistanceToNow(new Date(lastLog.createdAt), { locale: ptBR })}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 italic">
                                                "{lastLog.description || 'Ocorrência registrada sem descrição detalhada.'}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center h-full self-center pl-2">
                                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
