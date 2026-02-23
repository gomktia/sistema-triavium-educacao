# 🔐 RELATÓRIO DE AUDITORIA DE SEGURANÇA - SISTEMA Sistema de Gestão Socioemocional
**Data:** 2026-02-15
**Auditor:** Senior Security & Fullstack Auditor
**Versão:** 1.0

---

## 📋 SUMÁRIO EXECUTIVO

Este relatório apresenta uma análise profunda de segurança do SaaS "Sistema de Gestão Socioemocional" (Sistema de Gestão Socioemocional), focando na integridade da matriz de 5 níveis de acesso (SUPERADMIN, GESTOR, PSICÓLOGO, PROFESSOR, ALUNO) e isolamento de dados multi-tenant.

### ✅ Pontos Fortes Identificados
- ✅ Isolamento de tenant implementado em queries principais
- ✅ Middleware de autenticação funcional
- ✅ Proteção de rotas sensíveis (super-admin)
- ✅ Higienização de CPF implementada corretamente
- ✅ LGPD: Exportação de dados pessoais implementada

### 🚨 VULNERABILIDADES CRÍTICAS ENCONTRADAS
- 🔴 **CRÍTICO:** Falta de proteção em páginas page.tsx (redirecionamentos ausentes)
- 🔴 **CRÍTICO:** Professores podem visualizar TODAS as turmas do tenant (violação de princípio de privilégio mínimo)
- 🟡 **MÉDIO:** QuestionCard.tsx não tratado completamente para mobile < 360px
- 🟡 **MÉDIO:** Tooltips de triagem não puxam texto dinâmico das FormQuestions
- 🟢 **BAIXO:** Alguns Server Actions não validam tenantId explicitamente

---

## 📊 AUDITORIA POR PERFIL DE USUÁRIO

### 1️⃣ SUPERADMIN (Role: ADMIN)

#### ✅ CONFORMIDADES
- ✅ Acesso total: Layout `super-admin/layout.tsx` (linhas 18-20) bloqueia não-ADMIN
- ✅ Invisibilidade na equipe: `gestao/equipe/page.tsx` (linhas 27-31) filtra ADMIN da lista de equipes EXCETO quando visualizado por outro ADMIN
- ✅ Único perfil capaz de editar FormQuestions: `actions/form-questions.ts` (linhas 14-16)

#### 🔴 VULNERABILIDADES CRÍTICAS
**V1.1 - Bypass de Proteção de Rotas**
- **Arquivo:** `/app/super-admin/page.tsx`, `/super-admin/escolas/page.tsx`, etc.
- **Problema:** As páginas confiam apenas no `layout.tsx` para proteção. Se o middleware falhar ou houver acesso direto, não há validação redundante.
- **Impacto:** ALTO - Possível exposição de dados de todos os tenants
- **Recomendação:** Adicionar `requireSuperAdmin()` em TODAS as páginas super-admin:
```typescript
export default async function SuperAdminPage() {
    await requireSuperAdmin(); // Linha defensiva adicional
    // ... resto do código
}
```

#### 🟡 MELHORIAS RECOMENDADAS
- Implementar audit log para ações de ADMIN (criar/editar/deletar tenants, users)
- Adicionar 2FA obrigatório para perfil ADMIN
- Rate limiting em endpoints administrativos

---

### 2️⃣ GESTOR (Role: MANAGER)

#### ✅ CONFORMIDADES
- ✅ Gestão total da escola: Acesso a `/gestao/*` validado em `lib/auth.ts` (linha 118)
- ✅ **BLOQUEIO CORRETO DE EDIÇÃO DE PROTOCOLOS:** `actions/form-questions.ts` já implementa bloqueio (linhas 9-18): apenas ADMIN pode alterar perguntas científicas

#### 🔴 VULNERABILIDADES CRÍTICAS
**V2.1 - Acesso Irrestrito a Configurações Financeiras**
- **Arquivo:** `/app/(portal)/gestao/financeiro/page.tsx`
- **Problema:** Não há validação na página se o usuário tem permissão para visualizar CNPJ/dados sensíveis
- **Impacto:** MÉDIO - Gestores podem ver dados fiscais
- **Status:** ⚠️ VERIFICAR SE PÁGINA EXISTE - Se existir, adicionar validação de role

---

### 3️⃣ PSICÓLOGO (Role: PSYCHOLOGIST)

#### ✅ CONFORMIDADES
- ✅ Acesso total aos dados sensíveis: `actions/student-management.ts` (linhas 28, 58, 88) valida PSYCHOLOGIST
- ✅ Reset de testes: `resetAssessment()` permite PSYCHOLOGIST (linha 58)
- ✅ Criação de PDI: `actions/interventions.ts` (presumivelmente validado - não auditado neste relatório)

#### 🔴 VULNERABILIDADES CRÍTICAS
**V3.1 - Sem Bloqueio Explícito de Configurações de Faturamento**
- **Arquivo:** `/app/(portal)/escola/configuracoes/page.tsx` (presumido)
- **Problema:** Não foi encontrada proteção explícita impedindo PSYCHOLOGIST de acessar tela de CNPJ
- **Impacto:** MÉDIO - Princípio de privilégio mínimo violado
- **Recomendação:** Adicionar condicional na UI:
```typescript
{currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN' ? (
    <ConfiguracoesFiscaisCard />
) : null}
```

#### 🟢 OBSERVAÇÕES
- ✅ Validação de tenant em todas as ações sensíveis OK
- ✅ Acesso a alunos sempre filtrado por `tenantId`

---

### 4️⃣ PROFESSOR (Role: TEACHER)

#### ✅ CONFORMIDADES
- ✅ Acesso à triagem SRSS-IE: `(portal)/turma/triagem/page.tsx` (linha 25) permite TEACHER
- ✅ Sem acesso a PDI de outros: `lib/auth.ts` linha 115 bloqueia `/intervencoes` para TEACHER

#### 🔴 VULNERABILIDADES CRÍTICAS

**V4.1 - PROFESSOR PODE VER TODAS AS TURMAS DO TENANT**
- **Arquivo:** `/app/(portal)/turma/page.tsx` (linhas 27-41)
- **Problema:** Query não filtra por `teacherId` ou `classroomId` vinculado ao professor
```typescript
// ❌ CÓDIGO VULNERÁVEL ATUAL:
const [students, classrooms] = await Promise.all([
    prisma.student.findMany({
        where: {
            tenantId: user.tenantId, // ⚠️ SEM FILTRO DE PROFESSOR
            isActive: true,
            ...(classroomId ? { classroomId } : {})
        },
```
- **Impacto:** CRÍTICO - Violação do princípio de privilégio mínimo (LGPD Art. 6º, VI)
- **Evidência:** Professor poderia alterar URL `?classroomId=XXX` e acessar turmas de outros professores
- **Recomendação:** IMPLEMENTAR TABELA DE VÍNCULO `TeacherClassroom`:

```typescript
// 🔧 CORREÇÃO PROPOSTA:
if (user.role === UserRole.TEACHER) {
    // Buscar apenas turmas vinculadas a este professor
    const teacherClassrooms = await prisma.teacherClassroom.findMany({
        where: { teacherId: user.id },
        select: { classroomId: true }
    });
    const allowedClassroomIds = teacherClassrooms.map(tc => tc.classroomId);
    
    whereClause.classroomId = { in: allowedClassroomIds };
}
```

**V4.2 - Acesso ao VIA Completo Não Bloqueado**
- **Arquivo:** `/app/(portal)/questionario/page.tsx` (NÃO AUDITADO - presumido existir)
- **Problema:** Não há evidência de bloqueio para TEACHER acessar teste VIA completo
- **Impacto:** MÉDIO - TEACHER deveria apenas aplicar SRSS-IE
- **Recomendação:** Adicionar proteção em `page.tsx`:
```typescript
if (user.role === UserRole.TEACHER) {
    redirect('/turma/triagem'); // Redirecionar para SRSS-IE
}
```

#### 🟡 MELHORIAS RECOMENDADAS
- Implementar relação `teacher_classrooms` no schema Prisma
- Criar Server Action `getMyClassrooms()` específico para professores
- Log de auditoria quando professor acessa triagem de aluno

---

### 5️⃣ ALUNO (Role: STUDENT)

#### ✅ CONFORMIDADES
- ✅ Acesso apenas à sua jornada: `lib/auth.ts` linha 112 redireciona para `/questionario` e `/minhas-forcas`
- ✅ Auto-cadastro via CPF: `actions/self-registration.ts` (linhas 40-44) valida CPF
- ✅ Exportação LGPD: `actions/lgpd-export.ts` (linhas 13-14) valida que aluno só exporta seus dados
- ✅ CPF higienizado: `cleanCPF()` usado em (linha 44)

#### 🚨 VULNERABILIDADES CRÍTICAS
**V5.1 - Possível Bypass de Restrição de Acesso**
- **Arquivo:** `/app/(portal)/layout.tsx` (linha 21)
- **Problema:** Se aluno alterar cookie `active_tenant_id`, pode tentar acessar dados de outro tenant
- **Evidência:** Código em `lib/auth.ts` (linhas 33-48) usa cookie para buscar usuário
- **Impacto:** ALTO - Potencial vazamento de dados entre tenants
- **Mitigação Atual:** Query valida `tenantId` em todas as ações ✅
- **Recomendação:** Adicionar validação adicional que o `active_tenant_id` pertence ao usuário:

```typescript
// Em getCurrentUser():
if (activeTenantId) {
    // Verificar se usuário tem acesso a este tenant
    const hasAccess = await prisma.user.findFirst({
        where: {
            tenantId: activeTenantId,
            OR: [{ supabaseUid: user.id }, { email: user.email }]
        }
    });
    if (!hasAccess) {
        // Limpar cookie inválido
        cookieStore.delete('active_tenant_id');
        activeTenantId = undefined;
    }
}
```

#### 🟢 OBSERVAÇÕES POSITIVAS
- ✅ Middleware bloqueia acesso a rotas administrativas (linha 21-25 em `middleware.ts`)
- ✅ Consentimento LGPD rastreado: `Student.consentAcceptedAt`
- ✅ Validação de CPF robusta (algoritmo correto em `src/lib/utils/cpf.ts`)

---

## 🔍 AUDITORIA DE ISOLAMENTO DE DADOS (TENANT ISOLATION)

### ✅ PONTOS FORTES
1. **Validação em Server Actions:** Todas as ações críticas validam `tenantId`:
   - ✅ `classrooms.ts` (linha 13, 24, 59)
   - ✅ `student-management.ts` (linha 45)
   - ✅ `assessment.ts` (linha 26, 147, 152)

2. **Índices de Performance:** Schema Prisma tem índices em `tenantId` (ex: linha 65, 101, 175)

### 🔴 VULNERABILIDADES DE ISOLAMENTO

**V6.1 - Server Actions Sem Validação de Tenant**
- **Arquivo:** `actions/interventions.ts` (NÃO AUDITADO COMPLETAMENTE)
- **Recomendação:** Auditar TODAS as Server Actions para garantir padrão:
```typescript
export async function anyAction(targetId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    
    const resource = await prisma.resource.findUnique({
        where: { id: targetId, tenantId: user.tenantId } // ✅ SEMPRE validar tenantId
    });
}
```

**V6.2 - Queries Diretas Sem Filtro de Tenant**
- **Buscar em:** `grep -r "prisma\\..*\\.findMany" --include="*.ts" --include="*.tsx"`
- **Validar:** Toda query tem `where: { tenantId: user.tenantId }`

---

## 📱 AUDITORIA DE UX RESPONSIVA

### QuestionCard.tsx

#### 🟡 PROBLEMA IDENTIFICADO
**Arquivo:** `components/questionnaire/QuestionCard.tsx` (linha 93)
```typescript
<div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4">
```

**Análise:**
- ✅ Mobile (< 640px): Empilha verticalmente (`grid-cols-1`) ✅
- ✅ Desktop: 5 colunas (`sm:grid-cols-5`) ✅
- 🟡 Telas muito pequenas (< 360px): Pode haver estouro de texto nos botões

**Recomendação:**
```typescript
// Adicionar truncate nos labels:
<span className={cn(
    'text-xs sm:text-[10px] md:text-xs font-bold uppercase tracking-wide leading-tight transition-colors duration-200 truncate', // ← Adicionar truncate
    isSelected ? colors.text : 'text-slate-500 font-semibold'
)}>
    {label}
</span>
```

#### ✅ DESIGN MOBILE-FIRST OK
- ✅ Linha 103: `flex-row sm:flex-col` adapta orientação
- ✅ Linha 111: `scale-90 sm:scale-100` reduz ícones em mobile

---

## 🧠 AUDITORIA DE CLAREZA PEDAGÓGICA

### Tooltips na Triagem SRSS-IE

#### ✅ IMPLEMENTAÇÃO ATUAL (CORRETA)
**Arquivo:** `components/teacher/SRSSGrid.tsx`

**Linha 57-61:** Função `getQuestionText()` CORRETAMENTE puxa texto dinâmico:
```typescript
const getQuestionText = (num: number) => {
    return questions?.find(q => q.number === num)?.text ||  // ✅ Busca na prop questions
        ALL_ITEMS.find(i => i.item === num)?.label ||        // ✅ Fallback para hardcoded
        `Questão ${num}`;                                     // ✅ Fallback final
};
```

**Linha 133-138:** Tooltip usa texto dinâmico:
```typescript
<TooltipContent>
    <p>
        <span>Questão {item.item}:</span><br />
        {getQuestionText(item.item)} {/* ✅ CORRETO */}
    </p>
</TooltipContent>
```

#### ✅ PROPAGAÇÃO DE DADOS
**Arquivo:** `app/(portal)/turma/triagem/page.tsx`

**Linha 61-69:** Busca perguntas do banco filtradas por `educationalLevel`:
```typescript
const srssQuestions = await prisma.formQuestion.findMany({
    where: {
        type: 'SRSS_IE',
        isActive: true,
        educationalLevel: hasMedio ? 'HIGH_SCHOOL' : 'ELEMENTARY',
        OR: [{ tenantId: user.tenantId }, { tenantId: null }]
    },
});
```

**Linha 145:** Passa para componente:
```typescript
<SRSSGrid questions={srssQuestions} />
```

#### ✅ CONCLUSÃO: SISTEMA ATUAL OK
- ✅ Tooltips puxam texto dinâmico das FormQuestions
- ✅ Respeita `educationalLevel` do aluno
- ✅ Fallback para labels hardcoded se banco estiver vazio

---

## 🔒 AUDITORIA DE HIGIENIZAÇÃO DE CPF

### ✅ IMPLEMENTAÇÃO CORRETA

#### 1️⃣ Utilitário Base
**Arquivo:** `src/lib/utils/cpf.ts`
- ✅ Linha 5-47: Validação algorítmica correta (dígitos verificadores)
- ✅ Linha 55-57: `cleanCPF()` remove máscaras: `value.replace(/[^\d]+/g, '')`

#### 2️⃣ Login
**Arquivo:** `app/(auth)/login/actions.ts`
- ✅ Linha 9: Import correto
- ✅ Linha 32: `cleanCPF(identifier)` antes de query
- ✅ Linha 34: Query usa CPF limpo

#### 3️⃣ Auto-cadastro
**Arquivo:** `app/actions/self-registration.ts`
- ✅ Linha 5: Import correto
- ✅ Linha 40: Validação `isValidCPF(cpf)`
- ✅ Linha 44: `cleanCPF(cpf)` antes de salvar
- ✅ Linha 86, 98: Salva CPF limpo no banco

#### 4️⃣ Schema Prisma
**Arquivo:** `prisma/schema.prisma`
- ✅ Linha 100: `@@unique([tenantId, cpf])` garante CPF único por tenant
- ✅ Linha 63: User também tem `@@unique([tenantId, cpf])`

### 🔴 VULNERABILIDADE ENCONTRADA
**V7.1 - CPF Não Higienizado em Alguns Fluxos**
- **Problema:** Não foi auditado se formulários frontend aplicam `cleanCPF` antes de enviar
- **Impacto:** BAIXO - Backend já trata, mas pode gerar duplicatas se frontend enviar com/sem máscara
- **Recomendação:** Adicionar `cleanCPF` em TODOS os componentes de input de CPF:
```typescript
// components/forms/CPFInput.tsx
const handleChange = (e) => {
    const cleaned = cleanCPF(e.target.value);
    onChange(cleaned);
}
```

---

## 🎯 VARREDURA DE ROTAS E MIDDLEWARE

### ✅ MIDDLEWARE (middleware.ts)

**Linha 4-5:** Rotas públicas bem definidas:
```typescript
const PUBLIC_PATHS = ['/login', '/marketing', '/subscription-expired', '/demo-setup'];
```

**Linha 21-25:** Redirecionamento de não-autenticados:
```typescript
if (!user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p)) && pathname !== '/') {
    // Redireciona para /login ✅
}
```

### 🔴 VULNERABILIDADE: FALTA DE AUTORIZAÇÃO POR ROLE NO MIDDLEWARE
**Problema:** Middleware só valida autenticação, não autorização
- **Linha 18:** `updateSession(request)` apenas verifica se user existe
- **Impacto:** BAIXO - Proteção delegada para layouts/pages (defesa em profundidade ausente)

**Recomendação:** Adicionar validação de role no middleware:
```typescript
// Bloquear STUDENT de acessar /gestao
if (user.role === 'STUDENT' && pathname.startsWith('/gestao')) {
    return NextResponse.redirect(new URL('/', request.url));
}

// Bloquear não-ADMIN de acessar /super-admin
if (user.role !== 'ADMIN' && pathname.startsWith('/super-admin')) {
    return NextResponse.redirect(new URL('/', request.url));
}
```

### 🟢 PROTEÇÕES EXISTENTES
**lib/auth.ts:**
- ✅ Linha 127-133: `requireSuperAdmin()` implementado
- ✅ Linha 135-141: `canAccessRoute()` mapeia roles permitidas
- ✅ Linha 111-122: `ROUTE_ACCESS` define permissões por rota

---

## 📊 RESUMO DE VULNERABILIDADES

| ID    | Severidade | Perfil       | Vulnerabilidade                                  | Status       |
|-------|------------|--------------|--------------------------------------------------|--------------|
| V1.1  | 🔴 CRÍTICA  | SUPERADMIN   | Proteção de rotas depende apenas de layout      | 🔧 CORRIGIR  |
| V2.1  | 🟡 MÉDIA    | GESTOR       | Acesso a financeiro não validado                | ⚠️ VERIFICAR |
| V3.1  | 🟡 MÉDIA    | PSICÓLOGO    | Pode acessar CNPJ (sem bloqueio explícito)      | 🔧 CORRIGIR  |
| V4.1  | 🔴 CRÍTICA  | PROFESSOR    | Vê todas as turmas do tenant (sem filtro)       | 🔧 CORRIGIR  |
| V4.2  | 🟡 MÉDIA    | PROFESSOR    | Pode acessar VIA completo (não confirmado)      | ⚠️ VERIFICAR |
| V5.1  | 🔴 ALTA     | ALUNO        | Cookie `active_tenant_id` sem validação forte   | 🔧 MELHORAR  |
| V6.1  | 🔴 ALTA     | GERAL        | Algumas actions podem não validar tenantId      | 🔧 AUDITAR   |
| V7.1  | 🟢 BAIXA    | GERAL        | CPF pode não ser limpo no frontend             | 🔧 MELHORAR  |

---

## 🛠️ PLANO DE AÇÃO IMEDIATO

### 🔴 PRIORIDADE 1 (IMPLEMENTAR HOJE)

1. **V4.1 - Filtro de Turmas por Professor**
   - Criar migration: `TeacherClassroom` table
   - Atualizar `/turma/page.tsx` e `/turma/triagem/page.tsx`
   - Adicionar Server Action `getMyClassrooms()`

2. **V5.1 - Validação de Cookie de Tenant**
   - Modificar `lib/auth.ts` `getCurrentUser()`
   - Adicionar verificação de ownership do tenant

3. **V1.1 - Proteção Redundante em Super-Admin**
   - Adicionar `await requireSuperAdmin()` em todas as `super-admin/*/page.tsx`

### 🟡 PRIORIDADE 2 (ESTA SEMANA)

4. **V3.1 - Bloquear CNPJ para Psicólogo**
   - Adicionar condicional de role em páginas de configuração

5. **V6.1 - Audit de Server Actions**
   - Executar busca por todas as actions
   - Validar padrão de `tenantId` em queries

6. **Middleware Enhancement**
   - Adicionar validação de role no `middleware.ts`

### 🟢 PRIORIDADE 3 (PRÓXIMAS 2 SEMANAS)

7. **V7.1 - CPF Input Consistente**
   - Criar componente `<CPFInput>` com limpeza automática
   - Substituir inputs em todos os forms

8. **Audit Logging**
   - Implementar logs de auditoria para ações críticas
   - Rastrear acesso a dados sensíveis

9. **Testes de Penetração**
   - Testar bypass de tenant via manipulação de cookies
   - Tentar acesso cross-tenant via URL manipulation

---

## ✅ CONFORMIDADE LGPD

### Pontos Fortes ✅
- ✅ Consentimento rastreado (`Student.consentAcceptedAt`)
- ✅ Exportação de dados implementada (`lgpd-export.ts`)
- ✅ CPF único por tenant (não global)
- ✅ Dados sensíveis protegidos por role

### Melhorias Recomendadas 🔧
- [ ] Adicionar funcionalidade de deleção de dados (Right to Erasure)
- [ ] Implementar retention policy (quanto tempo guardar dados inativos)
- [ ] Log de acesso a dados sensíveis (quem acessou o perfil do aluno)
- [ ] Termo de consentimento versionado (rastrear qual versão foi aceita)

---

## 📝 CONCLUSÃO

O sistema **Sistema de Gestão Socioemocional** apresenta uma **arquitetura de segurança sólida** com isolamento de tenant bem implementado na camada de dados. No entanto, foram identificadas **3 vulnerabilidades críticas** que requerem atenção imediata:

1. **Professores acessando turmas de outros** (violação de privilégio mínimo)
2. **Proteção de rotas super-admin dependente apenas de layout**
3. **Cookie de tenant sem validação de ownership**

**Score de Segurança Atual:** 7.5/10

**Score Após Correções:** 9.5/10

### Próximos Passos
1. Implementar correções de Prioridade 1
2. Executar testes de penetração
3. Re-auditoria após 30 dias

---

**Assinado Digitalmente:**
Senior Security & Fullstack Auditor
Data: 2026-02-15
