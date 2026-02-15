# 🧪 GUIA DE TESTE - VÍNCULOS PROFESSOR-TURMA (V4.1)

**Data:** 2026-02-15
**Objetivo:** Validar funcionalidade de isolamento de dados por turma

---

## 📋 PRÉ-REQUISITOS

Antes de executar o teste, certifique-se de que:

- [x] Prisma Client está gerado (`npx prisma generate`)
- [x] Banco de dados está acessível
- [x] Você tem acesso ao Supabase
- [x] Sistema possui pelo menos 1 tenant e 20 alunos

---

## 🚀 PASSO 1: EXECUTAR SCRIPT DE SEED

### Comando:

```bash
node scripts/seed-test-v41.js
```

### O que o script faz:

1. ✅ Busca o tenant automaticamente
2. ✅ Busca ou cria um professor de teste
3. ✅ Cria 2 turmas:
   - **9º Ano A** (Manhã)
   - **1º Ano EM** (Tarde)
4. ✅ Distribui 20 alunos equilibradamente (10 em cada turma)
5. ✅ Cria vínculos na tabela `teacher_classrooms`
6. ✅ Valida o cenário criado

### Saída Esperada:

```
🎯 INICIANDO SEED DE TESTE - VÍNCULOS PROFESSOR-TURMA
================================================================================

📋 1. BUSCANDO TENANT...
   ✅ Tenant encontrado: [Nome da Escola] ([tenant-id])

👨‍🏫 2. BUSCANDO PROFESSOR...
   ✅ Professor encontrado: [Nome] ([email])

🏫 3. CRIANDO/BUSCANDO TURMAS...
   ✅ Turma criada: 9º Ano A
   ✅ Turma criada: 1º Ano EM

👥 4. DISTRIBUINDO ALUNOS...
   📊 Total de alunos encontrados: 20
   ✅ 10 alunos vinculados à turma "9º Ano A"
   ✅ 10 alunos vinculados à turma "1º Ano EM"

🔗 5. CRIANDO VÍNCULOS PROFESSOR-TURMA...
   ✅ Professor vinculado a "9º Ano A"
   ✅ Professor vinculado a "1º Ano EM"

✅ 6. VALIDAÇÃO DO CENÁRIO...
================================================================================

📊 RESUMO DO CENÁRIO DE TESTE:
--------------------------------------------------------------------------------
  Tenant:             [Nome da Escola]
  Professor:          Professor Teste Silva (professor.teste@escola.com)
  Turma 1:            9º Ano A → 10 alunos
  Turma 2:            1º Ano EM → 10 alunos
  Vínculos criados:   2

  Turmas vinculadas ao professor:
    - 9º Ano A
    - 1º Ano EM

================================================================================
✅ SEED DE TESTE CONCLUÍDO COM SUCESSO!
```

---

## 🧪 PASSO 2: TESTES FUNCIONAIS

### 2.1 Login como Professor

**Credenciais:**
- Email: `professor.teste@escola.com`
- Senha: (a senha padrão configurada no sistema ou redefina se necessário)

**Como resetar senha (se necessário):**
```sql
-- Via Supabase SQL Editor
UPDATE users 
SET password = crypt('senha123', gen_salt('bf')) 
WHERE email = 'professor.teste@escola.com';
```

### 2.2 Navegação Básica

1. Após login, navegue para: **`/turma`**
2. Observe o dropdown de seleção de turmas

**✅ Resultado Esperado:**
- Dropdown mostra **APENAS 2 turmas**:
  - 9º Ano A
  - 1º Ano EM
- Nenhuma outra turma aparece

### 2.3 Visualização de Alunos - Turma 1

1. Selecione **"9º Ano A"** no dropdown
2. Observe a lista de alunos

**✅ Resultado Esperado:**
- Exibe exatamente **10 alunos**
- Todos os alunos pertencem à turma 9º Ano A

### 2.4 Visualização de Alunos - Turma 2

1. Selecione **"1º Ano EM"** no dropdown
2. Observe a lista de alunos

**✅ Resultado Esperado:**
- Exibe exatamente **10 alunos diferentes**
- Todos os alunos pertencem à turma 1º Ano EM

### 2.5 Total de Alunos Acessíveis

**✅ Resultado Esperado:**
- Professor tem acesso a **20 alunos no total** (10 + 10)
- Professor NÃO vê alunos de outras turmas (se existirem)

---

## 🔒 PASSO 3: TESTES DE SEGURANÇA

### 3.1 Criar Turma Não Vinculada

**Via Gestor (MANAGER/ADMIN):**

1. Login como MANAGER
2. Criar uma 3ª turma: **"2º Ano EM"**
3. Adicionar 3-5 alunos de teste nesta turma
4. **NÃO vincular** ao professor de teste

### 3.2 Tentativa de Acesso Não Autorizado

**Como Professor:**

1. Anotar o `classroomId` da turma "2º Ano EM"
2. Tentar acessar via URL:
   ```
   /turma?classroomId=[id-da-turma-2-ano-em]
   ```

**✅ Resultado Esperado:**
- ❌ Acesso **NEGADO**
- Redirecionamento automático para `/turma`
- Professor é redirecionado para uma turma vinculada
- **NÃO consegue ver** os alunos da turma 2º Ano EM

**❌ Resultado NÃO Esperado (Vulnerabilidade):**
- Se o professor conseguir ver os alunos → **BUG CRÍTICO**

### 3.3 Teste de Triagem

1. Navegue para `/turma/triagem`
2. Observe a lista de alunos para triagem

**✅ Resultado Esperado:**
- Lista mostra **APENAS os 20 alunos** das 2 turmas vinculadas
- Alunos da turma não vinculada (2º Ano EM) **NÃO aparecem**

---

## 🎯 PASSO 4: TESTES DE GESTÃO

### 4.1 Gerenciar Vínculos (Como MANAGER)

1. Login como MANAGER/ADMIN
2. Navegar para `/gestao/equipe`
3. Localizar o professor de teste na tabela
4. Clicar no botão **"🎓 Turmas (2)"**

**✅ Resultado Esperado:**
- Modal abre mostrando todas as turmas
- Turmas "9º Ano A" e "1º Ano EM" estão **marcadas** ✅
- Turma "2º Ano EM" está **desmarcada** ❌

### 4.2 Remover Vínculo

1. No modal, **desmarcar** "1º Ano EM"
2. Clicar em "Salvar Vínculos"
3. Aguardar toast de sucesso

**Voltar como Professor:**

4. Logout e login como professor
5. Navegar para `/turma`

**✅ Resultado Esperado:**
- Dropdown agora mostra **APENAS 1 turma**: "9º Ano A"
- Acesso a **10 alunos** (perdeu acesso aos 10 da turma removida)

### 4.3 Adicionar Novo Vínculo

**Como MANAGER:**

1. Voltar ao modal de vínculos
2. Marcar "2º Ano EM" (a turma antes não vinculada)
3. Salvar

**Como Professor:**

4. Fazer refresh ou navegar para `/turma`

**✅ Resultado Esperado:**
- Dropdown agora mostra "9º Ano A" E "2º Ano EM"
- Professor agora **TEM acesso** aos alunos de 2º Ano EM

---

## 📊 PASSO 5: VALIDAÇÃO NO BANCO

### Query SQL para Validar Vínculos:

```sql
SELECT 
    u.name AS professor,
    u.email,
    c.name AS turma,
    c.grade,
    (SELECT COUNT(*) FROM students WHERE classroomId = c.id) AS total_alunos
FROM teacher_classrooms tc
JOIN users u ON tc.teacherId = u.id
JOIN classrooms c ON tc.classroomId = c.id
WHERE u.role = 'TEACHER'
ORDER BY u.name, c.name;
```

**Saída Esperada (após seed):**

| professor | email | turma | grade | total_alunos |
|-----------|-------|-------|-------|--------------|
| Professor Teste Silva | professor.teste@escola.com | 1º Ano EM | ANO_1_EM | 10 |
| Professor Teste Silva | professor.teste@escola.com | 9º Ano A | ANO_1_EM | 10 |

---

## ✅ CHECKLIST DE VALIDAÇÃO

Marque cada item após validar:

### Funcionalidade Básica:
- [ ] Script de seed executa sem erros
- [ ] 2 turmas criadas
- [ ] 20 alunos distribuídos (10 + 10)
- [ ] 2 vínculos criados na tabela teacher_classrooms

### Acesso do Professor:
- [ ] Login como professor funciona
- [ ] Dropdown mostra APENAS turmas vinculadas
- [ ] Seleção de turma 1 mostra 10 alunos corretos
- [ ] Seleção de turma 2 mostra 10 alunos corretos
- [ ] Total de 20 alunos acessíveis

### Segurança:
- [ ] Professor NÃO vê turmas não vinculadas no dropdown
- [ ] Tentativa de acesso via URL redireciona
- [ ] Triagem mostra APENAS alunos das turmas vinculadas
- [ ] Não há vazamento de dados entre professores

### Gestão de Vínculos:
- [ ] MANAGER pode ver botão "🎓 Turmas (N)"
- [ ] Modal de vínculos abre corretamente
- [ ] Marcar/desmarcar turmas funciona
- [ ] Salvar vínculos persiste no banco
- [ ] Mudanças refletem imediatamente no acesso do professor

### Performance:
- [ ] Queries são rápidas (< 500ms)
- [ ] Não há N+1 queries visíveis
- [ ] Interface responde sem lag

---

## 🐛 PROBLEMAS CONHECIDOS

### Problema 1: "Email já existe"
**Sintoma:** Script falha ao criar professor de teste  
**Solução:** Professor já existe, o script vai reutilizá-lo automaticamente

### Problema 2: "Turmas já existem"
**Sintoma:** Script avisa que turmas já foram criadas  
**Solução:** Comportamento esperado! Script é idempotente

### Problema 3: Alunos desbalanceados
**Sintoma:** Uma turma tem mais alunos que outra  
**Solução:** Esperado se número de alunos for ímpar (ex: 21 → 11 + 10)

---

## 🎉 CRITÉRIOS DE SUCESSO

### ✅ Teste APROVADO se:

1. ✅ Professor vê APENAS turmas vinculadas
2. ✅ Tentativa de bypass redireciona automaticamente
3. ✅ MANAGER consegue gerenciar vínculos via UI
4. ✅ Mudanças de vínculos refletem imediatamente
5. ✅ Sem vazamento de dados entre professores
6. ✅ TypeScript compila sem erros
7. ✅ Sem erros no console do navegador

### ❌ Teste FALHOU se:

1. ❌ Professor vê turmas não vinculadas
2. ❌ Consegue acessar alunos via URL manipulation
3. ❌ Vínculos não persistem no banco
4. ❌ Erros de TypeScript ou runtime
5. ❌ UI trava ou não responde

---

## 📝 LIMPEZA (Opcional)

Para limpar o cenário de teste e começar novamente:

```sql
-- Deletar vínculos de teste
DELETE FROM teacher_classrooms 
WHERE teacherId IN (
    SELECT id FROM users WHERE email = 'professor.teste@escola.com'
);

-- Remover alunos das turmas de teste
UPDATE students 
SET classroomId = NULL 
WHERE classroomId IN (
    SELECT id FROM classrooms WHERE name IN ('9º Ano A', '1º Ano EM')
);

-- Deletar turmas de teste
DELETE FROM classrooms 
WHERE name IN ('9º Ano A', '1º Ano EM');

-- (Opcional) Deletar professor de teste
DELETE FROM users WHERE email = 'professor.teste@escola.com';
```

---

## 📞 SUPORTE

Se encontrar problemas, verifique:

1. Logs do servidor Next.js
2. Console do navegador (F12)
3. Queries no Supabase Dashboard
4. Tabela `teacher_classrooms` no banco

**Documentação relacionada:**
- `docs/TEACHER_CLASSROOM_IMPLEMENTATION.md`
- `docs/SECURITY_AUDIT_REPORT.md`
- `docs/DATABASE_AUDIT_REPORT.md`

---

**Developed by:** Database & Security Engineering Team  
**Version:** 1.0.0  
**Last Updated:** 2026-02-15
