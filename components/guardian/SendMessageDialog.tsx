'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { sendFamilyMessage } from '@/app/actions/family-communication';
import { toast } from 'sonner';
import { MessageSquare, Loader2 } from 'lucide-react';

interface SendMessageDialogProps {
  studentId: string;
  studentName: string;
}

const TYPE_OPTIONS = [
  { value: 'AVISO', label: 'Aviso' },
  { value: 'PARABENS', label: 'Parabéns' },
  { value: 'REUNIAO', label: 'Reunião' },
  { value: 'SUGESTAO', label: 'Sugestão' },
];

export function SendMessageDialog({ studentId, studentName }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const resetState = () => {
    setType('');
    setSubject('');
    setMessage('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleSubmit = () => {
    if (!type || !subject.trim() || !message.trim()) return;

    startTransition(async () => {
      try {
        const result = await sendFamilyMessage({
          studentId,
          type,
          subject: subject.trim(),
          message: message.trim(),
        });

        if (!result.success) {
          toast.error(result.error || 'Erro ao enviar mensagem.');
          return;
        }

        if (result.emailSent) {
          toast.success('Mensagem enviada e notificação por e-mail entregue!');
        } else {
          toast.success('Mensagem enviada com sucesso!');
        }

        setOpen(false);
        resetState();
      } catch {
        toast.error('Erro inesperado ao enviar mensagem.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar Mensagem à Família
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem à Família</DialogTitle>
          <DialogDescription>
            Envie uma mensagem para os responsáveis de {studentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="msg-type">Tipo</Label>
            <Select value={type} onValueChange={setType} disabled={isPending}>
              <SelectTrigger id="msg-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg-subject">Assunto</Label>
            <Input
              id="msg-subject"
              placeholder="Assunto da mensagem"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg-message">Mensagem</Label>
            <Textarea
              id="msg-message"
              placeholder="Escreva sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending || !type || !subject.trim() || !message.trim()}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            {isPending ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
