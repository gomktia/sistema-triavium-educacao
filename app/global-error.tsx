'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
                    <h2>Algo deu errado</h2>
                    <p>Nosso time foi notificado e estamos trabalhando na solucao.</p>
                    {error.digest && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Codigo: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.5rem 1rem',
                            marginTop: '1rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    );
}
