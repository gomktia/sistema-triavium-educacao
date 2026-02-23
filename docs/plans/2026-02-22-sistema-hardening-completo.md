# Sistema Triavium - Hardening Completo

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir todas as lacunas criticas, altas e medias do Sistema Triavium - desde seguranca e validacao ate performance e acessibilidade.

**Architecture:** Abordagem em 4 fases priorizadas por severidade. Cada fase eh independente e pode ser commitada separadamente. Fase 1 (Critico) bloqueia producao. Fases 2-4 sao melhorias incrementais.

**Tech Stack:** Zod (validacao), Sentry (monitoramento), Next.js error/loading boundaries, GitHub Actions (CI/CD), Supabase Realtime, next/dynamic (code splitting)

---

## Fase 1: CRITICO - Seguranca e Fundacao

### Task 1: Instalar dependencias necessarias

**Files:**
- Modify: `package.json`

**Step 1: Instalar Zod, Sentry e tipos**

```bash
npm install zod @sentry/nextjs
npm install -D @types/bcryptjs
```

**Step 2: Verificar que instalou corretamente**

Run: `npm ls zod @sentry/nextjs`
Expected: versoes listadas sem erros

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod, sentry dependencies"
```

---

### Task 2: Criar tipo ActionResult padronizado

**Files:**
- Create: `lib/action-result.ts`
- Test: `__tests__/action-result.test.ts`

**Step 1: Escrever o teste**

```typescript
// __tests__/action-result.test.ts
import { describe, it, expect } from 'vitest';
import { ok, fail, isOk, isFail } from '@/lib/action-result';

describe('ActionResult', () => {
    it('ok() creates success result', () => {
        const result = ok({ id: '123' });
        expect(result.success).toBe(true);
        expect(isOk(result) && result.data.id).toBe('123');
    });

    it('fail() creates error result', () => {
        const result = fail('Algo deu errado');
        expect(result.success).toBe(false);
        expect(isFail(result) && result.error).toBe('Algo deu errado');
    });

    it('fail() with field errors', () => {
        const result = fail('Validacao falhou', { name: 'Obrigatorio' });
        expect(isFail(result) && result.fieldErrors?.name).toBe('Obrigatorio');
    });
});
```

**Step 2: Rodar teste para ver falhar**

Run: `npx vitest run __tests__/action-result.test.ts`
Expected: FAIL - module not found

**Step 3: Implementar**

```typescript
// lib/action-result.ts
export type ActionOk<T> = { success: true; data: T };
export type ActionFail = { success: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult<T> = ActionOk<T> | ActionFail;

export function ok<T>(data: T): ActionOk<T> {
    return { success: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionFail {
    return { success: false, error, fieldErrors };
}

export function isOk<T>(result: ActionResult<T>): result is ActionOk<T> {
    return result.success === true;
}

export function isFail<T>(result: ActionResult<T>): result is ActionFail {
    return result.success === false;
}
```

**Step 4: Rodar teste para ver passar**

Run: `npx vitest run __tests__/action-result.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/action-result.ts __tests__/action-result.test.ts
git commit -m "feat: add standardized ActionResult type with ok/fail helpers"
```

---

### Task 3: Criar schemas Zod para validacao de assessments

**Files:**
- Create: `lib/validators/assessment.ts`
- Test: `__tests__/validators/assessment.test.ts`

**Step 1: Escrever os testes**

```typescript
// __tests__/validators/assessment.test.ts
import { describe, it, expect } from 'vitest';
import {
    viaAnswersSchema,
    srssAnswersSchema,
    bigFiveAnswersSchema,
    ieaaAnswersSchema,
} from '@/lib/validators/assessment';

describe('Assessment Validators', () => {
    describe('VIA Answers', () => {
        it('accepts valid complete answers (71 items, 0-4)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 71; i++) answers[String(i)] = Math.floor(Math.random() * 5);
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('accepts partial answers (in-progress)', () => {
            const answers = { '1': 3, '2': 4, '3': 0 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects values outside 0-4 range', () => {
            const answers = { '1': 5 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });

        it('rejects negative values', () => {
            const answers = { '1': -1 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('SRSS Answers', () => {
        it('accepts valid answers (12 items, 0-3)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 12; i++) answers[String(i)] = Math.floor(Math.random() * 4);
            const result = srssAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects values outside 0-3', () => {
            const answers = { '1': 4 };
            const result = srssAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('Big Five Answers', () => {
        it('accepts valid answers (50 items, 1-5)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 50; i++) answers[String(i)] = Math.ceil(Math.random() * 5);
            const result = bigFiveAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects value 0 (Big Five uses 1-5)', () => {
            const answers = { '1': 0 };
            const result = bigFiveAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('IEAA Answers', () => {
        it('accepts valid answers (50 items, 1-5)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 50; i++) answers[String(i)] = Math.ceil(Math.random() * 5);
            const result = ieaaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });
    });
});
```

**Step 2: Rodar teste para ver falhar**

Run: `npx vitest run __tests__/validators/assessment.test.ts`
Expected: FAIL

**Step 3: Implementar os schemas**

```typescript
// lib/validators/assessment.ts
import { z } from 'zod';

/** VIA: 71 items, escala 0-4 */
export const viaAnswersSchema = z.record(
    z.string(),
    z.number().int().min(0).max(4)
);

/** SRSS-IE: 12 items, escala 0-3 */
export const srssAnswersSchema = z.record(
    z.string(),
    z.number().int().min(0).max(3)
);

/** Big Five: 50 items, escala 1-5 */
export const bigFiveAnswersSchema = z.record(
    z.string(),
    z.number().int().min(1).max(5)
);

/** IEAA: 50 items, escala 1-5 */
export const ieaaAnswersSchema = z.record(
    z.string(),
    z.number().int().min(1).max(5)
);

/** Schema para salvar VIA */
export const saveVIAInputSchema = z.object({
    answers: viaAnswersSchema,
    targetStudentId: z.string().cuid().optional(),
});

/** Schema para salvar SRSS */
export const saveSRSSInputSchema = z.object({
    studentId: z.string().cuid(),
    answers: srssAnswersSchema,
});

/** Schema para salvar Big Five */
export const saveBigFiveInputSchema = z.object({
    answers: bigFiveAnswersSchema,
    targetStudentId: z.string().cuid().optional(),
});

/** Schema para salvar IEAA */
export const saveIEAAInputSchema = z.object({
    answers: ieaaAnswersSchema,
    targetStudentId: z.string().cuid().optional(),
});
```

**Step 4: Rodar teste para ver passar**

Run: `npx vitest run __tests__/validators/assessment.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/validators/assessment.ts __tests__/validators/assessment.test.ts
git commit -m "feat: add Zod validation schemas for all assessment types"
```

---

### Task 4: Criar schemas Zod para admin, behavior, student

**Files:**
- Create: `lib/validators/admin.ts`
- Create: `lib/validators/behavior.ts`
- Create: `lib/validators/student.ts`
- Test: `__tests__/validators/admin.test.ts`

**Step 1: Escrever teste basico**

```typescript
// __tests__/validators/admin.test.ts
import { describe, it, expect } from 'vitest';
import { createSchoolSchema } from '@/lib/validators/admin';
import { behaviorLogSchema } from '@/lib/validators/behavior';
import { createStudentSchema } from '@/lib/validators/student';

describe('Admin Validators', () => {
    it('accepts valid school creation', () => {
        const result = createSchoolSchema.safeParse({
            name: 'Escola Teste',
            slug: 'escola-teste',
            email: 'contato@escola.com.br',
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
        const result = createSchoolSchema.safeParse({ name: '', slug: 'teste' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid slug (spaces)', () => {
        const result = createSchoolSchema.safeParse({ name: 'Escola', slug: 'escola teste' });
        expect(result.success).toBe(false);
    });
});

describe('Behavior Validators', () => {
    it('accepts valid behavior log', () => {
        const result = behaviorLogSchema.safeParse({
            studentId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            category: 'CONFLITO',
            severity: 2,
            description: 'Observacao do professor',
        });
        expect(result.success).toBe(true);
    });

    it('rejects severity outside 1-3', () => {
        const result = behaviorLogSchema.safeParse({
            studentId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
            category: 'CONFLITO',
            severity: 5,
        });
        expect(result.success).toBe(false);
    });
});

describe('Student Validators', () => {
    it('accepts valid student', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao Silva',
            grade: 'ANO_1_EM',
        });
        expect(result.success).toBe(true);
    });

    it('validates CPF format when provided', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao',
            grade: 'ANO_1_EM',
            cpf: '123', // invalid
        });
        expect(result.success).toBe(false);
    });
});
```

**Step 2: Rodar para ver falhar**

Run: `npx vitest run __tests__/validators/admin.test.ts`
Expected: FAIL

**Step 3: Implementar**

```typescript
// lib/validators/admin.ts
import { z } from 'zod';

export const createSchoolSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens'),
    email: z.string().email('Email invalido').optional().or(z.literal('')),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2).optional(),
    organizationType: z.enum(['EDUCATIONAL', 'MILITARY', 'CORPORATE', 'SPORTS']).default('EDUCATIONAL'),
});
```

```typescript
// lib/validators/behavior.ts
import { z } from 'zod';

const behaviorCategories = ['CONFLITO', 'ISOLAMENTO', 'TRISTEZA', 'AGRESSIVIDADE', 'POSITIVO', 'OUTROS'] as const;

export const behaviorLogSchema = z.object({
    studentId: z.string().min(1, 'ID do aluno obrigatorio'),
    category: z.enum(behaviorCategories),
    severity: z.number().int().min(1).max(3),
    description: z.string().max(2000).optional(),
});
```

```typescript
// lib/validators/student.ts
import { z } from 'zod';

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export const createStudentSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    grade: z.enum(['ANO_1_EM', 'ANO_2_EM', 'ANO_3_EM']),
    classroomId: z.string().cuid().optional(),
    cpf: z.string().regex(cpfRegex, 'CPF invalido').optional().or(z.literal('')),
    birthDate: z.string().datetime().optional(),
    enrollmentId: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianEmail: z.string().email().optional().or(z.literal('')),
});
```

**Step 4: Rodar para ver passar**

Run: `npx vitest run __tests__/validators/admin.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/validators/ __tests__/validators/
git commit -m "feat: add Zod schemas for admin, behavior, and student validation"
```

---

### Task 5: Aplicar validacao Zod nos server actions de assessment

**Files:**
- Modify: `app/actions/assessment.ts`

**Step 1: Refatorar saveVIAAnswers para usar Zod**

No arquivo `app/actions/assessment.ts`, adicionar import e validacao:

```typescript
// No topo do arquivo, adicionar:
import { saveVIAInputSchema, saveSRSSInputSchema, saveBigFiveInputSchema, saveIEAAInputSchema } from '@/lib/validators/assessment';
```

Em cada funcao save*, adicionar validacao logo apos o auth check:

Para `saveVIAAnswers`:
```typescript
export async function saveVIAAnswers(answers: VIARawAnswers, targetStudentId?: string) {
    const user = await getCurrentUser();
    if (!user) return { error: 'Nao autorizado.' };

    // NOVA VALIDACAO ZOD
    const parsed = saveVIAInputSchema.safeParse({ answers, targetStudentId });
    if (!parsed.success) {
        return { error: 'Dados invalidos: ' + parsed.error.issues[0]?.message };
    }
    // ... resto da logica inalterada
```

Repetir o mesmo padrao para `saveSRSSScreening`, `saveBigFiveAnswers`, `saveIEAAAnswers`.

**Step 2: Verificar build**

Run: `npx next build`
Expected: BUILD SUCCESS (ou apenas warnings existentes)

**Step 3: Commit**

```bash
git add app/actions/assessment.ts
git commit -m "feat: add Zod validation to all assessment server actions"
```

---

### Task 6: Aplicar validacao Zod na API de create-school

**Files:**
- Modify: `app/api/admin/create-school/route.ts`

**Step 1: Refatorar para usar Zod**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSchoolSchema } from '@/lib/validators/admin';

export async function POST(request: NextRequest) {
    try {
        await requireSuperAdmin();

        const body = await request.json();
        const parsed = createSchoolSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, slug, email, phone, city, state, organizationType } = parsed.data;

        // Verificar se slug ja existe
        const existingTenant = await prisma.tenant.findUnique({
            where: { slug }
        });

        if (existingTenant) {
            return NextResponse.json(
                { error: 'Este subdominio ja esta em uso' },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                email: email || null,
                phone: phone || null,
                city: city || null,
                state: state || null,
                organizationType,
                isActive: true,
                subscriptionStatus: 'active',
            }
        });

        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                subdomain: `${tenant.slug}.triavium.com.br`
            }
        });
    } catch (error: any) {
        console.error('Error creating school:', error);

        if (error.message === 'Access denied') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/create-school/route.ts
git commit -m "feat: add Zod validation to create-school API route"
```

---

### Task 7: Aplicar validacao Zod no behavior action

**Files:**
- Modify: `app/actions/behavior.ts`

**Step 1: Adicionar validacao**

No topo:
```typescript
import { behaviorLogSchema } from '@/lib/validators/behavior';
```

Na funcao `createBehaviorLog`:
```typescript
export async function createBehaviorLog(data: BehaviorLogInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Nao autenticado');

    // NOVA VALIDACAO ZOD
    const parsed = behaviorLogSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Dados invalidos: ' + parsed.error.issues[0]?.message);
    }

    // ... resto inalterado
```

**Step 2: Commit**

```bash
git add app/actions/behavior.ts
git commit -m "feat: add Zod validation to behavior log creation"
```

---

### Task 8: Rate limiting no middleware

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `middleware.ts`
- Test: `__tests__/rate-limit.test.ts`

**Step 1: Escrever teste**

```typescript
// __tests__/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    });

    it('allows requests within limit', () => {
        expect(limiter.check('ip-1')).toBe(true);
        expect(limiter.check('ip-1')).toBe(true);
        expect(limiter.check('ip-1')).toBe(true);
    });

    it('blocks requests over limit', () => {
        limiter.check('ip-1');
        limiter.check('ip-1');
        limiter.check('ip-1');
        expect(limiter.check('ip-1')).toBe(false);
    });

    it('isolates different keys', () => {
        limiter.check('ip-1');
        limiter.check('ip-1');
        limiter.check('ip-1');
        expect(limiter.check('ip-2')).toBe(true);
    });
});
```

**Step 2: Rodar para ver falhar**

Run: `npx vitest run __tests__/rate-limit.test.ts`
Expected: FAIL

**Step 3: Implementar rate limiter**

```typescript
// lib/rate-limit.ts
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    check(key: string): boolean {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            this.store.set(key, { count: 1, resetTime: now + this.config.windowMs });
            return true;
        }

        if (entry.count >= this.config.maxRequests) {
            return false;
        }

        entry.count++;
        return true;
    }

    // Limpar entries expirados periodicamente
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.resetTime) this.store.delete(key);
        }
    }
}

// Instancias para diferentes endpoints
export const apiRateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60_000 }); // 30/min
export const authRateLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });  // 5/min
export const createSchoolLimiter = new RateLimiter({ maxRequests: 3, windowMs: 300_000 }); // 3 per 5min

// Cleanup a cada 5 min
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        apiRateLimiter.cleanup();
        authRateLimiter.cleanup();
        createSchoolLimiter.cleanup();
    }, 300_000);
}
```

**Step 4: Rodar teste para ver passar**

Run: `npx vitest run __tests__/rate-limit.test.ts`
Expected: PASS

**Step 5: Aplicar no middleware**

Adicionar ao `middleware.ts` antes do multi-tenant routing:

```typescript
import { apiRateLimiter, authRateLimiter } from '@/lib/rate-limit';

// Dentro de middleware(), apos o check de static files:

    // 1.5 Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    if (pathname.startsWith('/api')) {
        if (!apiRateLimiter.check(clientIp)) {
            return NextResponse.json(
                { error: 'Muitas requisicoes. Tente novamente em breve.' },
                { status: 429 }
            );
        }
    }

    if (pathname === '/login') {
        if (!authRateLimiter.check(clientIp)) {
            return NextResponse.json(
                { error: 'Muitas tentativas de login. Aguarde 1 minuto.' },
                { status: 429 }
            );
        }
    }
```

**Step 6: Commit**

```bash
git add lib/rate-limit.ts __tests__/rate-limit.test.ts middleware.ts
git commit -m "feat: add rate limiting to API endpoints and auth routes"
```

---

### Task 9: Rate limiting na API create-school

**Files:**
- Modify: `app/api/admin/create-school/route.ts`

**Step 1: Adicionar rate limit especifico**

```typescript
import { createSchoolLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    // Rate limit para criacao de escola
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!createSchoolLimiter.check(clientIp)) {
        return NextResponse.json(
            { error: 'Limite de criacao de escolas atingido. Aguarde 5 minutos.' },
            { status: 429 }
        );
    }

    // ... resto da funcao
```

**Step 2: Commit**

```bash
git add app/api/admin/create-school/route.ts
git commit -m "feat: add rate limiting to school creation endpoint"
```

---

### Task 10: Security headers no next.config.ts

**Files:**
- Modify: `next.config.ts`

**Step 1: Adicionar headers de seguranca**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
```

**Step 2: Verificar build**

Run: `npx next build`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add security headers (X-Frame-Options, HSTS, CSP-related)"
```

---

### Task 11: Configurar Sentry para monitoramento

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts`
- Create: `app/global-error.tsx`

**Step 1: Rodar o wizard do Sentry (se possivel) ou configurar manualmente**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
});
```

```typescript
// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
});
```

**Step 2: Criar global-error.tsx**

```typescript
// app/global-error.tsx
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
```

**Step 3: Integrar Sentry no next.config.ts**

Envolver o nextConfig com `withSentryConfig`:

```typescript
import { withSentryConfig } from '@sentry/nextjs';

// ... nextConfig existente ...

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    disableLogger: true,
});
```

**Step 4: Adicionar variaveis ao .env.example**

```
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

**Step 5: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts app/global-error.tsx next.config.ts .env.example
git commit -m "feat: add Sentry error monitoring and global error boundary"
```

---

## Fase 2: ALTO - Qualidade e Confiabilidade

### Task 12: Error boundaries por secao do portal

**Files:**
- Create: `app/(portal)/error.tsx`
- Create: `app/(portal)/alunos/error.tsx`
- Create: `app/(portal)/dashboard/error.tsx`

**Step 1: Criar error boundary base reutilizavel**

```typescript
// app/(portal)/error.tsx
'use client';

import { useEffect } from 'react';

export default function PortalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Portal error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-800">
                    Ops! Algo nao saiu como esperado
                </h2>
                <p className="text-slate-500 mt-2 max-w-md">
                    Ocorreu um erro ao carregar esta pagina. Por favor, tente novamente.
                </p>
                {error.digest && (
                    <p className="text-xs text-slate-400 mt-1">Codigo: {error.digest}</p>
                )}
            </div>
            <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tentar novamente
            </button>
        </div>
    );
}
```

**Step 2: Criar error boundaries especificos para rotas criticas**

Copiar o mesmo padrao para `app/(portal)/alunos/error.tsx` e `app/(portal)/dashboard/error.tsx` com mensagens adaptadas.

**Step 3: Commit**

```bash
git add app/(portal)/error.tsx app/(portal)/alunos/error.tsx app/(portal)/dashboard/error.tsx
git commit -m "feat: add error boundaries for portal sections"
```

---

### Task 13: Loading states com Suspense

**Files:**
- Create: `app/(portal)/loading.tsx`
- Create: `app/(portal)/alunos/loading.tsx`
- Create: `app/(portal)/dashboard/loading.tsx`
- Create: `app/(portal)/turma/loading.tsx`

**Step 1: Criar skeleton base**

```typescript
// app/(portal)/loading.tsx
export default function PortalLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-lg" />
                ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
    );
}
```

**Step 2: Criar loadings especificos**

```typescript
// app/(portal)/alunos/loading.tsx
export default function AlunosLoading() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-slate-200 rounded w-48" />
                <div className="h-10 bg-slate-200 rounded w-32" />
            </div>
            <div className="h-10 bg-slate-200 rounded w-full" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-slate-200 rounded-lg" />
            ))}
        </div>
    );
}
```

```typescript
// app/(portal)/dashboard/loading.tsx
export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-200 rounded-lg" />
                ))}
            </div>
            <div className="h-96 bg-slate-200 rounded-lg" />
        </div>
    );
}
```

**Step 3: Commit**

```bash
git add app/(portal)/loading.tsx app/(portal)/alunos/loading.tsx app/(portal)/dashboard/loading.tsx app/(portal)/turma/loading.tsx
git commit -m "feat: add loading skeletons for all major portal routes"
```

---

### Task 14: Expandir infraestrutura de testes

**Files:**
- Modify: `vitest.config.ts`
- Create: `__tests__/setup.ts`
- Create: `__tests__/helpers/mock-prisma.ts`

**Step 1: Melhorar vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            include: ['src/core/logic/**', 'lib/**'],
            exclude: ['node_modules', '__tests__'],
            thresholds: {
                statements: 60,
                branches: 50,
                functions: 60,
                lines: 60,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            '@core': path.resolve(__dirname, './src/core'),
        },
    },
});
```

**Step 2: Criar setup e mocks**

```typescript
// __tests__/setup.ts
// Vitest global setup
import { vi } from 'vitest';

// Mock console.error/warn para nao poluir output
// vi.spyOn(console, 'error').mockImplementation(() => {});
```

```typescript
// __tests__/helpers/mock-prisma.ts
import { vi } from 'vitest';

export function createMockPrisma() {
    return {
        student: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        assessment: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        behaviorLog: {
            findMany: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
        },
        notification: {
            createMany: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        tenant: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    };
}
```

**Step 3: Commit**

```bash
git add vitest.config.ts __tests__/setup.ts __tests__/helpers/mock-prisma.ts
git commit -m "feat: expand test infrastructure with coverage thresholds and mocks"
```

---

### Task 15: Testes para logica core (Big Five + IEAA)

**Files:**
- Create: `__tests__/bigfive.test.ts`
- Create: `__tests__/ieaa.test.ts`

**Step 1: Escrever testes para Big Five**

```typescript
// __tests__/bigfive.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBigFiveScores } from '@/src/core/logic/bigfive';

describe('Big Five Scoring', () => {
    it('calculates scores for complete answers', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 3;
        const result = calculateBigFiveScores(answers);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(5);
    });

    it('each domain has score, label, and level', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 4;
        const result = calculateBigFiveScores(answers);
        for (const domain of result) {
            expect(domain).toHaveProperty('domain');
            expect(domain).toHaveProperty('score');
            expect(domain).toHaveProperty('label');
            expect(domain).toHaveProperty('level');
            expect(['Baixo', 'Medio', 'Alto']).toContain(domain.level);
        }
    });

    it('high answers produce high scores', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 5;
        const result = calculateBigFiveScores(answers);
        for (const domain of result) {
            expect(domain.score).toBeGreaterThan(2.5);
        }
    });
});
```

**Step 2: Rodar testes**

Run: `npx vitest run __tests__/bigfive.test.ts`
Expected: PASS (logica ja existe)

**Step 3: Escrever testes para IEAA**

```typescript
// __tests__/ieaa.test.ts
import { describe, it, expect } from 'vitest';
import { calculateIEAAScores } from '@/src/core/logic/ieaa';

describe('IEAA Scoring', () => {
    it('calculates scores for complete answers', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 3;
        const result = calculateIEAAScores(answers);
        expect(result).toBeDefined();
        expect(result.dimensions).toHaveLength(4);
        expect(result.profile).toBeDefined();
    });

    it('assigns correct profile based on scores', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 5;
        const result = calculateIEAAScores(answers);
        expect(result.totalPercentage).toBeGreaterThan(80);
        expect(result.overallLevel).toBe('AUTORREGULADO');
    });

    it('low answers produce VULNERAVEL profile', () => {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 50; i++) answers[i] = 1;
        const result = calculateIEAAScores(answers);
        expect(result.totalPercentage).toBeLessThan(30);
    });
});
```

**Step 4: Rodar**

Run: `npx vitest run __tests__/ieaa.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add __tests__/bigfive.test.ts __tests__/ieaa.test.ts
git commit -m "test: add Big Five and IEAA scoring tests"
```

---

### Task 16: Testes para validadores Zod

Os testes ja foram criados nas Tasks 3 e 4. Aqui verificar que todos passam:

Run: `npx vitest run __tests__/validators/`
Expected: ALL PASS

---

### Task 17: CI/CD com GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Criar pipeline basico**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

      - name: Unit Tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"
          NEXT_PUBLIC_SUPABASE_URL: "https://fake.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-key"
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline with lint, typecheck, test, build"
```

---

### Task 18: Acessibilidade basica - aria-labels nos componentes criticos

**Files:**
- Modify: `components/Sidebar.tsx` (adicionar aria-labels e roles)
- Modify: `components/Header.tsx` (adicionar landmarks)
- Modify: `components/NotificationBell.tsx` (adicionar aria-label)

**Step 1: Identificar e modificar Sidebar**

Adicionar `role="navigation"` e `aria-label="Menu principal"` ao container do sidebar.
Adicionar `aria-current="page"` ao item de navegacao ativo.

**Step 2: Modificar Header**

Adicionar `role="banner"` ao header.
Adicionar `aria-label` nos botoes interativos.

**Step 3: Modificar NotificationBell**

Adicionar `aria-label="Notificacoes"` e `aria-live="polite"` para o contador.

**Step 4: Commit**

```bash
git add components/Sidebar.tsx components/Header.tsx components/NotificationBell.tsx
git commit -m "a11y: add ARIA labels and semantic roles to core navigation components"
```

---

### Task 19: Acessibilidade nos formularios de assessment

**Files:**
- Modify: `components/questionnaire/QuestionCard.tsx` (aria-labels nos botoes de rating)

**Step 1: Adicionar labels acessiveis**

Em cada botao de rating, adicionar:
```typescript
aria-label={`Nota ${score} de 4`}
aria-pressed={selected === score}
role="radio"
```

No container do grupo de opcoes:
```typescript
role="radiogroup"
aria-label={questionText}
```

**Step 2: Commit**

```bash
git add components/questionnaire/QuestionCard.tsx
git commit -m "a11y: add ARIA labels and roles to assessment question cards"
```

---

## Fase 3: MEDIO - Performance e Dados

### Task 20: Code splitting com dynamic imports

**Files:**
- Modify: Paginas que usam componentes pesados

**Step 1: Lazy load dos wizards de assessment**

Em `app/(portal)/bigfive/page.tsx`:
```typescript
import dynamic from 'next/dynamic';

const BigFiveWizard = dynamic(() => import('@/components/bigfive/BigFiveWizard'), {
    loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
});
```

Repetir para:
- `app/(portal)/ieaa/page.tsx` -> lazy load `IEAAWizard`
- `app/(portal)/questionario/page.tsx` -> lazy load `QuestionnaireWizard`
- Qualquer pagina que importa `@react-pdf/renderer` -> lazy load

**Step 2: Verificar build**

Run: `npx next build`
Expected: BUILD SUCCESS com chunks menores

**Step 3: Commit**

```bash
git add app/(portal)/bigfive/page.tsx app/(portal)/ieaa/page.tsx app/(portal)/questionario/page.tsx
git commit -m "perf: add dynamic imports for heavy assessment wizard components"
```

---

### Task 21: Remover `as any` dos server actions

**Files:**
- Modify: `app/actions/assessment.ts`
- Modify: `app/actions/behavior.ts`

**Step 1: Substituir `as any` por tipos Prisma corretos**

O Prisma aceita `Json` para campos Json, entao basta usar `Prisma.JsonValue`:

```typescript
// Em assessment.ts, substituir:
rawAnswers: answers as any,
processedScores: processedScores as any,

// Por:
rawAnswers: answers as Prisma.InputJsonValue,
processedScores: processedScores as Prisma.InputJsonValue,
```

Importar no topo:
```typescript
import { Prisma } from '@prisma/client';
```

**Step 2: Fazer o mesmo em behavior.ts para o cast de NotificationType**

```typescript
// Substituir:
type: notificationType as any,

// Por:
type: notificationType as NotificationType,

// Com import:
import { NotificationType } from '@prisma/client';
```

**Step 3: Verificar build**

Run: `npx tsc --noEmit`
Expected: sem erros novos

**Step 4: Commit**

```bash
git add app/actions/assessment.ts app/actions/behavior.ts
git commit -m "fix: replace 'as any' casts with proper Prisma types"
```

---

### Task 22: Adicionar indices faltantes no banco

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Adicionar indices**

No model `BehaviorLog`, adicionar:
```prisma
@@index([tenantId, createdAt])
@@index([studentId, createdAt])
```

No model `SchoolIndicator`, adicionar:
```prisma
@@index([tenantId, academicYear])
@@index([studentId, academicYear])
```

No model `InterventionLog`, adicionar:
```prisma
@@index([tenantId, createdAt])
```

**Step 2: Gerar migration**

Run: `npx prisma migrate dev --name add_missing_indexes`
Expected: Migration criada com sucesso

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "perf: add missing database indexes for behavior, indicator, intervention queries"
```

---

### Task 23: Implementar caching inteligente

**Files:**
- Modify: `app/(portal)/layout.tsx` (remover force-dynamic)
- Create: `lib/cache.ts`

**Step 1: Criar helpers de cache**

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const getCachedTenant = unstable_cache(
    async (tenantId: string) => {
        return prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                subscriptionStatus: true,
                onboardingCompleted: true,
                name: true,
                organizationType: true,
            },
        });
    },
    ['tenant'],
    { revalidate: 300, tags: ['tenant'] } // 5 min cache
);
```

**Step 2: Remover force-dynamic do layout (com cuidado)**

Em `app/(portal)/layout.tsx`, remover:
```typescript
// REMOVER esta linha:
export const dynamic = 'force-dynamic';
```

E usar `getCachedTenant` em vez de query direta:
```typescript
import { getCachedTenant } from '@/lib/cache';

// Substituir:
const tenant = await prisma.tenant.findUnique({...});
// Por:
const tenant = await getCachedTenant(user.tenantId);
```

**Step 3: Commit**

```bash
git add lib/cache.ts app/(portal)/layout.tsx
git commit -m "perf: add caching layer for tenant data, remove force-dynamic from portal layout"
```

---

### Task 24: Audit logging para LGPD

**Files:**
- Create: `lib/audit.ts`
- Modify: `app/actions/lgpd-export.ts` (adicionar audit log)
- Modify: `app/actions/student-management.ts` (adicionar audit log em acoes sensíveis)

**Step 1: Criar helper de audit**

```typescript
// lib/audit.ts
import { prisma } from '@/lib/prisma';

export async function logAudit(params: {
    tenantId: string;
    userId: string;
    action: string;
    targetId?: string;
    details?: Record<string, unknown>;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                action: params.action,
                targetId: params.targetId,
                details: params.details as any,
            },
        });
    } catch (error) {
        // Nao deve falhar silenciosamente em producao, mas nao pode quebrar a operacao principal
        console.error('[AUDIT] Failed to log:', error);
    }
}
```

**Step 2: Aplicar em lgpd-export.ts**

Adicionar log quando aluno exporta seus dados:
```typescript
import { logAudit } from '@/lib/audit';

// Dentro da funcao de export:
await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'LGPD_DATA_EXPORT',
    targetId: user.studentId || undefined,
    details: { exportType: 'full' },
});
```

**Step 3: Aplicar em student-management.ts**

Logar quando um aluno eh criado, editado ou desativado:
```typescript
await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'STUDENT_CREATED',
    targetId: student.id,
});
```

**Step 4: Commit**

```bash
git add lib/audit.ts app/actions/lgpd-export.ts app/actions/student-management.ts
git commit -m "feat: add LGPD audit logging for data exports and student management"
```

---

## Fase 4: BAIXO - Melhorias Incrementais

### Task 25: Supabase Realtime para notificacoes

**Files:**
- Create: `lib/supabase/realtime.ts`
- Modify: `components/NotificationBell.tsx`

**Step 1: Criar hook de realtime**

```typescript
// lib/supabase/realtime.ts
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function useRealtimeNotifications(userId: string) {
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `userId=eq.${userId}`,
                },
                () => {
                    setNewCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return { newCount, resetCount: () => setNewCount(0) };
}
```

**Step 2: Integrar no NotificationBell**

Adicionar o hook ao componente existente para incrementar o contador em tempo real.

**Step 3: Commit**

```bash
git add lib/supabase/realtime.ts components/NotificationBell.tsx
git commit -m "feat: add real-time notification updates via Supabase Realtime"
```

---

### Task 26: Preparacao para i18n

**Files:**
- Create: `lib/i18n/pt-BR.ts`
- Create: `lib/i18n/index.ts`

**Step 1: Extrair strings mais comuns**

```typescript
// lib/i18n/pt-BR.ts
export const ptBR = {
    common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        unauthorized: 'Nao autorizado',
        notFound: 'Nao encontrado',
    },
    auth: {
        login: 'Entrar',
        logout: 'Sair',
        email: 'E-mail',
        password: 'Senha',
    },
    assessment: {
        via: 'Forcas de Carater (VIA)',
        srss: 'Triagem Socioemocional (SRSS-IE)',
        bigfive: 'Personalidade (Big Five)',
        ieaa: 'Estrategias de Aprendizagem (IEAA)',
    },
    errors: {
        invalidData: 'Dados invalidos',
        studentNotFound: 'Aluno nao encontrado',
        permissionDenied: 'Permissao negada',
        saveError: 'Erro ao salvar',
    },
} as const;
```

```typescript
// lib/i18n/index.ts
import { ptBR } from './pt-BR';

export type Locale = 'pt-BR';

const translations = {
    'pt-BR': ptBR,
} as const;

export function t(locale: Locale = 'pt-BR') {
    return translations[locale];
}
```

**Step 2: Commit**

```bash
git add lib/i18n/
git commit -m "feat: add i18n foundation with pt-BR translations"
```

---

### Task 27: DRY - Extrair padrao de save assessment

**Files:**
- Create: `lib/assessment-utils.ts`
- Modify: `app/actions/assessment.ts`

**Step 1: Criar utility**

```typescript
// lib/assessment-utils.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UpsertAssessmentParams {
    tenantId: string;
    studentId: string;
    type: string;
    screeningWindow?: string;
    academicYear?: number;
    screeningTeacherId?: string;
    rawAnswers: Prisma.InputJsonValue;
    processedScores: Prisma.InputJsonValue | null;
    overallTier?: string;
    externalizingScore?: number;
    internalizingScore?: number;
}

export async function upsertAssessment(params: UpsertAssessmentParams) {
    const {
        tenantId, studentId, type,
        screeningWindow = 'DIAGNOSTIC',
        academicYear = new Date().getFullYear(),
        ...data
    } = params;

    const existing = await prisma.assessment.findFirst({
        where: { tenantId, studentId, type, screeningWindow, academicYear },
    });

    if (existing) {
        return prisma.assessment.update({
            where: { id: existing.id },
            data: {
                rawAnswers: data.rawAnswers,
                processedScores: data.processedScores,
                appliedAt: new Date(),
                ...(data.overallTier && { overallTier: data.overallTier }),
                ...(data.externalizingScore !== undefined && { externalizingScore: data.externalizingScore }),
                ...(data.internalizingScore !== undefined && { internalizingScore: data.internalizingScore }),
                ...(data.screeningTeacherId && { screeningTeacherId: data.screeningTeacherId }),
            },
        });
    }

    return prisma.assessment.create({
        data: {
            tenantId,
            studentId,
            type: type as any,
            screeningWindow: screeningWindow as any,
            academicYear,
            rawAnswers: data.rawAnswers,
            processedScores: data.processedScores,
            appliedAt: new Date(),
            ...(data.overallTier && { overallTier: data.overallTier as any }),
            ...(data.externalizingScore !== undefined && { externalizingScore: data.externalizingScore }),
            ...(data.internalizingScore !== undefined && { internalizingScore: data.internalizingScore }),
            ...(data.screeningTeacherId && { screeningTeacherId: data.screeningTeacherId }),
        },
    });
}
```

**Step 2: Refatorar assessment.ts para usar upsertAssessment**

Substituir os 4 blocos de try/catch com findFirst+update/create por chamadas a `upsertAssessment()`.

**Step 3: Rodar testes existentes**

Run: `npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add lib/assessment-utils.ts app/actions/assessment.ts
git commit -m "refactor: extract DRY upsertAssessment utility, eliminate 4x code duplication"
```

---

## Resumo de Entregas por Fase

| Fase | Tasks | Foco |
|------|-------|------|
| 1 - CRITICO | 1-11 | Zod, Rate Limiting, Security Headers, Sentry |
| 2 - ALTO | 12-19 | Error Boundaries, Loading States, Testes, CI/CD, A11y |
| 3 - MEDIO | 20-24 | Code Splitting, Type Safety, Indices, Cache, Audit |
| 4 - BAIXO | 25-27 | Realtime, i18n prep, DRY refactor |

**Total: 27 tasks, ~4 fases de trabalho**

Cada task eh independente dentro da sua fase e pode ser commitada separadamente. As fases devem ser executadas na ordem (1 -> 2 -> 3 -> 4).
