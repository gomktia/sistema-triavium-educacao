
export async function triggerWebhook(_event: string, _payload: unknown) {
    // No-op: webhook integration not yet implemented.
    // When ready, send to process.env.WEBHOOK_URL without logging payload (contains student PII).
}
