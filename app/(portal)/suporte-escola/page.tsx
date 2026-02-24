'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    HeartHandshake,
    Plus,
    Loader2,
    Send,
    ChevronDown,
    ChevronUp,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    getTickets,
    getTicketById,
    createTicket,
    replyToTicket,
} from '@/app/actions/tickets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';

interface TicketListItem {
    id: string;
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: Date;
    tenant: { name: string };
    user: { name: string; email: string };
    _count: { messages: number };
}

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    user: { name: string; role: string };
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

const ALL_PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SuporteEscolaPage() {
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedMessages, setExpandedMessages] = useState<Message[]>([]);
    const [isLoadingMessages, startMessagesTransition] = useTransition();

    // Create ticket dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
    const [isCreating, startCreateTransition] = useTransition();

    // Reply state
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, startReplyTransition] = useTransition();

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        setIsLoading(true);
        try {
            const result = await getTickets();
            setTickets(result.tickets as TicketListItem[]);
        } catch {
            toast.error('Erro ao carregar chamados.');
        } finally {
            setIsLoading(false);
        }
    }

    function handleToggleExpand(ticketId: string) {
        if (expandedId === ticketId) {
            setExpandedId(null);
            setExpandedMessages([]);
            setReplyContent('');
            return;
        }

        setExpandedId(ticketId);
        startMessagesTransition(async () => {
            try {
                const ticket = await getTicketById(ticketId);
                if (ticket) {
                    setExpandedMessages(
                        ticket.messages.map((m) => ({
                            ...m,
                            createdAt: m.createdAt instanceof Date
                                ? m.createdAt.toISOString()
                                : String(m.createdAt),
                        }))
                    );
                }
            } catch {
                toast.error('Erro ao carregar mensagens.');
            }
        });
    }

    function handleCreateTicket() {
        if (!newSubject.trim() || !newMessage.trim()) {
            toast.error('Preencha todos os campos.');
            return;
        }

        startCreateTransition(async () => {
            try {
                await createTicket({
                    subject: newSubject.trim(),
                    message: newMessage.trim(),
                    priority: newPriority,
                });
                toast.success('Chamado aberto com sucesso!');
                setDialogOpen(false);
                setNewSubject('');
                setNewMessage('');
                setNewPriority('MEDIUM');
                await loadTickets();
            } catch {
                toast.error('Erro ao abrir chamado.');
            }
        });
    }

    function handleReply(ticketId: string) {
        if (!replyContent.trim()) return;

        startReplyTransition(async () => {
            try {
                const message = await replyToTicket(ticketId, replyContent.trim());
                setExpandedMessages((prev) => [
                    ...prev,
                    {
                        id: message.id,
                        content: replyContent.trim(),
                        isAdmin: false,
                        createdAt: new Date().toISOString(),
                        user: message.user,
                    },
                ]);
                setReplyContent('');
                toast.success('Resposta enviada.');
                await loadTickets();
            } catch {
                toast.error('Erro ao enviar resposta.');
            }
        });
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                            <HeartHandshake size={14} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                            Suporte
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Central de Suporte
                    </h1>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-xs uppercase">
                            <Plus size={14} className="mr-2" />
                            Abrir Chamado
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900">
                                Novo Chamado
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Assunto
                                </Label>
                                <Input
                                    id="subject"
                                    placeholder="Descreva brevemente o problema..."
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Mensagem
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="Descreva em detalhes o que está acontecendo..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="min-h-[120px] resize-none"
                                    disabled={isCreating}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Prioridade
                                </Label>
                                <Select
                                    value={newPriority}
                                    onValueChange={(v) => setNewPriority(v as TicketPriority)}
                                    disabled={isCreating}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ALL_PRIORITIES.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {PRIORITY_CONFIG[p].label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCreateTicket}
                                disabled={isCreating || !newSubject.trim() || !newMessage.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase"
                            >
                                {isCreating ? (
                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                ) : (
                                    <Send size={14} className="mr-2" />
                                )}
                                Enviar Chamado
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
            )}

            {/* Tickets List */}
            {!isLoading && (
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 py-6">
                        <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">
                            Meus Chamados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {tickets.map((ticket) => {
                                const isExpanded = expandedId === ticket.id;
                                const isClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

                                return (
                                    <div key={ticket.id}>
                                        {/* Ticket Row */}
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => handleToggleExpand(ticket.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-slate-800 text-sm truncate">
                                                        {ticket.subject}
                                                    </h3>
                                                    {isExpanded ? (
                                                        <ChevronUp size={14} className="text-slate-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                                    {' '}
                                                    &middot;
                                                    {' '}
                                                    {ticket._count.messages} {ticket._count.messages === 1 ? 'mensagem' : 'mensagens'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
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
                                                        STATUS_CONFIG[ticket.status].classes
                                                    )}
                                                >
                                                    {STATUS_CONFIG[ticket.status].label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Expanded Messages */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 border-t border-slate-100">
                                                {isLoadingMessages ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 mt-4">
                                                        {expandedMessages.map((msg) => (
                                                            <div
                                                                key={msg.id}
                                                                className={cn(
                                                                    'flex',
                                                                    msg.isAdmin ? 'justify-start' : 'justify-end'
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'max-w-[75%] rounded-2xl px-4 py-3',
                                                                        msg.isAdmin
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-white border border-slate-200 text-slate-800'
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
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
                                                                            'text-[10px] mt-1',
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

                                                        {/* Reply Area */}
                                                        {!isClosed && (
                                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                                <Textarea
                                                                    placeholder="Digite sua resposta..."
                                                                    value={replyContent}
                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                    className="min-h-[80px] resize-none mb-3"
                                                                    disabled={isReplying}
                                                                />
                                                                <div className="flex justify-end">
                                                                    <Button
                                                                        onClick={() => handleReply(ticket.id)}
                                                                        disabled={isReplying || !replyContent.trim()}
                                                                        className="bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase"
                                                                        size="sm"
                                                                    >
                                                                        {isReplying ? (
                                                                            <Loader2 size={14} className="mr-2 animate-spin" />
                                                                        ) : (
                                                                            <Send size={14} className="mr-2" />
                                                                        )}
                                                                        Enviar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isClosed && (
                                                            <p className="text-sm text-slate-400 font-bold text-center mt-4">
                                                                Este chamado foi {ticket.status === 'RESOLVED' ? 'resolvido' : 'fechado'}.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {tickets.length === 0 && !isLoading && (
                            <div className="p-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700">
                                        Nenhum chamado ainda
                                    </h3>
                                    <p className="text-slate-400 max-w-md">
                                        Clique em &quot;Abrir Chamado&quot; para enviar uma solicitação ao suporte.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
