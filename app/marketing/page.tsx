'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
    TrendingUp,
    ShieldCheck,
    BrainCircuit,
    BarChart3,
    ChevronRight,
    Star,
    ArrowRight,
    School,
    LineChart,
    Users2,
    CheckCircle2,
    Building2,
    Briefcase,
    FileText,
    Zap,
    Lock,
    Globe,
    Cpu
} from 'lucide-react';

export default function LandingPage() {
    const [activeNiche, setActiveNiche] = useState<'school' | 'military' | 'corporate'>('school');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
            {/* Header */}
            <header className={cn(
                "px-4 lg:px-12 h-20 flex items-center sticky top-0 z-50 transition-all duration-300 border-b",
                scrolled ? "bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm" : "bg-transparent border-transparent"
            )}>
                <Link className="flex items-center justify-center gap-3 group" href="#">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:scale-110 transition-all duration-500">
                        <BrainCircuit size={22} className="group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900">Triavium</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-10 items-center">
                    <Link className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden md:block" href="#solutions">Soluções</Link>
                    <Link className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden md:block" href="#methodology">Metodologia</Link>
                    <Link className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden md:block" href="#pricing">Planos</Link>
                    <Link className="text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2 rounded-lg bg-indigo-50" href="/login">Login</Link>
                    <Link href="/login">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] px-8 h-12 rounded-full hidden sm:flex">
                            Acessar Demo
                        </Button>
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full pt-16 pb-32 lg:pt-28 lg:pb-48 bg-white relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[1000px] h-[1000px] bg-indigo-50/40 rounded-full blur-[120px] -z-10" />
                    <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-violet-50/40 rounded-full blur-[100px] -z-10" />

                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
                            <div className="flex flex-col justify-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Plataforma Multi-Nicho v2.0</span>
                                    </div>
                                    <h1 className="text-5xl font-black tracking-tight sm:text-6xl xl:text-8xl/tight text-slate-900">
                                        Inteligência para quem <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Lidera Humanos.</span>
                                    </h1>
                                    <p className="max-w-[580px] text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
                                        Vá além do óbvio. Transforme triagens de risco e forças de caráter em decisões estratégicas.
                                        A primeira plataforma SaaS feita para quem exige precisão clínica e escala institucional.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                                    <Link href="/login">
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-16 px-10 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 rounded-full group">
                                            Solicitar Demo <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                                        </Button>
                                    </Link>
                                    <Link href="#solutions">
                                        <Button variant="ghost" className="h-16 px-10 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 rounded-full border border-slate-100">
                                            Explorar Soluções
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex items-center gap-8 pt-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-2xl font-black text-slate-900">100%</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance LGPD</span>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-2xl font-black text-slate-900">MIL-STD</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Grade</span>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-2xl font-black text-slate-900">24/7</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suporte VIP</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative animate-in zoom-in duration-1000 delay-300">
                                <div className="relative z-10 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden transform perspective-1000 hover:rotate-x-2 hover:-rotate-y-2 transition-all duration-700">
                                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                            <Lock size={10} className="text-slate-500" />
                                            <span className="text-[10px] font-bold text-slate-400 font-mono">dashboard.gomktia.io</span>
                                        </div>
                                        <div className="h-2 w-10 bg-white/10 rounded-full" />
                                    </div>
                                    <div className="p-10 space-y-8">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-3">
                                                <div className="h-5 w-48 bg-gradient-to-r from-indigo-500/40 to-transparent rounded-lg" />
                                                <div className="h-10 w-64 bg-white/10 rounded-xl" />
                                            </div>
                                            <div className="h-14 w-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <TrendingUp className="text-white" size={28} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="h-40 bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                                                <div className="h-2 w-12 bg-rose-500/50 rounded-full" />
                                                <div className="space-y-2">
                                                    <div className="h-8 w-24 bg-white/20 rounded-lg" />
                                                    <div className="h-3 w-16 bg-white/5 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="h-40 bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                                                <div className="h-2 w-12 bg-emerald-500/50 rounded-full" />
                                                <div className="space-y-2">
                                                    <div className="h-8 w-24 bg-white/20 rounded-lg" />
                                                    <div className="h-3 w-16 bg-white/5 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-56 bg-gradient-to-br from-indigo-500/10 via-white/5 to-transparent rounded-3xl border border-white/10 p-8 flex flex-col justify-end">
                                            <div className="flex gap-1 items-end h-full">
                                                {[30, 45, 25, 60, 40, 75, 50, 90, 65, 80].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-indigo-500/30 rounded-t-lg transition-all hover:bg-indigo-500 hover:scale-y-110 duration-500" style={{ height: `${h}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-600/20 rounded-full blur-[80px] -z-10" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Niches Solutions Section */}
                <section id="solutions" className="w-full py-32 bg-slate-50 relative">
                    <div className="container px-4 md:px-6 mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center mb-20">
                            <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Adaptabilidade Extrema</span>
                            <h2 className="text-4xl font-black text-slate-900 sm:text-6xl tracking-tight max-w-3xl">Uma plataforma. <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Múltiplos Universos.</span></h2>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-12 items-start">
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                {[
                                    { id: 'school', icon: School, title: 'Ecossistema Educacional', sub: 'Escolas, Redes & Faculdades' },
                                    { id: 'military', icon: ShieldCheck, title: 'Prontidão Militar', sub: 'Forças Armadas & Policiais' },
                                    { id: 'corporate', icon: Building2, title: 'ESG & Alta Performance', sub: 'Grandes Corporações & Saúde' }
                                ].map((niche) => (
                                    <button
                                        key={niche.id}
                                        onClick={() => setActiveNiche(niche.id as any)}
                                        className={cn(
                                            "flex items-center gap-5 p-6 rounded-3xl transition-all duration-500 text-left border-2 group",
                                            activeNiche === niche.id
                                                ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100"
                                                : "bg-transparent border-transparent hover:bg-slate-200/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            activeNiche === niche.id ? "bg-indigo-600 text-white" : "bg-white text-slate-400 group-hover:text-slate-900 shadow-sm"
                                        )}>
                                            <niche.icon size={26} />
                                        </div>
                                        <div>
                                            <h4 className={cn("font-black text-lg", activeNiche === niche.id ? "text-slate-900" : "text-slate-500")}>{niche.title}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{niche.sub}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-2xl shadow-slate-200 border border-slate-100 min-h-[500px] flex flex-col justify-center animate-in fade-in zoom-in duration-700">
                                    {activeNiche === 'school' && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Nicho Educacional</span>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <h3 className="text-4xl font-black text-slate-900 leading-tight">Vá além do boletim de notas.<br />Mapeie o futuro do seu aluno.</h3>
                                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                                                Transforme sua escola em um centro de inteligência socioemocional. Reduza conflitos, identifique sinais de ansiedade silenciosa e aumente o engajamento através das Forças de Caráter (VIA Institute).
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-6 pt-4">
                                                {[
                                                    'Prevenção Automatizada ao Bullying',
                                                    'Relatórios de Impacto para o MEC',
                                                    'Acolhimento Familiar Estratégico',
                                                    'Dashboard do Professor em Tempo Real'
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <CheckCircle2 size={16} />
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {activeNiche === 'military' && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Forças de Segurança</span>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <h3 className="text-4xl font-black text-slate-900 leading-tight">Poder de Combate é Prontidão Psicológica.</h3>
                                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                                                Monitore a resiliência operacional da tropa. Identifique sinais precoces de Burnout Operacional e TEPT. Gestão estratégica de capital humano para Comandantes que prezam pela missão e pelo homem.
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-6 pt-4">
                                                {[
                                                    'Mapeamento de Resiliência de Tropa',
                                                    'Alertas de Risco Psicossocial',
                                                    'Compliance com Protocolos Militares',
                                                    'Gestão de Atendimento em Saúde Mental'
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                                                        <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <ShieldCheck size={16} />
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {activeNiche === 'corporate' && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Cultura & ESG</span>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <h3 className="text-4xl font-black text-slate-900 leading-tight">O Fator Humano é o seu Maior Diferencial Competitivo.</h3>
                                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                                                Alcance metas de ESG com indicadores reais de bem-estar. Reduza o Turnover e aumente a produtividade colocando a pessoa certa na função certa, baseado no mapeamento das 24 Forças de Caráter.
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-6 pt-4">
                                                {[
                                                    'Relatórios de Felicidade Corporativa',
                                                    'Identificação de Talentos (VIA)',
                                                    'Redução do Burnout & Absenteísmo',
                                                    'Analytics para Conselhos de Admin'
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                                                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                            <Star size={16} />
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-sm">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section id="methodology" className="w-full py-32 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid lg:grid-cols-3 gap-16">
                            <div className="space-y-6">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Cpu size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Engenharia de Laudos com IA</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    Nossa IA não substitui o profissional; ela o empodera. Gere rascunhos técnicos precisos em segundos, cruzando centenas de indicadores comportamentais.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                                    <Globe size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Multi-Tenant Global</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    Uma arquitetura de ponta que permite gerenciar desde uma única clínica até redes nacionais com isolamento total de dados e configurações personalizadas.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm">
                                    <BarChart3 size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">EWS - Early Warning System</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    Sistema de Alerta Precoce que detecta quedas de produtividade ou mudanças de comportamento antes que se tornem crises. Prevenção é poder.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="w-full py-32 bg-slate-900 relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/40 rounded-full blur-[100px]" />

                    <div className="container px-4 md:px-6 mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center mb-20 space-y-4">
                            <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">Investment Tiers</span>
                            <h2 className="text-4xl font-black text-white sm:text-6xl tracking-tight">Investimento em <span className="text-indigo-400">Capital Humano.</span></h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {/* Essential */}
                            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 border border-white/10 hover:border-white/20 transition-all group flex flex-col">
                                <div className="mb-8 p-3 rounded-2xl bg-white/5 w-fit">
                                    <div className="h-1 w-12 bg-slate-400 rounded-full mb-1" />
                                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">Essential</span>
                                </div>
                                <div className="mb-8">
                                    <div className="text-5xl font-black text-white mb-2 tracking-tighter">R$ 1.990<span className="text-sm font-medium text-slate-400">/mês</span></div>
                                    <p className="text-sm text-slate-400 font-medium">Ideal para unidades piloto e clínicas especializadas.</p>
                                </div>
                                <div className="space-y-4 mb-10 flex-1">
                                    {[
                                        'Até 200 Usuários Ativos',
                                        'Triagem SRSS-IE Completa',
                                        'Dashboards de Risco Básico',
                                        'Suporte por Canal Direto'
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm font-bold text-slate-300">
                                            <CheckCircle2 size={16} className="text-indigo-400" /> {feat}
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest h-14 rounded-2xl">Começar Agora</Button>
                            </div>

                            {/* Advance */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/20 scale-105 border border-indigo-500/50 relative flex flex-col">
                                <div className="absolute top-6 right-8 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20">Vanguard</div>
                                <div className="mb-8 p-3 rounded-2xl bg-white/10 w-fit">
                                    <div className="h-1 w-12 bg-white rounded-full mb-1" />
                                    <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Advance</span>
                                </div>
                                <div className="mb-8">
                                    <div className="text-5xl font-black text-white mb-2 tracking-tighter">R$ 3.490<span className="text-sm font-medium text-white/50">/mês</span></div>
                                    <p className="text-sm text-white/70 font-medium">Gestão em escala para instituições em crescimento.</p>
                                </div>
                                <div className="space-y-4 mb-10 flex-1">
                                    {[
                                        'Até 1.000 Usuários Ativos',
                                        'Cruzamento VIA (Forças) + SRSS',
                                        'Dashboard Evolutivo Comparativo',
                                        'Exportação Avançada (Excel/CSV)',
                                        'Prioridade de Suporte'
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm font-bold text-white">
                                            <CheckCircle2 size={16} className="text-white" /> {feat}
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full bg-white text-indigo-700 hover:bg-slate-50 font-black text-xs uppercase tracking-widest h-14 rounded-2xl shadow-xl">Contratar Advance</Button>
                            </div>

                            {/* Sovereign */}
                            <div className="bg-slate-800/50 backdrop-blur-md rounded-[3rem] p-10 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
                                <div className="mb-8 p-3 rounded-2xl bg-white/5 w-fit">
                                    <div className="h-1 w-12 bg-amber-400 rounded-full mb-1" />
                                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest leading-none">Sovereign</span>
                                </div>
                                <div className="mb-8">
                                    <div className="text-5xl font-black text-white mb-2 tracking-tighter">Custom<span className="text-sm font-medium text-slate-500"> /vol</span></div>
                                    <p className="text-sm text-slate-400 font-medium">Inteligência total para Redes Nacionais e Forças Armadas.</p>
                                </div>
                                <div className="space-y-4 mb-10 flex-1">
                                    {[
                                        'Usuários Ilimitados',
                                        'Geração de Laudos com IA (Ilimitado)',
                                        'White Label & Custom Domain',
                                        'SLA Garantido em Contrato',
                                        'Consultoria de Implantação VIP'
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm font-bold text-slate-300">
                                            <CheckCircle2 size={16} className="text-amber-400" /> {feat}
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest h-14 rounded-2xl">Falar com Consultor</Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="w-full py-24 bg-white">
                    <div className="container px-4 text-center space-y-8">
                        <div className="flex justify-center -space-x-4 mb-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center">
                                    <Users2 className="text-slate-400" size={20} />
                                </div>
                            ))}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pronto para liderar com inteligência?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/login">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Iniciar Jornada Grátis</Button>
                            </Link>
                            <Button variant="outline" className="h-14 px-12 rounded-full text-xs font-black uppercase tracking-widest border-slate-200">Agendar Demonstração</Button>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" /> Dados criptografados ponta a ponta
                        </p>
                    </div>
                </section>
            </main>

            <footer className="w-full py-20 bg-slate-50 border-t border-slate-200">
                <div className="container px-4 md:px-12 mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1 space-y-6">
                            <Link className="flex items-center gap-3" href="#">
                                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                    <BrainCircuit size={18} />
                                </div>
                                <span className="font-black text-xl tracking-tighter text-slate-900">Triavium</span>
                            </Link>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                A primeira plataforma de gestão socioemocional e psicossocial multi-tenant nativa de alta performance.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-6">Plataforma</h4>
                            <ul className="space-y-4 text-sm font-bold text-slate-500">
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Funcionalidades</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Segurança</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Nichos</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-6">Metodologia</h4>
                            <ul className="space-y-4 text-sm font-bold text-slate-500">
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">SRSS-IE</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">VIA Strengths</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">EWS System</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm font-bold text-slate-500">
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Privacidade</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Termos de Uso</Link></li>
                                <li><Link href="#" className="hover:text-indigo-600 transition-colors">Compliance LGPD</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 Triavium Educação e Desenvolvimento LTDA. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="#" className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"><Globe size={18} /></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
