# Portal do Responsável Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a parent/guardian portal where families can view their children's character strengths, positive evolution narratives, and home activity suggestions — without any risk data.

**Architecture:** Extend the existing `(portal)` route group with a new `RESPONSIBLE` role. Add `StudentGuardian` junction table (many-to-many) and `GuardianInvite` table for the invitation flow. Reuse existing `generateEvolutionNarrative()` and `getHomeSuggestions()` helpers from the family report feature. Guardian routes live under `/responsavel`.

**Tech Stack:** Next.js 15, Prisma 6, Supabase Auth, Resend (email), shadcn/ui, Tailwind CSS, Vitest

---

### Task 1: Schema — Add RESPONSIBLE role and new tables

**Files:**
- Modify: `prisma/schema.prisma:493-500` (Role enum)
- Modify: `prisma/schema.prisma:261-300` (Student model — add guardians relation)
- Modify: `prisma/schema.prisma:380-409` (User model — add guardianStudents relation)
- Modify: `prisma/schema.prisma:342-378` (Tenant model — add relations)
- Modify: `src/core/types/index.ts:30-37` (UserRole enum)

**Step 1: Add RESPONSIBLE to the Prisma Role enum**

In `prisma/schema.prisma`, find the `Role` enum (line 493) and add RESPONSIBLE:

```prisma
enum Role {
  ADMIN
  MANAGER
  PSYCHOLOGIST
  COUNSELOR
  TEACHER
  STUDENT
  RESPONSIBLE
}
```

**Step 2: Add GuardianRelationship and InviteStatus enums**

After the existing enums (after line 506), add:

```prisma
enum GuardianRelationship {
  MAE
  PAI
  AVO_A
  TIO_A
  OUTRO
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
}
```

**Step 3: Add StudentGuardian model**

After the `StudentMessage` model (after line 317), add:

```prisma
model StudentGuardian {
  id           String                @id @default(cuid())
  tenantId     String
  studentId    String
  guardianId   String
  relationship GuardianRelationship
  createdAt    DateTime              @default(now())

  tenant   Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  student  Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  guardian User    @relation(fields: [guardianId], references: [id], onDelete: Cascade)

  @@unique([studentId, guardianId])
  @@index([guardianId])
  @@index([tenantId])
  @@map("student_guardians")
}
```

**Step 4: Add GuardianInvite model**

After `StudentGuardian`:

```prisma
model GuardianInvite {
  id        String       @id @default(cuid())
  tenantId  String
  studentId String
  email     String
  token     String       @unique
  status    InviteStatus @default(PENDING)
  invitedBy String
  createdAt DateTime     @default(now())
  expiresAt DateTime

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id])
  inviter User    @relation("GuardianInviter", fields: [invitedBy], references: [id])

  @@index([token])
  @@index([tenantId])
  @@map("guardian_invites")
}
```

**Step 5: Add reverse relations**

On the `Student` model (line 261), add after `studentMessages` (line 292):
```prisma
  guardians        StudentGuardian[]
  guardianInvites  GuardianInvite[]
```

On the `User` model (line 380), add after `tenant` relation (line 401):
```prisma
  guardianStudents  StudentGuardian[]
  guardianInvites   GuardianInvite[] @relation("GuardianInviter")
```

On the `Tenant` model (line 342), add after `studentMessages` (line 375):
```prisma
  studentGuardians  StudentGuardian[]
  guardianInvites   GuardianInvite[]
```

**Step 6: Update UserRole TypeScript enum**

In `src/core/types/index.ts`, add to the `UserRole` enum (line 30):

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  COUNSELOR = 'COUNSELOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  RESPONSIBLE = 'RESPONSIBLE',
}
```

**Step 7: Generate Prisma client and create migration**

Run: `npx prisma generate`
Expected: Prisma Client generated successfully

Run: `npx prisma migrate dev --name add_guardian_portal`
Expected: Migration created and applied

**Step 8: Commit**

```bash
git add prisma/schema.prisma src/core/types/index.ts
git commit -m "feat: add RESPONSIBLE role, StudentGuardian and GuardianInvite tables"
```

---

### Task 2: RBAC — Permissions, routing, navigation for RESPONSIBLE

**Files:**
- Modify: `src/core/rbac/permissions.ts:46-118` (ROLE_PERMISSIONS)
- Modify: `lib/auth.ts:116-153` (ROLE_HOME, ROUTE_ACCESS)
- Modify: `components/sidebar-nav.ts:15-94` (NAV_BY_ROLE)
- Modify: `middleware.ts:6` (PUBLIC_PATHS)

**Step 1: Add RESPONSIBLE permissions**

In `src/core/rbac/permissions.ts`, add after the STUDENT entry (line 117):

```typescript
  [UserRole.RESPONSIBLE]: [
    // Responsáveis veem APENAS as forças dos filhos vinculados
    Permission.ASSESSMENT_VIEW_OWN_STRENGTHS,
    // NÃO vê: riscos, intervenções, dados clínicos, outros alunos
  ],
```

**Step 2: Add RESPONSIBLE to filterProfileByRole**

In `src/core/rbac/permissions.ts`, in the `filterProfileByRole` function (line 135), add a RESPONSIBLE case after the STUDENT case (line 148):

```typescript
  if (viewerRole === UserRole.RESPONSIBLE) {
    // Responsável: mesma visão do aluno — APENAS forças
    return {
      allStrengths: safe.allStrengths,
      signatureStrengths: safe.signatureStrengths,
    };
  }
```

**Step 3: Add RESPONSIBLE home route**

In `lib/auth.ts`, add to ROLE_HOME (line 116):

```typescript
const ROLE_HOME: Record<string, string> = {
    STUDENT: '/minhas-forcas',
    TEACHER: '/inicio',
    PSYCHOLOGIST: '/inicio',
    COUNSELOR: '/inicio',
    MANAGER: '/inicio',
    ADMIN: '/super-admin',
    RESPONSIBLE: '/responsavel',
};
```

**Step 4: Add RESPONSIBLE route access**

In `lib/auth.ts`, add to ROUTE_ACCESS (line 132):

```typescript
    '/responsavel': ['RESPONSIBLE'],
```

**Step 5: Add RESPONSIBLE navigation**

In `components/sidebar-nav.ts`, add to NAV_BY_ROLE (after ADMIN, line 91):

```typescript
        RESPONSIBLE: [
            { label: 'Início', href: '/responsavel', iconName: 'Home' },
            { label: 'Perfil', href: '/responsavel/perfil', iconName: 'User' },
        ],
```

**Step 6: Add `/convite-responsavel` to PUBLIC_PATHS in middleware**

In `middleware.ts` line 6, the `/convite` path is already public. We'll reuse it with a query param approach, so no middleware change needed.

**Step 7: Fix middleware login redirect for RESPONSIBLE**

In `middleware.ts` line 118-120, the redirect for authenticated users on `/login` goes to `/inicio`. This is handled by `getHomeForRole` in the portal layout instead, so no change needed — the portal layout uses `canAccessRoute` which already gates access.

**Step 8: Commit**

```bash
git add src/core/rbac/permissions.ts lib/auth.ts components/sidebar-nav.ts
git commit -m "feat: add RESPONSIBLE role to RBAC, routing, and navigation"
```

---

### Task 3: Server actions — Guardian invite and registration

**Files:**
- Create: `app/actions/guardian-invite.ts`
- Test: `__tests__/guardian-invite.test.ts`

**Step 1: Write the tests**

Create `__tests__/guardian-invite.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateGuardianInviteInput } from '@/app/actions/guardian-invite';

describe('validateGuardianInviteInput', () => {
  it('rejects empty email', () => {
    const result = validateGuardianInviteInput({ email: '', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = validateGuardianInviteInput({ email: 'not-email', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('rejects missing studentId', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'MAE', studentId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid relationship', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'INVALID' as any, studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('accepts valid input', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('parent@test.com');
  });

  it('trims and lowercases email', () => {
    const result = validateGuardianInviteInput({ email: ' Parent@Test.COM ', relationship: 'PAI', studentId: 'stu1' });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('parent@test.com');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/guardian-invite.test.ts`
Expected: FAIL — `validateGuardianInviteInput` not found

**Step 3: Create the server action file**

Create `app/actions/guardian-invite.ts`:

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/src/core/types';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { getTenantUrl } from '@/lib/tenant-resolver';

// ============================================================
// Validation
// ============================================================

const VALID_RELATIONSHIPS = ['MAE', 'PAI', 'AVO_A', 'TIO_A', 'OUTRO'] as const;

interface InviteInput {
  email: string;
  relationship: string;
  studentId: string;
}

interface ValidationResult {
  success: boolean;
  data?: { email: string; relationship: string; studentId: string };
  error?: string;
}

export function validateGuardianInviteInput(input: InviteInput): ValidationResult {
  const email = input.email?.trim().toLowerCase();
  const { relationship, studentId } = input;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'E-mail inválido.' };
  }

  if (!studentId) {
    return { success: false, error: 'Aluno não informado.' };
  }

  if (!VALID_RELATIONSHIPS.includes(relationship as any)) {
    return { success: false, error: 'Tipo de parentesco inválido.' };
  }

  return { success: true, data: { email, relationship, studentId } };
}

// ============================================================
// Send Guardian Invite
// ============================================================

const INVITE_EXPIRY_DAYS = 7;

export async function sendGuardianInvite(input: InviteInput) {
  const user = await getCurrentUser();
  const allowedRoles = [UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN];

  if (!user || !allowedRoles.includes(user.role)) {
    return { success: false, error: 'Sem permissão.' };
  }

  const validation = validateGuardianInviteInput(input);
  if (!validation.success || !validation.data) {
    return { success: false, error: validation.error };
  }

  const { email, relationship, studentId } = validation.data;

  // Verify student belongs to user's tenant
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId: user.tenantId },
    select: { id: true, name: true },
  });

  if (!student) {
    return { success: false, error: 'Aluno não encontrado.' };
  }

  // Check if guardian already linked
  const existingGuardian = await prisma.user.findFirst({
    where: {
      tenantId: user.tenantId,
      email,
      role: 'RESPONSIBLE',
    },
  });

  if (existingGuardian) {
    const alreadyLinked = await prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId: existingGuardian.id } },
    });

    if (alreadyLinked) {
      return { success: false, error: 'Este responsável já está vinculado a este aluno.' };
    }

    // Link existing guardian to new child
    await prisma.studentGuardian.create({
      data: {
        tenantId: user.tenantId,
        studentId,
        guardianId: existingGuardian.id,
        relationship: relationship as any,
      },
    });

    return { success: true, alreadyHadAccount: true };
  }

  // Create or update invite
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  // Expire any existing pending invites for this email+student
  await prisma.guardianInvite.updateMany({
    where: { tenantId: user.tenantId, studentId, email, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  });

  await prisma.guardianInvite.create({
    data: {
      tenantId: user.tenantId,
      studentId,
      email,
      token,
      invitedBy: user.id,
      expiresAt,
    },
  });

  // Send email
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true, slug: true, customDomain: true },
  });

  const baseUrl = tenant
    ? getTenantUrl({ slug: tenant.slug, customDomain: tenant.customDomain })
    : process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br';
  const inviteLink = `${baseUrl}/convite-responsavel?token=${token}`;

  let emailSent = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Triavium <noreply@triavium.com.br>',
        to: email,
        subject: `Acompanhe o desenvolvimento de ${student.name} - ${tenant?.name || 'Triavium'}`,
        html: getGuardianInviteEmailHtml(student.name, inviteLink, tenant?.name || 'Triavium'),
      });
      emailSent = true;
    } catch (err) {
      console.error('Failed to send guardian invite email:', err);
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      action: 'GUARDIAN_INVITE_SENT',
      targetId: studentId,
      details: { email, relationship, emailSent },
    },
  });

  return { success: true, inviteLink, emailSent };
}

// ============================================================
// Accept Guardian Invite
// ============================================================

export async function validateGuardianToken(token: string) {
  if (!token) return { valid: false, error: 'Token não informado.' };

  const invite = await prisma.guardianInvite.findUnique({
    where: { token },
    include: {
      student: { select: { id: true, name: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!invite) return { valid: false, error: 'Convite não encontrado.' };
  if (invite.status !== 'PENDING') return { valid: false, error: 'Convite já utilizado ou expirado.' };
  if (new Date() > invite.expiresAt) {
    await prisma.guardianInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
    return { valid: false, error: 'Convite expirado.' };
  }

  return {
    valid: true,
    data: {
      inviteId: invite.id,
      email: invite.email,
      studentName: invite.student.name,
      studentId: invite.student.id,
      tenantId: invite.tenant.id,
      tenantName: invite.tenant.name,
    },
  };
}

export async function registerGuardian(formData: FormData) {
  const token = formData.get('token') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!token || !name || !email || !password) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
  }

  const validation = await validateGuardianToken(token);
  if (!validation.valid || !validation.data) {
    return { success: false, error: validation.error };
  }

  const { inviteId, studentId, tenantId } = validation.data;

  // Look up the invite to get relationship from the original invite
  const invite = await prisma.guardianInvite.findUnique({
    where: { id: inviteId },
  });

  // Create Supabase auth user
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    if (authError?.message?.includes('already been registered')) {
      return { success: false, error: 'Este e-mail já possui uma conta. Faça login.' };
    }
    return { success: false, error: authError?.message || 'Erro ao criar conta.' };
  }

  // Create User record
  const newUser = await prisma.user.create({
    data: {
      tenantId,
      email: email.toLowerCase(),
      name,
      role: 'RESPONSIBLE',
      supabaseUid: authData.user.id,
      isActive: true,
    },
  });

  // Create StudentGuardian link
  // We need the relationship — store it when creating invite, or default to OUTRO
  await prisma.studentGuardian.create({
    data: {
      tenantId,
      studentId,
      guardianId: newUser.id,
      relationship: 'OUTRO', // Will be refined in Task 5 when we store relationship in invite
    },
  });

  // Mark invite as accepted
  await prisma.guardianInvite.update({
    where: { id: inviteId },
    data: { status: 'ACCEPTED' },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: newUser.id,
      action: 'GUARDIAN_ACCOUNT_CREATED',
      targetId: studentId,
      details: { email: email.toLowerCase(), name },
    },
  });

  return { success: true };
}

// ============================================================
// Email template
// ============================================================

function getGuardianInviteEmailHtml(studentName: string, inviteLink: string, tenantName: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:16px 16px 0 0;">
        <tr><td style="padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">${tenantName}</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Portal da Família</p>
        </td></tr>
      </table>
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="padding:48px 40px;">
          <h2 style="color:#1e293b;margin:0 0 8px;font-size:24px;font-weight:700;">Olá!</h2>
          <p style="color:#64748b;margin:0 0 32px;font-size:16px;line-height:1.6;">
            Você foi convidado(a) para acompanhar o desenvolvimento de <strong style="color:#059669;">${studentName}</strong> pela plataforma <strong>${tenantName}</strong>.
          </p>
          <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin-bottom:32px;border-left:4px solid #059669;">
            <p style="color:#475569;margin:0;font-size:15px;line-height:1.6;">
              No Portal da Família, você poderá ver as forças de caráter do(a) seu(sua) filho(a), sugestões de atividades para fazer em casa e acompanhar a evolução ao longo do ano.
            </p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#fff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(5,150,105,0.4);">
                Criar Minha Conta
              </a>
            </td></tr>
          </table>
          <p style="color:#94a3b8;margin:32px 0 0;font-size:13px;text-align:center;">
            Este convite é válido por 7 dias.<br>
            Se o botão não funcionar, copie e cole este link no navegador:<br>
            <a href="${inviteLink}" style="color:#059669;word-break:break-all;">${inviteLink}</a>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#f8fafc;border-radius:0 0 16px 16px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
            &copy; ${new Date().getFullYear()} Triavium Educação e Desenvolvimento LTDA
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/guardian-invite.test.ts`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add app/actions/guardian-invite.ts __tests__/guardian-invite.test.ts
git commit -m "feat: add guardian invite server actions with validation and email"
```

---

### Task 4: Invite UI — "Convidar Responsável" button on student profile

**Files:**
- Create: `components/guardian/InviteGuardianDialog.tsx`
- Modify: `app/(portal)/alunos/[id]/page.tsx:1-16` (imports) and `:160-182` (render)

**Step 1: Create InviteGuardianDialog component**

Create `components/guardian/InviteGuardianDialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { sendGuardianInvite } from '@/app/actions/guardian-invite';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Copy, Check } from 'lucide-react';

const RELATIONSHIP_OPTIONS = [
  { value: 'MAE', label: 'Mãe' },
  { value: 'PAI', label: 'Pai' },
  { value: 'AVO_A', label: 'Avô/Avó' },
  { value: 'TIO_A', label: 'Tio/Tia' },
  { value: 'OUTRO', label: 'Outro' },
];

interface InviteGuardianDialogProps {
  studentId: string;
  studentName: string;
  guardianEmail?: string;
}

export function InviteGuardianDialog({ studentId, studentName, guardianEmail }: InviteGuardianDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(guardianEmail || '');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInviteLink(null);

    const result = await sendGuardianInvite({ email, relationship, studentId });

    setLoading(false);

    if (result.success) {
      if (result.alreadyHadAccount) {
        toast({ title: 'Responsável vinculado!', description: 'O responsável já tinha conta e foi vinculado ao aluno.' });
        setOpen(false);
      } else {
        toast({ title: 'Convite enviado!', description: result.emailSent ? 'E-mail de convite enviado.' : 'Link de convite gerado.' });
        if (result.inviteLink) {
          setInviteLink(result.inviteLink);
        } else {
          setOpen(false);
        }
      }
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  }

  function handleCopyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setOpen(false);
    setInviteLink(null);
    setEmail(guardianEmail || '');
    setRelationship('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
          <UserPlus size={16} className="mr-2" />
          Convidar Responsável
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Responsável</DialogTitle>
          <DialogDescription>
            Envie um convite para o responsável de <strong>{studentName}</strong> acessar o Portal da Família.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Convite criado! Compartilhe o link abaixo:</p>
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardian-email">E-mail do Responsável</Label>
              <Input
                id="guardian-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="responsavel@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Select value={relationship} onValueChange={setRelationship} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading || !relationship} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Add InviteGuardianDialog to student profile page**

In `app/(portal)/alunos/[id]/page.tsx`:

Add import (after line 16):
```typescript
import { InviteGuardianDialog } from '@/components/guardian/InviteGuardianDialog';
```

Update the student query to include `guardianEmail` (in the `select` at line 31, add):
```typescript
            guardianEmail: true,
```

After line 158 (after `familyReportProps`), add:
```typescript
    const canInviteGuardian = [UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN].includes(user.role);
```

In the header section (around line 179-181), add the invite button next to the family report button:
```tsx
                <div className="flex items-center gap-2">
                    {canInviteGuardian && (
                        <InviteGuardianDialog
                            studentId={student.id}
                            studentName={student.name}
                            guardianEmail={student.guardianEmail || undefined}
                        />
                    )}
                    {familyReportProps && (
                        <FamilyReportDialog {...familyReportProps} />
                    )}
                </div>
```

**Step 3: Commit**

```bash
git add components/guardian/InviteGuardianDialog.tsx app/(portal)/alunos/[id]/page.tsx
git commit -m "feat: add invite guardian dialog to student profile page"
```

---

### Task 5: Guardian registration page — `/convite-responsavel`

**Files:**
- Create: `app/convite-responsavel/page.tsx`
- Modify: `middleware.ts:6` (add to PUBLIC_PATHS)

**Step 1: Add route to PUBLIC_PATHS**

In `middleware.ts` line 6, add `/convite-responsavel`:

```typescript
const PUBLIC_PATHS = ['/login', '/marketing', '/metodologia', '/subscription-expired', '/demo-setup', '/registrar', '/convite', '/convite-responsavel'];
```

**Step 2: Create the registration page**

Create `app/convite-responsavel/page.tsx`:

```tsx
import { validateGuardianToken, registerGuardian } from '@/app/actions/guardian-invite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function GuardianInvitePage(props: Props) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return <InvalidInvite message="Link inválido. Nenhum token encontrado." />;
  }

  const validation = await validateGuardianToken(token);

  if (!validation.valid || !validation.data) {
    return <InvalidInvite message={validation.error || 'Convite inválido ou expirado.'} />;
  }

  const { studentName, tenantName, email } = validation.data;

  async function handleRegister(formData: FormData) {
    'use server';
    const result = await registerGuardian(formData);
    if (result.success) {
      redirect('/login?success=guardian_created');
    } else {
      redirect(`/convite-responsavel?token=${token}&error=${encodeURIComponent(result.error || 'Erro')}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{tenantName}</h1>
        <p className="text-slate-500 font-medium">Portal da Família</p>
      </div>

      <Card className="w-full max-w-md bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
        <CardHeader>
          <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <Heart size={24} />
          </div>
          <CardTitle className="text-2xl text-center">Bem-vindo(a)!</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para acompanhar o desenvolvimento de <strong>{studentName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleRegister} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome Completo</Label>
              <Input id="name" name="name" placeholder="Seu nome" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={email} placeholder="seu@email.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Crie uma Senha</Label>
              <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a Senha</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repita a senha" required />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl mt-4">
              Criar Minha Conta
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Triavium Educação e Desenvolvimento LTDA
      </p>
    </div>
  );
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            ✕
          </div>
          <CardTitle className="text-xl text-red-700">Convite Inválido</CardTitle>
          <CardDescription>{message} Entre em contato com a escola.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/convite-responsavel/page.tsx middleware.ts
git commit -m "feat: add guardian registration page with invite token validation"
```

---

### Task 6: Guardian dashboard — `/responsavel`

**Files:**
- Create: `app/(portal)/responsavel/page.tsx`
- Create: `components/guardian/ChildSelector.tsx`
- Create: `components/guardian/StrengthsCard.tsx`
- Create: `components/guardian/EvolutionCard.tsx`
- Create: `components/guardian/SuggestionsCard.tsx`

**Step 1: Create ChildSelector component**

Create `components/guardian/ChildSelector.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ChildSelector({ children, selectedId, onSelect }: ChildSelectorProps) {
  if (children.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 mb-6">
      <Users size={16} className="text-slate-400" />
      <span className="text-sm text-slate-500 font-medium mr-2">Filho(a):</span>
      <div className="flex gap-2">
        {children.map((child) => (
          <Button
            key={child.id}
            variant={child.id === selectedId ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(child.id)}
            className={child.id === selectedId ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {child.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create StrengthsCard component**

Create `components/guardian/StrengthsCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Strength {
  label: string;
  virtue: string;
  description: string;
}

interface StrengthsCardProps {
  strengths: Strength[];
}

export function StrengthsCard({ strengths }: StrengthsCardProps) {
  if (strengths.length === 0) return null;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star size={20} className="text-amber-500" />
          Forças de Caráter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {strengths.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{s.label}</p>
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wider mb-1">{s.virtue}</p>
              <p className="text-sm text-slate-600">{s.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create EvolutionCard component**

Create `components/guardian/EvolutionCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface EvolutionCardProps {
  narrative: string;
}

export function EvolutionCard({ narrative }: EvolutionCardProps) {
  if (!narrative) return null;

  return (
    <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-600" />
          Evolução
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-700 leading-relaxed">{narrative}</p>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create SuggestionsCard component**

Create `components/guardian/SuggestionsCard.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface Suggestion {
  strengthLabel: string;
  activities: string[];
}

interface SuggestionsCardProps {
  suggestions: Suggestion[];
}

export function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-500" />
          Sugestões para Casa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.map((s, i) => (
          <div key={i}>
            <p className="font-semibold text-slate-800 mb-2">{s.strengthLabel}</p>
            <ul className="space-y-2">
              {s.activities.map((activity, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 5: Create the dashboard page**

Create `app/(portal)/responsavel/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GradeLevel as CoreGradeLevel } from '@/src/core/types';
import { calculateStudentProfile } from '@/src/core/logic/scoring';
import { generateEvolutionNarrative, getHomeSuggestions } from '@/lib/report/family-report-helpers';
import { STRENGTH_DESCRIPTIONS } from '@/src/core/content/strength-descriptions';
import { StrengthsCard } from '@/components/guardian/StrengthsCard';
import { EvolutionCard } from '@/components/guardian/EvolutionCard';
import { SuggestionsCard } from '@/components/guardian/SuggestionsCard';
import { Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ResponsavelDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.RESPONSIBLE) {
    redirect('/');
  }

  // Get all children linked to this guardian
  const guardianLinks = await prisma.studentGuardian.findMany({
    where: { guardianId: user.id, tenantId: user.tenantId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: true,
          tenant: { select: { name: true, phone: true, email: true } },
        },
      },
    },
  });

  if (guardianLinks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Heart size={24} className="text-emerald-500" />
          Portal da Família
        </h1>
        <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">Nenhum aluno vinculado à sua conta.</p>
          <p className="text-slate-400 text-sm mt-2">Entre em contato com a escola.</p>
        </div>
      </div>
    );
  }

  // For MVP, show first child's data (multi-child selector in future iteration)
  const firstLink = guardianLinks[0];
  const student = firstLink.student;

  const gradeDisplay =
    student.grade === 'ANO_1_EM' ? '1ª Série EM' :
    student.grade === 'ANO_2_EM' ? '2ª Série EM' : '3ª Série EM';

  // Fetch assessments for this child
  const allAssessments = await prisma.assessment.findMany({
    where: { tenantId: user.tenantId, studentId: student.id },
    select: { type: true, rawAnswers: true, processedScores: true, screeningWindow: true, appliedAt: true },
    orderBy: { appliedAt: 'asc' },
  });

  type Row = (typeof allAssessments)[number];
  const viaAnswers = allAssessments.find((a: Row) => a.type === 'VIA_STRENGTHS')?.rawAnswers;
  const srssAnswers = allAssessments.find((a: Row) => a.type === 'SRSS_IE')?.rawAnswers;
  const bigFiveScores = allAssessments.find((a: Row) => a.type === 'BIG_FIVE')?.processedScores as any;

  const isViaComplete = viaAnswers && Object.keys(viaAnswers as object).length >= 71;

  let strengths: { label: string; virtue: string; description: string }[] = [];
  let evolutionNarrative = '';
  let homeSuggestions: { strengthLabel: string; activities: string[] }[] = [];

  if (isViaComplete && srssAnswers) {
    const gradeMap: Record<string, CoreGradeLevel> = {
      'ANO_1_EM': CoreGradeLevel.PRIMEIRO_ANO,
      'ANO_2_EM': CoreGradeLevel.SEGUNDO_ANO,
      'ANO_3_EM': CoreGradeLevel.TERCEIRO_ANO,
    };

    const profile = calculateStudentProfile(
      viaAnswers as any,
      srssAnswers as any,
      gradeMap[student.grade] || CoreGradeLevel.PRIMEIRO_ANO,
      bigFiveScores,
    );

    strengths = profile.signatureStrengths.map((s) => {
      const desc = STRENGTH_DESCRIPTIONS[s.strength];
      return {
        label: s.label,
        virtue: s.virtue,
        description: desc?.description || '',
      };
    });

    const evolutionData = allAssessments
      .filter((a: Row) => a.type === 'SRSS_IE')
      .map((a: Row) => ({
        window: a.screeningWindow === 'DIAGNOSTIC' ? 'Março' : a.screeningWindow === 'MONITORING' ? 'Junho' : 'Outubro',
        externalizing: (a.processedScores as any)?.externalizing?.score || 0,
        internalizing: (a.processedScores as any)?.internalizing?.score || 0,
      }));

    evolutionNarrative = generateEvolutionNarrative(evolutionData);

    homeSuggestions = getHomeSuggestions(
      profile.signatureStrengths.map((s) => ({ strength: s.strength, label: s.label })),
    );
  }

  // Audit: guardian viewed child
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      action: 'GUARDIAN_VIEWED_CHILD',
      targetId: student.id,
    },
  }).catch(() => {}); // Non-blocking

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Heart size={24} className="text-emerald-500" />
          Portal da Família
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhando: <strong>{student.name}</strong> — {gradeDisplay}
        </p>
      </div>

      {guardianLinks.length > 1 && (
        <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700">
          Você possui {guardianLinks.length} filho(a)(s) vinculado(s). Em breve será possível alternar entre eles.
        </div>
      )}

      {strengths.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
          <h3 className="text-slate-500 font-bold mb-2">Avaliações em Andamento</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            As avaliações do(a) seu(sua) filho(a) ainda estão em andamento. Em breve as forças de caráter e sugestões estarão disponíveis aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <StrengthsCard strengths={strengths} />
          </div>
          <div className="space-y-6">
            <EvolutionCard narrative={evolutionNarrative} />
            <SuggestionsCard suggestions={homeSuggestions} />
          </div>
        </div>
      )}

      {/* School contact */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">
        <p className="font-medium text-slate-700 mb-1">{student.tenant.name}</p>
        {student.tenant.phone && <p>Telefone: {student.tenant.phone}</p>}
        {student.tenant.email && <p>E-mail: {student.tenant.email}</p>}
      </div>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add components/guardian/ChildSelector.tsx components/guardian/StrengthsCard.tsx components/guardian/EvolutionCard.tsx components/guardian/SuggestionsCard.tsx app/(portal)/responsavel/page.tsx
git commit -m "feat: add guardian dashboard with strengths, evolution, and suggestions"
```

---

### Task 7: Guardian profile page — `/responsavel/perfil`

**Files:**
- Create: `app/(portal)/responsavel/perfil/page.tsx`

**Step 1: Create the profile page**

Create `app/(portal)/responsavel/perfil/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/src/core/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GuardianProfilePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.RESPONSIBLE) {
    redirect('/');
  }

  const guardianLinks = await prisma.studentGuardian.findMany({
    where: { guardianId: user.id, tenantId: user.tenantId },
    include: {
      student: { select: { name: true, grade: true } },
    },
  });

  const RELATIONSHIP_LABELS: Record<string, string> = {
    MAE: 'Mãe',
    PAI: 'Pai',
    AVO_A: 'Avô/Avó',
    TIO_A: 'Tio/Tia',
    OUTRO: 'Outro',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-slate-900">Meu Perfil</h1>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User size={20} className="text-slate-400" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-slate-400" />
            <span className="text-slate-500">Nome:</span>
            <span className="font-medium text-slate-800">{user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-slate-400" />
            <span className="text-slate-500">E-mail:</span>
            <span className="font-medium text-slate-800">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users size={20} className="text-slate-400" />
            Filhos Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardianLinks.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum aluno vinculado.</p>
          ) : (
            <div className="space-y-3">
              {guardianLinks.map((link) => {
                const gradeDisplay =
                  link.student.grade === 'ANO_1_EM' ? '1ª Série EM' :
                  link.student.grade === 'ANO_2_EM' ? '2ª Série EM' : '3ª Série EM';

                return (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{link.student.name}</p>
                      <p className="text-xs text-slate-500">{gradeDisplay}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      {RELATIONSHIP_LABELS[link.relationship] || link.relationship}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/(portal)/responsavel/perfil/page.tsx
git commit -m "feat: add guardian profile page with personal data and linked children"
```

---

### Task 8: Fix middleware redirect for RESPONSIBLE login

**Files:**
- Modify: `middleware.ts:118-120`
- Modify: `app/(portal)/layout.tsx:34-35`

**Step 1: Fix login redirect in middleware**

In `middleware.ts`, line 118-120 currently redirects authenticated users from `/login` to `/inicio`. The RESPONSIBLE role should go to `/responsavel`. Since middleware doesn't know the role, we redirect to `/inicio` for all users and handle it in the portal layout.

Actually, looking at the code — the portal layout already uses `getNavForRole` and `canAccessRoute`, and the auth system has `getHomeForRole`. The issue is:

1. Middleware redirects `/login` → `/inicio` (line 119)
2. RESPONSIBLE can't access `/inicio` (not in ROUTE_ACCESS)

Fix: In `middleware.ts`, change the login redirect to use a generic entry point, or add RESPONSIBLE to `/inicio` access.

Simplest fix: add RESPONSIBLE to the `/inicio` ROUTE_ACCESS in `lib/auth.ts`, then in the `/inicio` page, redirect RESPONSIBLE to `/responsavel`. OR, change middleware to redirect to `/` and handle in portal layout.

Best approach: update `lib/auth.ts` ROUTE_ACCESS to include RESPONSIBLE in `/inicio`, then in the portal layout, redirect to the role-specific home.

In `lib/auth.ts`, update ROUTE_ACCESS line 151:
```typescript
    '/inicio': ['TEACHER', 'MANAGER', 'ADMIN', 'PSYCHOLOGIST', 'COUNSELOR', 'STUDENT', 'RESPONSIBLE'],
```

But actually, the `(portal)/layout.tsx` doesn't do any role-based redirect. The middleware does. Let's look at the flow:
1. User logs in → middleware redirects to `/inicio`
2. Portal layout renders with sidebar nav based on role

For RESPONSIBLE, `/inicio` page would show but with RESPONSIBLE nav. Better approach: update the middleware redirect to use a route that understands roles, or redirect to `/` which then routes based on role.

Simplest fix in `middleware.ts` lines 118-120, redirect to root `/` instead of `/inicio`:

Change middleware line 119 from:
```typescript
        url.pathname = '/inicio';
```
to:
```typescript
        url.pathname = '/inicio';
```

Actually this won't work because `/` redirects to `/inicio` on line 125-128.

**Simplest approach**: Just add RESPONSIBLE to `/inicio` route access AND add a redirect in `/inicio` page for RESPONSIBLE users, OR handle it in the portal layout.

Better: In portal layout, if user is RESPONSIBLE and current path is `/inicio`, redirect to `/responsavel`.

In `app/(portal)/layout.tsx`, after line 20 (after getting user), add:

```typescript
    // Redirect RESPONSIBLE to their portal
    if (user.role === UserRole.RESPONSIBLE) {
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const pathname = headersList.get('x-next-pathname') || '';
        // We can't reliably get pathname in layout, so we'll handle this in /inicio page instead
    }
```

Actually the cleanest approach: add RESPONSIBLE to `/inicio` ROUTE_ACCESS, and create an `/inicio` redirect for RESPONSIBLE.

Let me simplify. The easiest fix:

In `lib/auth.ts`, add RESPONSIBLE to `/inicio` and `/configuracoes`:
```typescript
    '/inicio': ['TEACHER', 'MANAGER', 'ADMIN', 'PSYCHOLOGIST', 'COUNSELOR', 'STUDENT', 'RESPONSIBLE'],
    '/configuracoes': ['TEACHER', 'MANAGER', 'ADMIN', 'PSYCHOLOGIST', 'COUNSELOR', 'STUDENT', 'RESPONSIBLE'],
```

Then in `app/(portal)/inicio/page.tsx` (or wherever the /inicio route is), add a redirect for RESPONSIBLE at the top:
```typescript
if (user.role === UserRole.RESPONSIBLE) {
    redirect('/responsavel');
}
```

**Step 1: Update ROUTE_ACCESS**

In `lib/auth.ts`, update line 151 to include RESPONSIBLE:
```typescript
    '/inicio': ['TEACHER', 'MANAGER', 'ADMIN', 'PSYCHOLOGIST', 'COUNSELOR', 'STUDENT', 'RESPONSIBLE'],
    '/configuracoes': ['TEACHER', 'MANAGER', 'ADMIN', 'PSYCHOLOGIST', 'COUNSELOR', 'STUDENT', 'RESPONSIBLE'],
```

**Step 2: Add redirect in /inicio page**

Find the `/inicio` page file and add at the top (after getting user):
```typescript
import { UserRole } from '@/src/core/types';

// ... inside the component, after getCurrentUser():
if (user?.role === UserRole.RESPONSIBLE) {
    redirect('/responsavel');
}
```

**Step 3: Commit**

```bash
git add lib/auth.ts middleware.ts app/(portal)/inicio/page.tsx
git commit -m "fix: handle RESPONSIBLE role login redirect to /responsavel"
```

---

### Task 9: Run full test suite and verify

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All existing 121+ tests pass, plus the new guardian-invite tests

**Step 2: Run Prisma generate to verify schema**

Run: `npx prisma generate`
Expected: Success

**Step 3: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors (or only pre-existing ones)

**Step 4: Commit any fixes**

If any tests or type checks fail, fix them and commit:
```bash
git commit -m "fix: resolve test and type issues for guardian portal"
```

---

### Task 10: Final integration commit and push

**Step 1: Review all changes**

Run: `git log --oneline` to verify all commits are clean.

**Step 2: Final commit if needed**

If any loose ends remain, commit them.

**Step 3: Push**

Run: `git push` (only if user approves)
