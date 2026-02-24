import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Database,
    ExternalLink,
    CreditCard,
    Globe,
    Mail,
    School,
    Users,
    GraduationCap,
    ClipboardList,
} from 'lucide-react';
import packageJson from '@/package.json';

export const metadata = {
    title: 'Configurações Globais | Triavium SaaS',
};

const PLANS = [
    {
        name: 'ESSENTIAL',
        price: 990,
        studentLimit: '200',
        description: 'Triagem SRSS + Big Five + Dashboard básico',
        color: 'bg-blue-100 text-blue-700',
    },
    {
        name: 'ADVANCE',
        price: 1990,
        studentLimit: '500',
        description: 'Tudo do Essential + SDQ + Percepção Familiar + Intervenções',
        color: 'bg-indigo-100 text-indigo-700',
    },
    {
        name: 'SOVEREIGN',
        price: 3490,
        studentLimit: 'Ilimitado',
        description: 'Tudo do Advance + Webhooks + Analytics avançado + Suporte prioritário',
        color: 'bg-purple-100 text-purple-700',
    },
] as const;

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildSupabaseDashboardUrl(): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) return 'https://supabase.com/dashboard';
    return `https://supabase.com/dashboard/project/${match[1]}`;
}

export default async function SettingsPage() {
    await requireSuperAdmin();

    const [totalSchools, totalUsers, totalStudents, totalAssessments] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.student.count(),
        prisma.assessment.count(),
    ]);

    const systemMetrics = [
        { label: 'Escolas', value: totalSchools, icon: School },
        { label: 'Usuários', value: totalUsers, icon: Users },
        { label: 'Alunos', value: totalStudents, icon: GraduationCap },
        { label: 'Triagens', value: totalAssessments, icon: ClipboardList },
    ];

    const externalLinks = [
        {
            label: 'Vercel Dashboard',
            url: 'https://vercel.com/dashboard',
            icon: Globe,
            description: 'Deploy, domínios e logs de produção',
        },
        {
            label: 'Supabase Dashboard',
            url: buildSupabaseDashboardUrl(),
            icon: Database,
            description: 'Banco de dados, autenticação e storage',
        },
        {
            label: 'Resend Dashboard',
            url: 'https://resend.com/emails',
            icon: Mail,
            description: 'Envio de e-mails transacionais',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                <Settings size={14} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Administração</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações Globais</h1>
                    </div>
                </div>

                {/* Section 1: Planos Padrão */}
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 py-6">
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard size={16} className="text-indigo-600" />
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Planos Padrão</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">Plano</th>
                                        <th className="px-6 py-4">Preço Mensal</th>
                                        <th className="px-6 py-4 text-center">Limite de Alunos</th>
                                        <th className="px-6 py-4">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {PLANS.map((plan) => (
                                        <tr key={plan.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <Badge className={`text-[10px] font-black uppercase tracking-widest border-none shadow-none ${plan.color}`}>
                                                    {plan.name}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 font-black text-slate-800 text-sm">
                                                {formatCurrency(plan.price)}
                                            </td>
                                            <td className="px-6 py-5 text-center font-black text-slate-600 text-sm">
                                                {plan.studentLimit}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {plan.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Informações do Sistema */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Informações do Sistema
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {systemMetrics.map((metric) => (
                            <Card key={metric.label} className="border-slate-200 shadow-sm rounded-2xl">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <metric.icon size={18} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {metric.label}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">
                                        {metric.value.toLocaleString('pt-BR')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="pt-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Versão
                                </span>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    v{packageJson.version}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="pt-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Ambiente
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-2xl font-black text-slate-900">
                                        {process.env.NODE_ENV}
                                    </p>
                                    <Badge className={`text-[9px] font-black uppercase tracking-widest border-none shadow-none ${
                                        process.env.NODE_ENV === 'production'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section 3: Links Úteis */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Links Úteis
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {externalLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group"
                            >
                                <Card className="border-slate-200 shadow-sm rounded-2xl hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                <link.icon size={20} />
                                            </div>
                                            <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <h3 className="text-indigo-600 hover:text-indigo-700 font-bold text-sm group-hover:text-indigo-700 transition-colors">
                                            {link.label}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {link.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
