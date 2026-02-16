'use client';

import { useEffect, useState } from 'react';
import { getStudentSummaryStats } from '@/app/actions/behavior';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StudentSummaryCard({ studentId }: { studentId: string }) {
    const [stats, setStats] = useState<{
        systemAlertLevel: 'GREEN' | 'YELLOW' | 'RED';
        monthlyLogs: number;
        srssTier: string;
    } | null>(null);

    useEffect(() => {
        getStudentSummaryStats(studentId).then((data) => {
            if (data) {
                setStats({
                    systemAlertLevel: data.systemAlertLevel as 'GREEN' | 'YELLOW' | 'RED',
                    monthlyLogs: data.monthlyLogs,
                    srssTier: data.srssTier || 'TIER_1'
                });
            }
        });
    }, [studentId]);

    if (!stats) {
        return <div className="h-32 bg-slate-50 animate-pulse rounded-xl" />;
    }

    const riskColor =
        stats.systemAlertLevel === 'RED'
            ? 'text-red-600'
            : stats.systemAlertLevel === 'YELLOW'
                ? 'text-yellow-600'
                : 'text-green-600';

    const tierLabel =
        stats.srssTier === 'TIER_3' ? 'Alto Risco (T3)' :
            stats.srssTier === 'TIER_2' ? 'Risco Moderado (T2)' :
                'Baixo Risco (T1)';

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

                    {/* Native Intelligence Status */}
                    <div className="flex-1 p-5 flex flex-col items-center justify-center text-center bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Status (Inteligência Nativa)
                        </span>
                        <div className={cn("text-lg font-bold flex items-center gap-2", riskColor)}>
                            {stats.systemAlertLevel === 'RED' ? (
                                <AlertTriangle className="h-5 w-5" />
                            ) : stats.systemAlertLevel === 'YELLOW' ? (
                                <AlertTriangle className="h-5 w-5" />
                            ) : (
                                <ShieldCheck className="h-5 w-5" />
                            )}
                            {stats.systemAlertLevel === 'RED'
                                ? 'CRÍTICO'
                                : stats.systemAlertLevel === 'YELLOW'
                                    ? 'ATENÇÃO'
                                    : 'ESTÁVEL'}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                            Monitoramento Automático
                        </span>
                    </div>

                    {/* Monthly Activity */}
                    <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Ocorrências (Mês)
                        </span>
                        <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            {stats.monthlyLogs}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                            Registros Qualitativos
                        </span>
                    </div>

                    {/* Quantitative Tier */}
                    <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Triagem (SRSS-IE)
                        </span>
                        <div className="text-sm font-bold text-slate-800">
                            <Badge variant={stats.srssTier === 'TIER_1' ? 'outline' : 'secondary'} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                {tierLabel}
                            </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                            Dados Quantitativos
                        </span>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
