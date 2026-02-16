import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CriticalAlertEmailProps {
    to: string[];
    studentName: string;
    tier: string;
    lastLogCategory: string;
    lastLogDescription: string;
    alertLink: string;
}

export async function sendCriticalAlertEmail({
    to,
    studentName,
    tier,
    lastLogCategory,
    lastLogDescription,
    alertLink,
}: CriticalAlertEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY não configurada. E-mail não enviado.');
        return;
    }

    try {
        await resend.emails.send({
            from: 'Sistema Socioemocional <alertas@seusistema.com.br>', // Ajuste conforme domínio verificado
            to,
            subject: `⚠️ [URGENTE] Alerta de Risco Crítico - Aluno: ${studentName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Risco Crítico Identificado</h1>
                    </div>
                    
                    <div style="padding: 24px; background-color: #ffffff;">
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            A Inteligência Nativa detectou um padrão de alto risco que requer atenção imediata da equipe psicopedagógica.
                        </p>

                        <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
                            <h3 style="color: #1e293b; margin: 0 0 12px 0;">Resumo Híbrido</h3>
                            <ul style="color: #475569; margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 8px;"><strong>Aluno:</strong> ${studentName}</li>
                                <li style="margin-bottom: 8px;"><strong>Classificação SRSS:</strong> <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;">${tier}</span></li>
                                <li style="margin-bottom: 8px;"><strong>Última Ocorrência:</strong> ${lastLogCategory}</li>
                                <li style="margin-bottom: 0;"><strong>Detalhes:</strong> "${lastLogDescription}"</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${alertLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Visualizar Perfil do Aluno
                            </a>
                        </div>
                        
                        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
                            Ação Sugerida: Realizar acolhimento individual nas próximas 24h.
                        </p>
                    </div>
                </div>
            `,
        });
        console.log(`📧 E-mail de alerta enviado para ${to.length} destinatários.`);
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de alerta:', error);
    }
}
