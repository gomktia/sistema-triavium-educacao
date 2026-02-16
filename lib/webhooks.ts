
export async function triggerWebhook(event: string, payload: any) {
    // TODO: Implementar envio real para API externa (ex: WhatsApp)
    // const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;

    console.log(`🪝 Webhook Triggered: ${event}`, JSON.stringify(payload, null, 2));

    // Exemplo de implementação futura:
    // if (webhookUrl) {
    //     await fetch(webhookUrl, {
    //         method: 'POST',
    //         body: JSON.stringify({ event, data: payload }),
    //         headers: { 'Content-Type': 'application/json' }
    //     });
    // }
}
