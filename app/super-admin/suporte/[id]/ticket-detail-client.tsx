'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    Loader2,
    Send,
    Clock,
    CheckCircle2,
    PauseCircle,
    XCircle,
    PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { replyToTicket, updateTicketStatus } from '@/app/actions/tickets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    user: { name: string; role: string };
}

interface TicketData {
    id: string;
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
    closedAt: string | null;
    tenant: { name: string };
    user: { name: string; email: string; role: string };
    messages: Message[];
}

interface TicketDetailClientProps {
    ticket: TicketData;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; classes: string }> = {
    LOW: { label: 'Baixa', classes: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Média', classes: 'bg-blue-100 text-blue-700' },
    HIGH: { label: 'Alta', classes: 'bg-amber-100 text-amber-700' },
    URGENT: { label: 'Urgente', classes: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
    OPEN: { label: 'Aberto', classes: 'bg-amber-100 text-amber-700' },
    IN_PROGRESS: { label: 'Em Andamento', classes: 'bg-blue-100 text-blue-700' },
    WAITING_USER: { label: 'Aguardando', classes: 'bg-violet-100 text-violet-700' },
    RESOLVED: { label: 'Resolvido', classes: 'bg-emerald-100 text-emerald-700' },
    CLOSED: { label: 'Fechado', classes: 'bg-slate-100 text-slate-500' },
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gestor',
    TEACHER: 'Professor',
    PSYCHOLOGIST: 'Psicólogo',
    COUNSELOR: 'Orientador',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TicketDetailClient({ ticket }: TicketDetailClientProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(ticket.messages);
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, startReplyTransition] = useTransition();
    const [isUpdatingStatus, startStatusTransition] = useTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function handleReply() {
        if (!replyContent.trim()) return;

        startReplyTransition(async () => {
            try {
                const message = await replyToTicket(ticket.id, replyContent.trim());
                setMessages((prev) => [
                    ...prev,
                    {
                        id: message.id,
                        content: replyContent.trim(),
                        isAdmin: true,
                        createdAt: new Date().toISOString(),
                        user: message.user,
                    },
                ]);
                setReplyContent('');

                // Auto-update local status to match server behavior
                if (status !== 'RESOLVED' && status !== 'CLOSED') {
                    setStatus('WAITING_USER');
                }

                toast.success('Resposta enviada.');
            } catch {
                toast.error('Erro ao enviar resposta.');
            }
        });
    }

    function handleStatusChange(newStatus: TicketStatus) {
        startStatusTransition(async () => {
            try {
                await updateTicketStatus(ticket.id, newStatus);
                setStatus(newStatus);
                toast.success(`Status alterado para "${STATUS_CONFIG[newStatus].label}".`);
            } catch {
                toast.error('Erro ao alterar status.');
            }
        });
    }

    const isClosed = status === 'RESOLVED' || status === 'CLOSED';

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={() => router.push('/super-admin/suporte')}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft size={16} />
                Voltar aos Chamados
            </button>

            {/* Header Card */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {ticket.subject}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge
                                    className={cn(
                                        'text-[9px] font-black uppercase tracking-widest border-none shadow-none',
                                        PRIORITY_CONFIG[ticket.priority].classes
                                    )}
                                >
                                    {PRIORITY_CONFIG[ticket.priority].label}
                                </Badge>
                                <Badge
                                    className={cn(
                                        'text-[9px] font-black uppercase tracking-widest border-none shadow-none',
                                        STATUS_CONFIG[status].classes
                                    )}
                                >
                                    {STATUS_CONFIG[status].label}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                <span>
                                    <strong className="text-slate-700">Escola:</strong> {ticket.tenant.name}
                                </span>
                                <span>
                                    <strong className="text-slate-700">Aberto por:</strong> {ticket.user.name} ({ticket.user.email})
                                </span>
                                <span>
                                    <strong className="text-slate-700">Data:</strong>{' '}
                                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {isUpdatingStatus && (
                                <Loader2 size={16} className="animate-spin text-indigo-500 self-center" />
                            )}
                            {status !== 'IN_PROGRESS' && !isClosed && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-bold"
                                    onClick={() => handleStatusChange('IN_PROGRESS')}
                                    disabled={isUpdatingStatus}
                                >
                                    <PlayCircle size={14} className="mr-1" />
                                    Em Andamento
                                </Button>
                            )}
                            {status !== 'WAITING_USER' && !isClosed && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-bold"
                                    onClick={() => handleStatusChange('WAITING_USER')}
                                    disabled={isUpdatingStatus}
                                >
                                    <PauseCircle size={14} className="mr-1" />
                                    Aguardando
                                </Button>
                            )}
                            {status !== 'RESOLVED' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() => handleStatusChange('RESOLVED')}
                                    disabled={isUpdatingStatus}
                                >
                                    <CheckCircle2 size={14} className="mr-1" />
                                    Resolver
                                </Button>
                            )}
                            {status !== 'CLOSED' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
                                    onClick={() => handleStatusChange('CLOSED')}
                                    disabled={isUpdatingStatus}
                                >
                                    <XCircle size={14} className="mr-1" />
                                    Fechar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages Thread */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                <CardContent className="p-6">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">
                        Mensagens
                    </h2>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex',
                                    msg.isAdmin ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'max-w-[75%] rounded-2xl px-5 py-4',
                                        msg.isAdmin
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-800'
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={cn(
                                                'text-[10px] font-black uppercase tracking-widest',
                                                msg.isAdmin ? 'text-indigo-200' : 'text-slate-400'
                                            )}
                                        >
                                            {msg.user.name}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[9px] font-bold',
                                                msg.isAdmin ? 'text-indigo-300' : 'text-slate-300'
                                            )}
                                        >
                                            {ROLE_LABELS[msg.user.role] || msg.user.role}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-[10px] mt-2',
                                            msg.isAdmin ? 'text-indigo-300' : 'text-slate-400'
                                        )}
                                    >
                                        {new Date(msg.createdAt).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Area */}
                    {!isClosed && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <Textarea
                                placeholder="Digite sua resposta..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[100px] resize-none mb-3"
                                disabled={isReplying}
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleReply}
                                    disabled={isReplying || !replyContent.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-xs uppercase"
                                >
                                    {isReplying ? (
                                        <Loader2 size={14} className="mr-2 animate-spin" />
                                    ) : (
                                        <Send size={14} className="mr-2" />
                                    )}
                                    Enviar Resposta
                                </Button>
                            </div>
                        </div>
                    )}

                    {isClosed && (
                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-bold">
                                Este chamado foi {status === 'RESOLVED' ? 'resolvido' : 'fechado'}.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
