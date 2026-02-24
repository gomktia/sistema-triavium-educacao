# Super Admin Panel — Design Completo

## Contexto

O painel Super Admin (`/super-admin`) precisa ser o centro de controle do SaaS Triavium para que Geison e Marcio possam gerenciar N escolas em produção. Hoje ele tem:
- Dashboard com métricas básicas (parcialmente hardcoded)
- Lista de escolas (read-only)
- Dialog para criar escola
- 3 páginas placeholder vazias (Financeiro, Suporte, Configurações)
- Impersonation placeholder

## Decisões do Usuário

- **Financeiro**: controle manual agora, preparado para gateway futuro
- **Suporte**: sistema de tickets interno
- **Impersonation**: dashboard completo da escola (ver como gestor)
- **Integrações**: webhooks básicos

---

## Fase 1 — Operação Core (Dia 1 de produção)

### 1.1 Impersonation (Acessar Escola como Gestor)

**Mecanismo**: Ao clicar "Entrar na escola", o sistema seta um cookie `active_tenant_id` com o tenant selecionado e redireciona para `/inicio`. O `getCurrentUser()` já suporta esse cookie. O admin vê o painel exatamente como o gestor da escola. Um banner fixo no topo indica "Visualizando como: [Escola]" com botão "Voltar ao Painel Global".

**Arquivos**:
- `app/actions/super-admin.ts` — nova action `impersonateTenant(tenantId)` que seta o cookie e `exitImpersonation()` que limpa
- `components/admin/ImpersonationBanner.tsx` — banner fixo quando `active_tenant_id` difere do tenant original do admin
- `app/(portal)/layout.tsx` — renderizar o banner quando admin está em impersonation
- `app/super-admin/escola/[id]/page.tsx` — página de detalhes da escola com botão "Entrar como Gestor"

**Fluxo**:
1. Admin clica na escola na lista
2. Abre `/super-admin/escola/[id]` com visão geral
3. Clica "Entrar como Gestor"
4. Cookie `active_tenant_id` setado → redirect `/inicio`
5. Admin navega normalmente como se fosse MANAGER daquela escola
6. Banner no topo: "Visualizando [Escola] — Voltar ao Painel"
7. Ao clicar voltar: cookie limpo → redirect `/super-admin`

**Segurança**: Apenas role ADMIN pode usar impersonation. A action valida `requireSuperAdmin()`. O banner mostra claramente que está em modo impersonation.

---

### 1.2 Gestão de Usuários Cross-Tenant

**Página**: `/super-admin/usuarios`

**Funcionalidades**:
- Listar todos os usuários de todas as escolas com filtros (por escola, por role, por status ativo/inativo)
- Busca por nome ou email
- Criar usuário em qualquer escola (reutiliza fluxo do invite-member existente, passando tenantId)
- Editar role de um usuário
- Ativar/desativar usuário (toggle isActive)
- Resetar senha (gera link de redefinição via Supabase Auth)

**Arquivos**:
- `app/super-admin/usuarios/page.tsx` — página com tabela + filtros
- `app/actions/super-admin.ts` — server actions:
  - `getUsers(filters)` — lista cross-tenant com paginação
  - `updateUserRole(userId, newRole)` — muda role
  - `toggleUserActive(userId)` — ativa/desativa
  - `resetUserPassword(userId)` — gera link de reset via Supabase
  - `createUserInTenant(tenantId, data)` — cria e convida
- `components/admin/UserManagementTable.tsx` — tabela client-side com filtros
- `components/admin/EditUserDialog.tsx` — dialog para editar role/status
- `components/admin/CreateUserDialog.tsx` — dialog para criar usuário em qualquer tenant

**Data Model**: Usa os models existentes `User` e `Tenant`. Nenhuma migração necessária.

---

### 1.3 Gestão de Escolas (CRUD completo)

**Melhorias na página existente** `/super-admin/escolas`:

**Funcionalidades novas**:
- Busca e filtros (por status, por tipo de organização, por cidade/estado)
- Clicar na escola → abre `/super-admin/escola/[id]` com abas:
  - **Visão Geral**: métricas (alunos, triagens, laudos, último acesso de qualquer usuário)
  - **Configurações**: editar dados do tenant (nome, CNPJ, email, telefone, endereço, logo, tipo org)
  - **Assinatura**: status, plano, datas, toggle ativo/inativo
- Toggle ativar/desativar escola diretamente na lista
- Indicador visual de "escola inativa" ou "sem atividade há X dias"

**Arquivos**:
- `app/super-admin/escola/[id]/page.tsx` — hub da escola com abas (usando tabs do shadcn)
- `app/super-admin/escola/[id]/layout.tsx` — layout com header da escola
- `app/actions/super-admin.ts` — adicionar:
  - `getTenantDetails(tenantId)` — dados completos do tenant
  - `updateTenantDetails(tenantId, data)` — editar dados (extensão do updateTenantSettings existente, mas cross-tenant)
  - `toggleTenantActive(tenantId)` — ativar/desativar
  - `updateTenantSubscription(tenantId, data)` — mudar status/plano
- `components/admin/TenantDetailsForm.tsx` — form de edição
- `components/admin/TenantOverviewCards.tsx` — cards de métricas da escola

---

### 1.4 Dashboard Melhorado

**Melhorias no** `/super-admin` **existente**:

- Remover Health Score hardcoded (98.5%) → substituir por "Escolas Ativas / Total" real
- MRR real baseado nos planos atribuídos (não hardcoded R$ 1990)
- Gráfico de evolução (últimos 6 meses): novos tenants, total alunos, total triagens
- Cards de alerta: escolas sem atividade há >30 dias, escolas com assinatura vencida
- Top 5 escolas por uso (já existe parcialmente)
- Últimos tickets de suporte

**Arquivos**:
- `app/super-admin/page.tsx` — refatorar com dados reais
- `app/actions/super-admin.ts` — adicionar:
  - `getDashboardMetrics()` — métricas globais agregadas
  - `getUsageEvolution()` — dados para gráfico de evolução
  - `getInactiveSchools()` — escolas sem atividade recente
- `components/admin/UsageEvolutionChart.tsx` — gráfico recharts de evolução

---

## Fase 2 — Controle Financeiro e Suporte

### 2.1 Financeiro Manual

**Página**: `/super-admin/financeiro` (substituir placeholder)

**Schema novo** (Prisma migration):
```prisma
model TenantPlan {
  id          String   @id @default(cuid())
  tenantId    String
  planName    String   // ESSENTIAL, ADVANCE, SOVEREIGN, CUSTOM
  monthlyPrice Float
  studentLimit Int?
  startDate   DateTime
  endDate     DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoices    Invoice[]

  @@index([tenantId])
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

  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan        TenantPlan?   @relation(fields: [planId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@index([dueDate])
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}
```

**Funcionalidades**:
- Dashboard financeiro: MRR real, receita mensal, inadimplência, projeção
- Lista de faturas com filtros (por escola, por status, por mês)
- Criar fatura manual para uma escola
- Marcar fatura como paga
- Atribuir plano a escola (com preço e limite de alunos)
- Alertas de faturas vencidas

**Arquivos**:
- `prisma/schema.prisma` — adicionar TenantPlan, Invoice, InvoiceStatus
- `app/super-admin/financeiro/page.tsx` — dashboard financeiro
- `app/actions/super-admin.ts` — adicionar:
  - `getFinancialDashboard()` — MRR, receita, inadimplência
  - `getInvoices(filters)` — lista com paginação
  - `createInvoice(data)` — criar fatura
  - `updateInvoiceStatus(id, status)` — marcar pago/cancelado
  - `assignPlan(tenantId, planData)` — atribuir plano
- `components/admin/InvoiceTable.tsx` — tabela de faturas
- `components/admin/CreateInvoiceDialog.tsx` — dialog para criar fatura
- `components/admin/FinancialCards.tsx` — cards de métricas financeiras
- `components/admin/AssignPlanDialog.tsx` — dialog para atribuir plano a escola

**Relação com Tenant**: Adicionar relação `plans TenantPlan[]` e `invoices Invoice[]` no model Tenant.

---

### 2.2 Tickets de Suporte

**Página**: `/super-admin/suporte` (substituir placeholder)

**Schema novo**:
```prisma
model SupportTicket {
  id          String       @id @default(cuid())
  tenantId    String
  userId      String
  subject     String
  priority    TicketPriority @default(MEDIUM)
  status      TicketStatus   @default(OPEN)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  closedAt    DateTime?

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id])
  messages    TicketMessage[]

  @@index([tenantId])
  @@index([status])
  @@index([priority])
}

model TicketMessage {
  id        String   @id @default(cuid())
  ticketId  String
  userId    String
  content   String   @db.Text
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())

  ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id])

  @@index([ticketId])
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

**Funcionalidades (lado Admin)**:
- Lista de tickets com filtros (por escola, status, prioridade)
- Abrir ticket e ver histórico de mensagens (chat-style)
- Responder ticket (como admin)
- Mudar status/prioridade
- Fechar ticket
- Métricas: tickets abertos, tempo médio de resposta, tickets por escola

**Funcionalidades (lado Gestor)**: Adicionar item "Suporte" no sidebar do MANAGER
- Abrir novo ticket
- Ver meus tickets
- Responder mensagens

**Arquivos**:
- `prisma/schema.prisma` — adicionar SupportTicket, TicketMessage, enums
- `app/super-admin/suporte/page.tsx` — lista de tickets
- `app/super-admin/suporte/[id]/page.tsx` — detalhes do ticket com chat
- `app/actions/tickets.ts` — server actions:
  - `getTickets(filters)` — lista
  - `getTicketById(id)` — detalhes com mensagens
  - `createTicket(data)` — criar (gestor)
  - `replyToTicket(ticketId, content)` — responder
  - `updateTicketStatus(id, status)` — mudar status
  - `getTicketMetrics()` — métricas para dashboard
- `components/admin/TicketList.tsx` — tabela de tickets
- `components/admin/TicketChat.tsx` — chat de mensagens
- `components/admin/CreateTicketDialog.tsx` — dialog para gestor abrir ticket
- Atualizar sidebar do MANAGER: adicionar item "Suporte" apontando para `/suporte-escola`
- `app/(portal)/suporte-escola/page.tsx` — página de suporte do gestor

---

### 2.3 Logs de Auditoria

**Página**: `/super-admin/logs`

O schema `AuditLog` já existe com campos: action, targetId, details (Json), timestamp, ip. Falta:
- UI para visualizar
- Registrar mais ações (hoje só student-management loga)

**Funcionalidades**:
- Lista de logs com filtros (por escola, por usuário, por ação, por período)
- Busca por targetId
- Export CSV
- Ações logadas: login, impersonation, criação/edição de tenant, mudança de role, reset de senha, criação/exclusão de aluno, aplicação de triagem

**Arquivos**:
- `app/super-admin/logs/page.tsx` — tabela de logs
- `app/actions/super-admin.ts` — adicionar:
  - `getAuditLogs(filters)` — lista com paginação
  - `exportAuditLogs(filters)` — export CSV
- `lib/audit.ts` — helper centralizado:
  - `logAuditAction(userId, tenantId, action, targetId?, details?)` — registrar ação
- `components/admin/AuditLogTable.tsx` — tabela com filtros
- Adicionar chamadas a `logAuditAction()` nas actions existentes (impersonation, user management, tenant management)

---

## Fase 3 — Analytics e Integrações

### 3.1 Analytics por Escola

**Funcionalidade na aba "Visão Geral" de** `/super-admin/escola/[id]`:

**Métricas por escola**:
- Total de alunos / ativos / inativos
- Triagens aplicadas por janela (Diagnóstica, Monitoramento, Final)
- Distribuição de risco (Tier 1/2/3) com evolução
- Engajamento: % de professores que aplicaram triagem, % de alunos que responderam VIA/Big Five
- Laudos gerados
- Último acesso de cada role
- Gráfico de evolução mensal (alunos, triagens, intervenções)

**Arquivos**:
- `app/actions/super-admin.ts` — adicionar:
  - `getTenantAnalytics(tenantId)` — métricas detalhadas
  - `getTenantUsageHistory(tenantId)` — dados mensais para gráficos
- `components/admin/TenantAnalyticsDashboard.tsx` — grid de cards + gráficos
- `components/admin/TenantRiskDistribution.tsx` — pie/bar chart de distribuição de risco
- `components/admin/TenantEngagementMetrics.tsx` — métricas de engajamento

---

### 3.2 Webhooks Básicos

**Página**: `/super-admin/webhooks`

**Schema novo**:
```prisma
model Webhook {
  id        String   @id @default(cuid())
  tenantId  String
  url       String
  events    String[] // ['assessment.completed', 'student.risk_changed', 'intervention.created']
  secret    String   // HMAC signing secret
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
```

**Eventos disponíveis**:
- `assessment.completed` — triagem concluída
- `student.risk_changed` — aluno mudou de tier
- `intervention.created` — intervenção criada
- `ticket.created` — ticket de suporte aberto

**Funcionalidades**:
- Criar webhook para um tenant (URL + eventos)
- Gerar secret para assinatura HMAC
- Testar webhook (enviar evento de teste)
- Ativar/desativar
- Log de entregas recentes (sucesso/falha)

**Arquivos**:
- `prisma/schema.prisma` — adicionar Webhook
- `app/super-admin/webhooks/page.tsx` — lista de webhooks
- `app/actions/webhooks.ts` — CRUD de webhooks
- `lib/webhooks.ts` — refatorar o no-op atual para disparar webhooks reais:
  - `triggerWebhook(event, payload)` — busca webhooks ativos para o tenant, envia POST com HMAC
- `components/admin/WebhookTable.tsx` — tabela
- `components/admin/CreateWebhookDialog.tsx` — dialog de criação

---

### 3.3 Configurações Globais

**Página**: `/super-admin/configuracoes` (substituir placeholder)

**Funcionalidades**:
- Definição de planos padrão (nome, preço, limite de alunos)
- Feature flags por tenant (ex: habilitar/desabilitar módulo Big Five, Percepção Familiar)
- Configurações de email (remetente, templates)
- Limites globais (rate limiting, max upload size)
- Informações do sistema (versão, última deploy)

**Implementação pragmática**: Usar uma tabela `SystemConfig` key-value para configurações globais, ou simplesmente hardcoded com UI de visualização para v1.

**Arquivos**:
- `app/super-admin/configuracoes/page.tsx` — página com seções
- `components/admin/PlanDefinitions.tsx` — tabela de planos editável
- `components/admin/SystemInfo.tsx` — info do sistema

---

## Sidebar Atualizado

```
ADMIN:
├── Painel Global          /super-admin
├── Organizações           /super-admin/escolas
├── Usuários               /super-admin/usuarios
├── Financeiro             /super-admin/financeiro
├── Suporte                /super-admin/suporte
├── Logs de Auditoria      /super-admin/logs
├── Webhooks               /super-admin/webhooks
├── Feedback               /super-admin/feedback
├── Configurações SaaS     /super-admin/configuracoes
```

---

## Resumo de Migrações Prisma

**Novos models**: TenantPlan, Invoice, SupportTicket, TicketMessage, Webhook
**Novos enums**: InvoiceStatus, TicketPriority, TicketStatus
**Relações adicionadas no Tenant**: plans, invoices, supportTickets, webhooks
**Relações adicionadas no User**: supportTickets, ticketMessages

---

## Resumo de Arquivos por Fase

### Fase 1 (12 arquivos)
- `app/actions/super-admin.ts` (NOVO — hub central de actions)
- `app/super-admin/page.tsx` (REFATORAR)
- `app/super-admin/escolas/page.tsx` (REFATORAR)
- `app/super-admin/escola/[id]/page.tsx` (NOVO)
- `app/super-admin/escola/[id]/layout.tsx` (NOVO)
- `app/super-admin/usuarios/page.tsx` (NOVO)
- `components/admin/ImpersonationBanner.tsx` (NOVO)
- `components/admin/UserManagementTable.tsx` (NOVO)
- `components/admin/EditUserDialog.tsx` (NOVO)
- `components/admin/TenantDetailsForm.tsx` (NOVO)
- `components/admin/TenantOverviewCards.tsx` (NOVO)
- `components/admin/UsageEvolutionChart.tsx` (NOVO)
- `components/sidebar-nav.ts` (EDITAR — atualizar menu)
- `app/(portal)/layout.tsx` (EDITAR — adicionar ImpersonationBanner)

### Fase 2 (16 arquivos + migration)
- `prisma/schema.prisma` (EDITAR — TenantPlan, Invoice, SupportTicket, TicketMessage)
- `app/super-admin/financeiro/page.tsx` (REESCREVER)
- `app/super-admin/suporte/page.tsx` (REESCREVER)
- `app/super-admin/suporte/[id]/page.tsx` (NOVO)
- `app/super-admin/logs/page.tsx` (NOVO)
- `app/(portal)/suporte-escola/page.tsx` (NOVO)
- `app/actions/tickets.ts` (NOVO)
- `lib/audit.ts` (NOVO)
- `components/admin/InvoiceTable.tsx` (NOVO)
- `components/admin/CreateInvoiceDialog.tsx` (NOVO)
- `components/admin/FinancialCards.tsx` (NOVO)
- `components/admin/AssignPlanDialog.tsx` (NOVO)
- `components/admin/TicketList.tsx` (NOVO)
- `components/admin/TicketChat.tsx` (NOVO)
- `components/admin/AuditLogTable.tsx` (NOVO)
- `components/sidebar-nav.ts` (EDITAR — adicionar Suporte para MANAGER)

### Fase 3 (10 arquivos + migration)
- `prisma/schema.prisma` (EDITAR — Webhook)
- `app/super-admin/webhooks/page.tsx` (NOVO)
- `app/super-admin/configuracoes/page.tsx` (REESCREVER)
- `app/super-admin/feedback/page.tsx` (NOVO — mover feedback existente)
- `app/actions/webhooks.ts` (NOVO)
- `lib/webhooks.ts` (REESCREVER — implementar dispatch real)
- `components/admin/WebhookTable.tsx` (NOVO)
- `components/admin/CreateWebhookDialog.tsx` (NOVO)
- `components/admin/TenantAnalyticsDashboard.tsx` (NOVO)
- `components/admin/PlanDefinitions.tsx` (NOVO)

**Total**: ~38 arquivos, 3 migrations, 5 novos models
