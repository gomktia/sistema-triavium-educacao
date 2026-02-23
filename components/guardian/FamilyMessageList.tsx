'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { markFamilyMessageRead } from '@/app/actions/family-communication';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface FamilyMessage {
  id: string;
  type: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  student: { name: string };
  sender: { name: string };
}

interface FamilyMessageListProps {
  messages: FamilyMessage[];
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  AVISO: { label: 'Aviso', className: 'bg-amber-100 text-amber-700' },
  PARABENS: { label: 'Parabéns', className: 'bg-emerald-100 text-emerald-700' },
  REUNIAO: { label: 'Reunião', className: 'bg-blue-100 text-blue-700' },
  SUGESTAO: { label: 'Sugestão', className: 'bg-purple-100 text-purple-700' },
};

export function FamilyMessageList({ messages }: FamilyMessageListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(messages.filter((m) => m.isRead).map((m) => m.id))
  );
  const [, startTransition] = useTransition();

  if (messages.length === 0) {
    return (
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardContent className="py-16 text-center">
          <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} strokeWidth={1.5} />
          <p className="text-slate-400 font-bold">Nenhuma mensagem</p>
          <p className="text-slate-400 text-sm mt-1">
            Quando a escola enviar mensagens, elas aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleExpand = (msg: FamilyMessage) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(msg.id);

    // Mark as read if not already
    if (!readIds.has(msg.id)) {
      setReadIds((prev) => new Set([...prev, msg.id]));
      startTransition(async () => {
        await markFamilyMessageRead(msg.id);
      });
    }
  };

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isRead = readIds.has(msg.id);
        const isExpanded = expandedId === msg.id;
        const badge = TYPE_BADGES[msg.type] || { label: msg.type, className: 'bg-slate-100 text-slate-600' };
        const date = new Date(msg.createdAt);

        return (
          <Card
            key={msg.id}
            className={`border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] cursor-pointer transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${
              !isRead ? 'ring-2 ring-indigo-200 bg-indigo-50/30' : ''
            }`}
            onClick={() => handleExpand(msg)}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {msg.student.name}
                    </span>
                  </div>
                  <h3 className={`text-sm truncate ${!isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {msg.subject}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {msg.sender.name} · {format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
