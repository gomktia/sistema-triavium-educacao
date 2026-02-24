# Super Admin Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready Super Admin panel that enables Geison and Marcio to manage N schools, users, finances, support tickets, and analytics from a single hub.

**Architecture:** Server actions in `app/actions/super-admin.ts` (core hub) + `app/actions/tickets.ts` (support). New Prisma models for TenantPlan, Invoice, SupportTicket, TicketMessage, Webhook. Impersonation via existing `active_tenant_id` cookie. All pages under `/super-admin/` with `requireSuperAdmin()` guard.

**Tech Stack:** Next.js 15 (App Router), Prisma 6, PostgreSQL (Supabase), shadcn/ui, recharts, sonner, Supabase Auth admin API.

---

## FASE 1 — Operacao Core

### Task 1: Create super-admin server actions foundation

**Files:**
- Create: `app/actions/super-admin.ts`

**Step 1: Create the server actions file with all Fase 1 functions**

```typescript
// app/actions/super-admin.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { createClient } from '@supabase/supabase-js';

// ─── Impersonation ──────────────────────────────────────────

export async function impersonateTenant(tenantId: string) {
    const user = await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true },
    });

    if (!tenant) return { error: 'Escola nao encontrada.' };

    const cookieStore = await cookies();
    // Save original tenant so we can restore later
    cookieStore.set('original_tenant_id', user.tenantId, { path: '/', httpOnly: true, sameSite: 'lax' });
    cookieStore.set('active_tenant_id', tenantId, { path: '/', httpOnly: true, sameSite: 'lax' });
    cookieStore.set('impersonating', 'true', { path: '/', httpOnly: true, sameSite: 'lax' });

    await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'IMPERSONATE_TENANT',
        targetId: tenantId,
        details: { tenantName: tenant.name },
    });

    return { success: true, redirectTo: '/inicio' };
}

export async function exitImpersonation() {
    const user = await getCurrentUser();
    if (!user) return { error: 'Nao autenticado.' };

    const cookieStore = await cookies();
    const originalTenantId = cookieStore.get('original_tenant_id')?.value;

    cookieStore.delete('impersonating');
    cookieStore.delete('active_tenant_id');
    cookieStore.delete('original_tenant_id');

    if (originalTenantId) {
        cookieStore.set('active_tenant_id', originalTenantId, { path: '/', httpOnly: true, sameSite: 'lax' });
    }

    return { success: true, redirectTo: '/super-admin' };
}

export async function isImpersonating() {
    const cookieStore = await cookies();
    return cookieStore.get('impersonating')?.value === 'true';
}

// ─── Dashboard Metrics ──────────────────────────────────────

export async function getDashboardMetrics() {
    await requireSuperAdmin();

    const [tenants, totalStudents, totalAssessments, totalReports] = await Promise.all([
        prisma.tenant.findMany({
            select: {
                id: true, name: true, slug: true, isActive: true,
                subscriptionStatus: true, createdAt: true,
                _count: { select: { users: true, students: true, assessments: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.student.count(),
        prisma.assessment.count(),
        prisma.interventionLog.count({ where: { type: 'INDIVIDUAL_PLAN' } }),
    ]);

    const activeTenants = tenants.filter(t => t.subscriptionStatus === 'active').length;

    // Find inactive schools (no assessments in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.assessment.groupBy({
        by: ['tenantId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const activeTenantIds = new Set(recentActivity.map(a => a.tenantId));
    const inactiveSchools = tenants.filter(t => t.isActive && !activeTenantIds.has(t.id));

    return {
        totalTenants: tenants.length,
        activeTenants,
        totalStudents,
        totalAssessments,
        totalReports,
        inactiveSchools: inactiveSchools.map(s => ({ id: s.id, name: s.name, slug: s.slug })),
        tenants,
    };
}

// ─── Tenant Management ──────────────────────────────────────

export async function getTenantDetails(tenantId: string) {
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            _count: {
                select: {
                    users: true,
                    students: true,
                    assessments: true,
                    classrooms: true,
                    interventionLogs: { where: { type: 'INDIVIDUAL_PLAN' } },
                },
            },
        },
    });

    if (!tenant) return null;

    // Get user breakdown by role
    const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        where: { tenantId },
        _count: true,
    });

    // Get risk distribution
    const riskDistribution = await prisma.assessment.groupBy({
        by: ['overallTier'],
        where: { tenantId, overallTier: { not: null } },
        _count: true,
    });

    // Last activity
    const lastAssessment = await prisma.assessment.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
    });

    return {
        ...tenant,
        usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
        riskDistribution: riskDistribution.map(r => ({ tier: r.overallTier, count: r._count })),
        lastActivity: lastAssessment?.createdAt || null,
    };
}

export async function updateTenantDetails(tenantId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    organizationType?: string;
    subscriptionStatus?: string;
}) {
    const user = await requireSuperAdmin();

    if (data.state && data.state.length !== 2) {
        return { error: 'Estado deve ter 2 caracteres.' };
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                cnpj: data.cnpj || null,
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                organizationType: data.organizationType as any,
                subscriptionStatus: data.subscriptionStatus,
            },
        });

        await logAudit({
            tenantId: user.tenantId,
            userId: user.id,
            action: 'TENANT_UPDATED',
            targetId: tenantId,
            details: { fields: Object.keys(data) },
        });

        revalidatePath('/super-admin');
        revalidatePath(`/super-admin/escola/${tenantId}`);
        return { success: true };
    } catch (e: any) {
        return { error: 'Erro ao salvar.' };
    }
}

export async function toggleTenantActive(tenantId: string) {
    const user = await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { isActive: true, name: true } });
    if (!tenant) return { error: 'Escola nao encontrada.' };

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive: !tenant.isActive },
    });

    await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: tenant.isActive ? 'TENANT_DEACTIVATED' : 'TENANT_ACTIVATED',
        targetId: tenantId,
        details: { tenantName: tenant.name },
    });

    revalidatePath('/super-admin');
    revalidatePath('/super-admin/escolas');
    return { success: true, isActive: !tenant.isActive };
}

// ─── User Management ────────────────────────────────────────

export async function getUsers(filters?: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireSuperAdmin();

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;

    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.role) where.role = filters.role;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { tenant: { select: { name: true, slug: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateUserRole(userId: string, newRole: string) {
    const admin = await requireSuperAdmin();

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true, tenantId: true },
    });
    if (!targetUser) return { error: 'Usuario nao encontrado.' };

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any },
    });

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: 'USER_ROLE_CHANGED',
        targetId: userId,
        details: { oldRole: targetUser.role, newRole, userName: targetUser.name },
    });

    revalidatePath('/super-admin/usuarios');
    return { success: true };
}

export async function toggleUserActive(userId: string) {
    const admin = await requireSuperAdmin();

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true, name: true, tenantId: true },
    });
    if (!targetUser) return { error: 'Usuario nao encontrado.' };

    await prisma.user.update({
        where: { id: userId },
        data: { isActive: !targetUser.isActive },
    });

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: targetUser.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
        targetId: userId,
        details: { userName: targetUser.name },
    });

    revalidatePath('/super-admin/usuarios');
    return { success: true, isActive: !targetUser.isActive };
}

export async function resetUserPassword(userId: string) {
    const admin = await requireSuperAdmin();

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, supabaseUid: true, name: true },
    });
    if (!targetUser || !targetUser.supabaseUid) return { error: 'Usuario sem conta ativa.' };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return { error: 'Configuracao Supabase ausente.' };

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br';
    const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: targetUser.email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha` },
    });

    if (error) return { error: 'Erro ao gerar link: ' + error.message };

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: 'USER_PASSWORD_RESET',
        targetId: userId,
        details: { userName: targetUser.name },
    });

    return { success: true };
}

// ─── Audit Logs ─────────────────────────────────────────────

export async function getAuditLogs(filters?: {
    tenantId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireSuperAdmin();

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;

    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters?.startDate) where.timestamp.gte = new Date(filters.startDate);
        if (filters?.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                tenant: { select: { name: true } },
            },
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 3: Commit**

```bash
git add app/actions/super-admin.ts
git commit -m "feat: add super-admin server actions foundation (impersonation, users, tenants, logs)"
```

---

### Task 2: Impersonation Banner + Portal Layout integration

**Files:**
- Create: `components/admin/ImpersonationBanner.tsx`
- Modify: `app/(portal)/layout.tsx`
- Modify: `app/super-admin/layout.tsx`

**Step 1: Create the ImpersonationBanner component**

Client component with a top banner showing "Visualizando: [Escola]" and a "Voltar ao Painel" button. Uses `exitImpersonation()` action. Shows tenant name from props.

**Step 2: Modify portal layout to show banner**

In `app/(portal)/layout.tsx`, import `isImpersonating` from actions and `ImpersonationBanner`. If user is ADMIN and impersonating, render the banner above the main content. Pass the current tenant name.

**Step 3: Modify super-admin layout**

In `app/super-admin/layout.tsx`, on entering any super-admin page, if `impersonating` cookie exists, clear it (exit impersonation). This prevents being stuck in impersonation mode inside the admin panel.

**Step 4: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add components/admin/ImpersonationBanner.tsx app/\(portal\)/layout.tsx app/super-admin/layout.tsx
git commit -m "feat: add impersonation banner for admin viewing schools"
```

---

### Task 3: Escola detail page with tabs (hub)

**Files:**
- Create: `app/super-admin/escola/[id]/page.tsx`

**Step 1: Create the escola detail page**

Server component that:
1. Calls `requireSuperAdmin()`
2. Calls `getTenantDetails(id)` from super-admin actions
3. Renders tabs (using shadcn Tabs): Visao Geral, Usuarios, Configuracoes
4. Visao Geral tab: cards with metrics (alunos, triagens, laudos, turmas, users by role, risk distribution, last activity)
5. Usuarios tab: filtered user list for this tenant (uses getUsers with tenantId filter)
6. Configuracoes tab: form to edit tenant details (name, email, phone, cnpj, city, state, org type, subscription status) + toggle ativo/inativo
7. Button "Entrar como Gestor" that calls impersonateTenant and redirects

This is a client component wrapping server data. The page fetches data server-side and passes to client tab components.

**Step 2: Update escolas list page to link to detail**

Modify `app/super-admin/escolas/page.tsx`: change the row click / school name to link to `/super-admin/escola/[id]` instead of `/super-admin/school-access/[slug]`.

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/escola/
git commit -m "feat: add escola detail page with tabs (overview, users, settings)"
```

---

### Task 4: User management page

**Files:**
- Create: `app/super-admin/usuarios/page.tsx`
- Create: `components/admin/EditUserDialog.tsx`

**Step 1: Create the users page**

Server component that:
1. Calls `requireSuperAdmin()`
2. Calls `getUsers()` for initial data
3. Renders a client-side table component with:
   - Search input (name/email)
   - Filters: by escola (dropdown), by role (dropdown), by status (ativo/inativo)
   - Table columns: Nome, Email, Escola, Role, Status, Criado em, Acoes
   - Acoes: Edit role (dialog), Toggle active, Reset password
   - Pagination
4. "Convidar Usuario" button that opens invite dialog (reuses existing `/api/invite-member` with tenantId param)

**Step 2: Create EditUserDialog**

Client component dialog with:
- Select for role (ADMIN, MANAGER, PSYCHOLOGIST, COUNSELOR, TEACHER)
- Toggle for isActive
- Button to reset password
- Calls updateUserRole(), toggleUserActive(), resetUserPassword() from super-admin actions

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/usuarios/ components/admin/EditUserDialog.tsx
git commit -m "feat: add cross-tenant user management page"
```

---

### Task 5: Improve dashboard with real metrics

**Files:**
- Modify: `app/super-admin/page.tsx`

**Step 1: Refactor dashboard page**

Replace hardcoded values:
1. Remove hardcoded `revenueMonthly = activeTenants * 1990` — use "Assinaturas Ativas" count instead (MRR will come from Fase 2 financial module)
2. Replace Health Score 98.5% with "Escolas Ativas" (activeTenants / totalTenants * 100)
3. Add "Alertas" section: schools inactive >30 days, schools with expired subscriptions
4. Keep the existing schools table but link to `/super-admin/escola/[id]`
5. Use `getDashboardMetrics()` instead of inline queries

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/page.tsx
git commit -m "feat: improve super-admin dashboard with real metrics and alerts"
```

---

### Task 6: Update sidebar navigation

**Files:**
- Modify: `components/sidebar-nav.ts`

**Step 1: Update ADMIN navigation**

Replace current ADMIN nav with:
```typescript
ADMIN: [
    { label: 'Painel Global', href: '/super-admin', iconName: 'ShieldAlert' },
    { label: labels.organizations, href: '/super-admin/escolas', iconName: 'School' },
    { label: 'Usuarios', href: '/super-admin/usuarios', iconName: 'Users' },
    { label: 'Financeiro', href: '/super-admin/financeiro', iconName: 'CreditCard' },
    { label: 'Suporte', href: '/super-admin/suporte', iconName: 'LifeBuoy' },
    { label: 'Logs', href: '/super-admin/logs', iconName: 'ScrollText' },
    { label: 'Webhooks', href: '/super-admin/webhooks', iconName: 'Webhook' },
    { label: 'Feedback', href: '/super-admin/feedback', iconName: 'MessageSquareHeart' },
    { label: 'Configuracoes', href: '/super-admin/configuracoes', iconName: 'Settings' },
],
```

Also add "Suporte" to MANAGER nav:
```typescript
{ label: 'Suporte', href: '/suporte-escola', iconName: 'LifeBuoy' },
```

**Step 2: Update ROUTE_ACCESS in lib/auth.ts**

Add new routes to the access control map:
- `/super-admin/usuarios` → `['ADMIN']`
- `/super-admin/escola` → `['ADMIN']`
- `/super-admin/logs` → `['ADMIN']`
- `/super-admin/webhooks` → `['ADMIN']`
- `/super-admin/feedback` → `['ADMIN']`
- `/suporte-escola` → `['MANAGER']`

Note: `/super-admin` already covers sub-paths via startsWith matching, but explicit entries are clearer.

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add components/sidebar-nav.ts lib/auth.ts
git commit -m "feat: update sidebar with full super-admin navigation"
```

---

### Task 7: Audit logs page

**Files:**
- Create: `app/super-admin/logs/page.tsx`

**Step 1: Create audit logs page**

Server component that:
1. Calls `requireSuperAdmin()`
2. Calls `getAuditLogs()` for initial data
3. Renders a client-side table with filters:
   - Filter by escola (dropdown)
   - Filter by action type (dropdown)
   - Date range picker
   - Search by user
4. Table columns: Data/Hora, Usuario, Escola, Acao, Alvo, Detalhes
5. Pagination
6. Color-coded action badges (green for create, blue for update, red for delete/deactivate)

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/logs/
git commit -m "feat: add audit logs page for super-admin"
```

---

### Task 8: Feedback page (move existing)

**Files:**
- Create: `app/super-admin/feedback/page.tsx`

**Step 1: Create feedback page**

Server component that reuses the existing `getFeedbacks()` and `updateFeedbackStatus()` from `app/actions/feedback.ts`. Shows a table of all feedbacks from all schools with:
- Columns: Assunto, De (user + escola), Status, Data
- Click to expand description
- Status dropdown to update (PENDING, REVIEWING, PLANNED, IMPLEMENTED, REJECTED)
- Badge colors per status

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/feedback/
git commit -m "feat: add feedback management page for super-admin"
```

---

### Task 9: Fase 1 verification and build test

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 2: Build**

Run: `npx next build`
Expected: Build succeeds

**Step 3: Commit if any fixes needed**

---

## FASE 2 — Financeiro e Suporte

### Task 10: Prisma migration — TenantPlan, Invoice, SupportTicket, TicketMessage

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add new models to schema**

Add after the existing models:

```prisma
model TenantPlan {
  id           String   @id @default(cuid())
  tenantId     String
  planName     String   // ESSENTIAL, ADVANCE, SOVEREIGN, CUSTOM
  monthlyPrice Float
  studentLimit Int?
  startDate    DateTime
  endDate      DateTime?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoices Invoice[]

  @@index([tenantId])
  @@map("tenant_plans")
}

model Invoice {
  id          String        @id @default(cuid())
  tenantId    String
  planId      String?
  amount      Float
  dueDate     DateTime
  paidDate    DateTime?
  status      InvoiceStatus @default(PENDING)
  description String?
  createdAt   DateTime      @default(now())

  tenant Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan   TenantPlan? @relation(fields: [planId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@index([dueDate])
  @@map("invoices")
}

model SupportTicket {
  id        String         @id @default(cuid())
  tenantId  String
  userId    String
  subject   String
  priority  TicketPriority @default(MEDIUM)
  status    TicketStatus   @default(OPEN)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  closedAt  DateTime?

  tenant   Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user     User            @relation(fields: [userId], references: [id])
  messages TicketMessage[]

  @@index([tenantId])
  @@index([status])
  @@index([priority])
  @@map("support_tickets")
}

model TicketMessage {
  id        String   @id @default(cuid())
  ticketId  String
  userId    String
  content   String   @db.Text
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())

  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user   User          @relation(fields: [userId], references: [id])

  @@index([ticketId])
  @@map("ticket_messages")
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}
```

**Step 2: Add relations to Tenant model**

In the Tenant model, add:
```prisma
  plans              TenantPlan[]
  invoices           Invoice[]
  supportTickets     SupportTicket[]
```

**Step 3: Add relations to User model**

In the User model, add:
```prisma
  supportTickets     SupportTicket[]
  ticketMessages     TicketMessage[]
```

**Step 4: Run migration**

Run: `npx prisma migrate dev --name add-financial-support-models`
Expected: Migration created and applied

**Step 5: Generate client**

Run: `npx prisma generate`
Expected: Client generated

**Step 6: Commit**

```bash
git add prisma/
git commit -m "feat: add TenantPlan, Invoice, SupportTicket, TicketMessage models"
```

---

### Task 11: Financial server actions + page

**Files:**
- Modify: `app/actions/super-admin.ts` (add financial actions)
- Modify: `app/super-admin/financeiro/page.tsx` (replace placeholder)

**Step 1: Add financial actions to super-admin.ts**

```typescript
// ─── Financial ──────────────────────────────────────────────

export async function getFinancialDashboard() {
    await requireSuperAdmin();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activePlans, pendingInvoices, overdueInvoices, paidThisMonth] = await Promise.all([
        prisma.tenantPlan.findMany({
            where: { isActive: true },
            include: { tenant: { select: { name: true } } },
        }),
        prisma.invoice.count({ where: { status: 'PENDING' } }),
        prisma.invoice.count({ where: { status: 'OVERDUE' } }),
        prisma.invoice.aggregate({
            where: { status: 'PAID', paidDate: { gte: firstOfMonth } },
            _sum: { amount: true },
        }),
    ]);

    const mrr = activePlans.reduce((sum, p) => sum + p.monthlyPrice, 0);

    return {
        mrr,
        activePlansCount: activePlans.length,
        pendingInvoices,
        overdueInvoices,
        paidThisMonth: paidThisMonth._sum.amount || 0,
        plans: activePlans,
    };
}

export async function getInvoices(filters?: {
    tenantId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireSuperAdmin();

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: {
                tenant: { select: { name: true } },
                plan: { select: { planName: true } },
            },
            orderBy: { dueDate: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function createInvoice(data: {
    tenantId: string;
    amount: number;
    dueDate: string;
    description?: string;
    planId?: string;
}) {
    const admin = await requireSuperAdmin();

    const invoice = await prisma.invoice.create({
        data: {
            tenantId: data.tenantId,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
            description: data.description,
            planId: data.planId,
            status: 'PENDING',
        },
    });

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: 'INVOICE_CREATED',
        targetId: invoice.id,
        details: { tenantId: data.tenantId, amount: data.amount },
    });

    revalidatePath('/super-admin/financeiro');
    return { success: true, id: invoice.id };
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    const admin = await requireSuperAdmin();

    const data: any = { status };
    if (status === 'PAID') data.paidDate = new Date();

    await prisma.invoice.update({ where: { id: invoiceId }, data });

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: 'INVOICE_STATUS_CHANGED',
        targetId: invoiceId,
        details: { newStatus: status },
    });

    revalidatePath('/super-admin/financeiro');
    return { success: true };
}

export async function assignPlan(data: {
    tenantId: string;
    planName: string;
    monthlyPrice: number;
    studentLimit?: number;
    startDate: string;
}) {
    const admin = await requireSuperAdmin();

    // Deactivate any current active plan for this tenant
    await prisma.tenantPlan.updateMany({
        where: { tenantId: data.tenantId, isActive: true },
        data: { isActive: false, endDate: new Date() },
    });

    const plan = await prisma.tenantPlan.create({
        data: {
            tenantId: data.tenantId,
            planName: data.planName,
            monthlyPrice: data.monthlyPrice,
            studentLimit: data.studentLimit,
            startDate: new Date(data.startDate),
            isActive: true,
        },
    });

    await logAudit({
        tenantId: admin.tenantId,
        userId: admin.id,
        action: 'PLAN_ASSIGNED',
        targetId: data.tenantId,
        details: { planName: data.planName, monthlyPrice: data.monthlyPrice },
    });

    revalidatePath('/super-admin/financeiro');
    revalidatePath(`/super-admin/escola/${data.tenantId}`);
    return { success: true, planId: plan.id };
}
```

**Step 2: Rewrite financeiro page**

Replace the placeholder with a full page:
- Top cards: MRR, Receita do Mes, Faturas Pendentes, Faturas Vencidas
- Table of invoices with filters (escola, status)
- Buttons: "Nova Fatura", "Atribuir Plano"
- Dialogs for creating invoices and assigning plans

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/actions/super-admin.ts app/super-admin/financeiro/
git commit -m "feat: add financial management (plans, invoices, MRR dashboard)"
```

---

### Task 12: Support tickets server actions

**Files:**
- Create: `app/actions/tickets.ts`

**Step 1: Create ticket server actions**

```typescript
// app/actions/tickets.ts
'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendNotificationEmail } from '@/lib/mail';

export async function getTickets(filters?: {
    tenantId?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Nao autenticado');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const where: any = {};

    // If admin, can see all. If manager, only own tenant
    if (user.role === 'ADMIN') {
        if (filters?.tenantId) where.tenantId = filters.tenantId;
    } else if (user.role === 'MANAGER') {
        where.tenantId = user.tenantId;
    } else {
        throw new Error('Acesso negado');
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            include: {
                tenant: { select: { name: true } },
                user: { select: { name: true, email: true } },
                _count: { select: { messages: true } },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTicketById(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Nao autenticado');

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            tenant: { select: { name: true } },
            user: { select: { name: true, email: true } },
            messages: {
                include: { user: { select: { name: true, role: true } } },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!ticket) return null;

    // Access control: admin can see all, manager only own tenant
    if (user.role !== 'ADMIN' && ticket.tenantId !== user.tenantId) {
        throw new Error('Acesso negado');
    }

    return ticket;
}

export async function createTicket(data: { subject: string; message: string; priority?: string }) {
    const user = await getCurrentUser();
    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error('Apenas gestores podem abrir chamados.');
    }

    const ticket = await prisma.supportTicket.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            subject: data.subject,
            priority: (data.priority as any) || 'MEDIUM',
            status: 'OPEN',
            messages: {
                create: {
                    userId: user.id,
                    content: data.message,
                    isAdmin: user.role === 'ADMIN',
                },
            },
        },
    });

    // Notify admins via email
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { email: true },
        });

        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { name: true },
        });

        if (admins.length > 0) {
            await sendNotificationEmail({
                to: admins.map(a => a.email),
                subject: `Novo chamado: ${data.subject}`,
                title: 'Novo Chamado de Suporte',
                message: `${user.name} (${tenant?.name}) abriu um chamado: "${data.subject}"`,
                severity: data.priority === 'URGENT' ? 'critical' : 'warning',
                ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br'}/super-admin/suporte/${ticket.id}`,
                ctaText: 'Ver Chamado',
            });
        }
    } catch (err) {
        console.error('Failed to notify admins of new ticket:', err);
    }

    revalidatePath('/super-admin/suporte');
    revalidatePath('/suporte-escola');
    return { success: true, ticketId: ticket.id };
}

export async function replyToTicket(ticketId: string, content: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Nao autenticado');

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { tenantId: true, userId: true, subject: true },
    });

    if (!ticket) throw new Error('Chamado nao encontrado');
    if (user.role !== 'ADMIN' && ticket.tenantId !== user.tenantId) {
        throw new Error('Acesso negado');
    }

    await prisma.ticketMessage.create({
        data: {
            ticketId,
            userId: user.id,
            content,
            isAdmin: user.role === 'ADMIN',
        },
    });

    // Update ticket status based on who replied
    const newStatus = user.role === 'ADMIN' ? 'WAITING_USER' : 'IN_PROGRESS';
    await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: newStatus as any },
    });

    revalidatePath(`/super-admin/suporte/${ticketId}`);
    revalidatePath('/suporte-escola');
    return { success: true };
}

export async function updateTicketStatus(ticketId: string, status: string) {
    await requireSuperAdmin();

    const data: any = { status };
    if (status === 'CLOSED' || status === 'RESOLVED') {
        data.closedAt = new Date();
    }

    await prisma.supportTicket.update({ where: { id: ticketId }, data });

    revalidatePath(`/super-admin/suporte/${ticketId}`);
    revalidatePath('/super-admin/suporte');
    return { success: true };
}

export async function getTicketMetrics() {
    await requireSuperAdmin();

    const [open, inProgress, resolved, avgResponseTime] = await Promise.all([
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
        prisma.supportTicket.count(), // placeholder for avg response time
    ]);

    return { open, inProgress, resolved, total: avgResponseTime };
}
```

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/actions/tickets.ts
git commit -m "feat: add support ticket server actions"
```

---

### Task 13: Support pages (admin side + manager side)

**Files:**
- Modify: `app/super-admin/suporte/page.tsx` (replace placeholder)
- Create: `app/super-admin/suporte/[id]/page.tsx`
- Create: `app/(portal)/suporte-escola/page.tsx`

**Step 1: Rewrite suporte page (admin)**

Replace placeholder with:
- Top cards: Abertos, Em Andamento, Resolvidos, Total
- Table of tickets with filters (escola, status, prioridade)
- Click row → goes to `/super-admin/suporte/[id]`

**Step 2: Create ticket detail page**

`/super-admin/suporte/[id]`: Shows ticket header (subject, escola, priority, status) + chat-style message thread + reply textarea + status change buttons.

**Step 3: Create manager support page**

`/suporte-escola`: Page for MANAGER role to see their own tickets and create new ones. Shows list of own tickets + "Abrir Chamado" button with dialog.

**Step 4: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/suporte/ app/\(portal\)/suporte-escola/
git commit -m "feat: add support ticket pages (admin + manager)"
```

---

### Task 14: Fase 2 verification

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 2: Build**

Run: `npx next build`
Expected: Build succeeds

**Step 3: Commit if any fixes needed**

```bash
git commit -m "fix: resolve Fase 2 build issues"
```

---

## FASE 3 — Analytics e Integracoes

### Task 15: Prisma migration — Webhook model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Webhook model**

```prisma
model Webhook {
  id        String   @id @default(cuid())
  tenantId  String
  url       String
  events    String[]
  secret    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("webhooks")
}
```

Add to Tenant model: `webhooks Webhook[]`

**Step 2: Run migration**

Run: `npx prisma migrate dev --name add-webhook-model`
Expected: Migration applied

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add Webhook model to schema"
```

---

### Task 16: Webhook server actions + dispatch

**Files:**
- Create: `app/actions/webhook-management.ts`
- Modify: `lib/webhooks.ts` (implement real dispatch)

**Step 1: Create webhook management actions**

CRUD for webhooks: list, create (with generated HMAC secret), update, delete, test.

**Step 2: Implement real webhook dispatch in lib/webhooks.ts**

Replace the no-op with:
1. Look up active webhooks for the tenant that match the event
2. For each, POST the payload with HMAC-SHA256 signature header
3. Log success/failure (no PII in logs)
4. Use non-blocking (fire and forget) to avoid slowing down main operations

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/actions/webhook-management.ts lib/webhooks.ts
git commit -m "feat: add webhook management and real dispatch"
```

---

### Task 17: Webhook page

**Files:**
- Create: `app/super-admin/webhooks/page.tsx`

**Step 1: Create webhooks page**

- Table of webhooks grouped by tenant
- Columns: Escola, URL, Eventos, Status (ativo/inativo), Criado em, Acoes
- "Criar Webhook" dialog: select tenant, URL, checkboxes for events
- Actions: toggle active, test (sends test event), delete

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/webhooks/
git commit -m "feat: add webhook management page"
```

---

### Task 18: Analytics for escola detail

**Files:**
- Modify: `app/actions/super-admin.ts` (add analytics actions)
- Enhance: `app/super-admin/escola/[id]/page.tsx` (add analytics to Visao Geral tab)

**Step 1: Add getTenantAnalytics action**

Query for:
- Assessment counts by type and screening window
- Risk tier distribution with evolution (last 3 windows)
- Engagement: users who logged in last 30 days / total users
- Monthly usage history (last 6 months): assessments, new students, interventions

**Step 2: Enhance Visao Geral tab**

Add recharts visualizations:
- Bar chart: assessments by type
- Pie chart: risk distribution
- Line chart: monthly usage evolution

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/actions/super-admin.ts app/super-admin/escola/
git commit -m "feat: add analytics dashboard to escola detail page"
```

---

### Task 19: Settings page

**Files:**
- Modify: `app/super-admin/configuracoes/page.tsx` (replace placeholder)

**Step 1: Rewrite settings page**

Sections:
1. **Planos Padrao**: Table showing plan templates (ESSENTIAL, ADVANCE, SOVEREIGN) with default prices and student limits. Read-only for now (editable in future).
2. **Informacoes do Sistema**: App version, last deployment, database stats (total records).
3. **Links Uteis**: Link to Vercel dashboard, Supabase dashboard, Resend dashboard.

This is informational for v1, not a full config editor.

**Step 2: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add app/super-admin/configuracoes/
git commit -m "feat: add system settings page with plan definitions and system info"
```

---

### Task 20: Final verification and cleanup

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 2: Full build**

Run: `npx next build`
Expected: Build succeeds

**Step 3: Grep verification**

- `grep -r "Em Desenvolvimento" app/super-admin/` → should return zero results (all placeholders replaced)
- `grep -r "requireSuperAdmin" app/super-admin/` → should return results for every page (security check)

**Step 4: Delete old school-access page**

Remove `app/super-admin/school-access/` directory (replaced by `/super-admin/escola/[id]`)

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Super Admin panel - all 3 phases implemented"
```

---

## Summary

| Fase | Tasks | New Files | Modified Files | Migrations |
|------|-------|-----------|----------------|------------|
| 1 | 1-9 | ~10 | ~5 | 0 |
| 2 | 10-14 | ~8 | ~3 | 1 |
| 3 | 15-20 | ~5 | ~4 | 1 |
| **Total** | **20** | **~23** | **~12** | **2** |
