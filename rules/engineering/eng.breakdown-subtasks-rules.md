---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Regras do Workflow Breakdown Subtasks

## Propósito

O workflow `breakdown-subtasks` tem como objetivo **quebrar uma Tech Spec em subtarefas que sejam entregáveis completos e independentes** (fatias verticais), cada uma detalhada o suficiente para que um desenvolvedor júnior execute sem perguntar nada.

---

## ⚠️ REGRA INVIOLÁVEL: PRINCÍPIO DE INDEPENDÊNCIA

> **Cada subtarefa é uma unidade de entrega completa e independente.**
> Cada subtarefa será um card no `$TASK_MANAGER` com **sua própria branch, seu próprio commit e seu próprio deploy**.
> Por isso, a subtarefa precisa ser **mergeável isoladamente sem quebrar o sistema**.

**Toda subtarefa deve ser uma fatia vertical completa (vertical slice):**

- ✅ Atravessa todas as camadas técnicas necessárias (DB, backend, frontend, testes — tudo que for preciso para a entrega ficar de pé)
- ✅ Implementa um fluxo end-to-end mínimo funcional, não um componente técnico isolado
- ✅ Quando mergeada sozinha, a aplicação continua funcionando
- ✅ A entrega é observável: testável, demonstrável ou verificável

### Teste de Validação (obrigatório para cada subtarefa)

Responda **sim** para as três perguntas. Se qualquer uma for **não** → reagrupar com a próxima subtarefa até formar uma fatia vertical completa.

1. **Posso fazer merge desta branch sem quebrar o sistema?**
2. **Posso testar/demonstrar esta entrega sem depender das próximas subtarefas?**
3. **Esta subtarefa entrega valor observável (endpoint funcionando, modal usável, tela navegável)?**

### Exemplos Canônicos

| ❌ Fatia horizontal (PROIBIDA) | ✅ Fatia vertical (OBRIGATÓRIA) |
|---|---|
| Subtask só para editar um enum | Subtask que implementa o endpoint X inteiro — use-case + factory + enum + repository + contratos + testes |
| Subtask só para criar um repository | Subtask que implementa outro endpoint Y completo com a mesma estrutura |
| Subtask só para construir um use-case | Subtask que edita um endpoint existente (+ estrutura associada na aplicação) |
| Subtask só para construir a factory do use-case | Subtask que implementa um modal inteiro no frontend (componente + estado + integração + estilos + testes) |
| Subtask só para criar um DTO | Subtask que altera uma tela inteira no frontend |

---

## ⚠️ REGRA CRÍTICA: DETALHAMENTO EXTREMO

> **Cada subtarefa deve ser um TUTORIAL PASSO-A-PASSO COMPLETO**
>
> Se um dev júnior não conseguir implementar seguindo sua description, ela está RUIM.

O princípio de independência define **o escopo** de cada subtarefa; o detalhamento extremo define **como ela é descrita**. Os dois se somam — um sem o outro não resolve.

**O texto deve responder:**

- ✅ Exatamente O QUE fazer (descrição em 2-3 frases)
- ✅ POR QUÊ fazer (contexto de negócio/técnico)
- ✅ ONDE fazer (arquivos específicos)
- ✅ COMO fazer (código COMPLETO + explicação linha a linha)
- ✅ COMO TESTAR (cenários com input/output)
- ✅ COMO VERIFICAR (checklist acionável)

---

## Princípios Fundamentais

### 1. Granularidade Obrigatória

**Tempo por subtarefa: mínimo 4h, máximo 1 dia de trabalho**

A granularidade é guiada **primeiro pela independência (fatia vertical completa)** e só depois pelo tempo. Tempo é um sanity check — independência é lei.

Regras de divisão:

- Se a subtarefa não passa no **Teste de Validação** acima → reagrupar com a próxima até formar uma fatia vertical
- Se o entregável completo leva > 1 dia → dividir em **duas entregas verticais independentes** (ex: dois endpoints distintos, não "camada de dados" vs "camada de API")
- Se a subtarefa cabe em menos de 4h → sinal forte de **fatia horizontal atômica** (enum isolado, DTO isolado, factory isolada) → **agrupar obrigatoriamente** com a próxima até ultrapassar 4h formando uma fatia vertical

**Exemplo:**

- ❌ "[BACKEND] Implementar sistema de pagamento inteiro" — MUITO grande (múltiplos endpoints = múltiplos entregáveis)
- ❌ "[BACKEND] Criar schema de validação Stripe" + "[BACKEND] Implementar endpoint POST /api/payment/create" + "[QA] Testes" — fatiamento horizontal PROIBIDO (cada peça sozinha não entrega valor)
- ✅ "[BACKEND] Implementar endpoint POST /api/payment/create (schema + validação + use-case + repository + testes)" + "[BACKEND] Implementar endpoint POST /api/payment/refund (mesma estrutura)"

### 2. Ordem Lógica de Implementação (não separação por camada)

Quando múltiplas subtarefas irmãs existem, sugira a **ordem lógica** de implementação abaixo. **Essa ordem não separa cada subtarefa em uma camada diferente** — uma única subtarefa pode (e geralmente precisa) tocar várias camadas ao mesmo tempo.

1. **[DATA]** — Subtarefas cujo entregável predominante é dado persistido (ex: nova tabela + migration + seed que já é útil por si só)
2. **[BACKEND]** — Endpoints/workers completos (incluindo migration, schema, DTO, use-case, factory, repository, controller e testes na mesma subtarefa)
3. **[FRONTEND]** — Telas, modais ou fluxos completos (incluindo tipos, hooks, integração com API, componentes e testes na mesma subtarefa)
4. **[QA]** — Testes de integração/E2E que cruzam fronteiras de várias subtarefas já entregues

> ⚠️ **Atenção**: as subtarefas `[BACKEND]` e `[FRONTEND]` **não são "uma para cada camada"**. O prefixo indica a stack **predominante** do entregável, mas o escopo inclui tudo que for necessário para a fatia ficar de pé.

### 3. Prefixos de Stack (OBRIGATÓRIO)

**CADA título deve começar com um prefixo indicando a stack PREDOMINANTE do entregável** (não a única camada tocada):

| Prefixo          | Owner              | Uso                                                                                              |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `[DATA]`         | Dev (back)         | Entregáveis cujo valor principal é dado estruturado (migrations + seeds de referência úteis)     |
| `[BACKEND]`      | Dev (back)         | Endpoint, worker ou job completo (inclui migration, schema, DTO, use-case, factory, repo, testes unitários) |
| `[FRONTEND]`     | Dev (front)        | Tela, modal ou fluxo UI completo (inclui tipos, hooks, integração, componente, estilos, testes unitários)   |
| `[QA-BACKEND]`   | Dev (back)         | Testes de integração ou contrato específicos do backend que extrapolam o escopo de uma única subtarefa `[BACKEND]` |
| `[QA-FRONTEND]`  | Dev (front)        | Testes de componente ou fluxo UI específicos do frontend que extrapolam o escopo de uma única subtarefa `[FRONTEND]` |
| `[QA]`           | QA Engineer        | Testes E2E e de integração que cruzam fronteiras de múltiplas subtarefas já mergeadas — exclusivo para QA Engineer |
| `[INFRA]`        | Dev / DevOps       | Mudança completa de pipeline, config de ambiente ou deployment                                    |
| `[DOCS]`         | Autor da entrega   | Documentação independente (não parte de uma subtarefa de código)                                  |

---

## ⚠️ REGRA DE OWNERSHIP DE QA

> **Testes são responsabilidade de quem entregou o código — salvo quando cruzam fronteiras.**

Ao gerar subtarefas com escopo de QA/testes, aplique a seguinte divisão **obrigatória**:

| Escopo do teste | Prefixo correto | Owner |
|---|---|---|
| Testes unitários de um endpoint/worker | Incluir dentro do próprio `[BACKEND]` | Dev de back |
| Testes unitários de um componente/tela | Incluir dentro do próprio `[FRONTEND]` | Dev de front |
| Testes de integração ou contrato apenas do backend (multi-subtarefa) | `[QA-BACKEND]` | Dev de back |
| Testes de componente ou fluxo apenas do frontend (multi-subtarefa) | `[QA-FRONTEND]` | Dev de front |
| Testes E2E ou integração que cruzam backend + frontend (multi-subtarefa) | `[QA]` | QA Engineer |

**Regras práticas:**

- ✅ Testes unitários **nunca** viram subtarefa separada — ficam dentro da subtarefa de código correspondente
- ✅ `[QA-BACKEND]` e `[QA-FRONTEND]` só existem quando o escopo de validação **ultrapassa** uma única subtarefa de código (ex: validar que dois endpoints novos interagem corretamente)
- ✅ `[QA]` é exclusivo do **QA Engineer** e cobre apenas cenários que cruzam frontend + backend + dados ao mesmo tempo
- ❌ Nunca criar um `[QA]` para testar algo que é responsabilidade exclusiva do dev (ex: `[QA] Testar endpoint POST /users` — isso é `[BACKEND]` com testes incluídos)

**Exemplos:**

```
❌ ERRADO
[BACKEND] Criar endpoint POST /api/payments/create
[QA] Testar endpoint POST /api/payments/create   ← errado: teste de backend vira [BACKEND]

✅ CORRETO
[BACKEND] Criar endpoint POST /api/payments/create  ← inclui os testes unitários do endpoint

[BACKEND] Criar endpoint POST /api/payments/create
[BACKEND] Criar endpoint POST /api/payments/refund
[QA-BACKEND] Validar integração entre /create e /refund  ← só se necessário testar os dois juntos

[BACKEND] Criar endpoint POST /api/payments/create
[FRONTEND] Criar modal de pagamento
[QA] Fluxo E2E de pagamento completo (do modal ao banco)  ← QA Engineer, cruza fronteiras
```

---

## Estrutura de Subtarefa

**TODAS as subtarefas DEVEM seguir este template EXATAMENTE:**

```markdown
## 🎯 O Que Você Vai Fazer

{Descrição em 2-3 frases do objetivo final. O que o dev terá ao finalizar?}

---

## 📋 Contexto da Tarefa

### Por que isso é necessário?

{Explique o motivo de negócio ou técnico}

### Onde isso se encaixa?

{Como se conecta com outras subtarefas e a feature final}

### Pré-requisitos

- [ ] {Subtarefa anterior, se houver}
- [ ] {Ambiente/config, se necessário}

---

## 🛠️ Stack Técnico

| Tecnologia | Versão | Para que |
| ---------- | ------ | -------- |
| {Tech 1}   | {ver}  | {uso}    |

### Padrões do Projeto a Seguir

- **Nomenclatura**: {padrão específico do projeto}
- **Estrutura**: {organização de pastas}
- **Convenções**: {eslint, prettier, etc}

### Arquivos de Referência (COPIE O PADRÃO)

- `{caminho/arquivo.ts}` - Use como base para {o quê}

---

## 📁 Arquivos a Criar/Modificar

| Arquivo  | Ação                     | Descrição   |
| -------- | ------------------------ | ----------- |
| `{path}` | 🆕 Criar ou ✏️ Modificar | {O que faz} |

---

## 👣 Passo a Passo de Implementação

### Passo 1: {Título descritivo}

**O que fazer:**
{Explicação detalhada}

**Código:**

\`\`\`{language}
// {caminho/do/arquivo.ts}

{CÓDIGO COMPLETO - NÃO use "..." ou placeholder}
\`\`\`

**Explicação do código:**

- Linha X: {explica o que faz e por quê}
- Linha Y: {explica o que faz e por quê}

**Validação deste passo:**

- [ ] {Como verificar}

---

### Passo 2: ...

{Continuar com mais passos}

---

## 🧪 Testes Obrigatórios

**Arquivo: `{caminho/arquivo.spec.ts}`**

\`\`\`{language}
// {CÓDIGO DE TESTE COMPLETO}
\`\`\`

### Cenários a Testar

| Cenário  | Input            | Output          | ✓   |
| -------- | ---------------- | --------------- | --- |
| {caso 1} | {input}          | {output}        | [ ] |
| {erro 1} | {input inválido} | {erro esperado} | [ ] |

### Como Executar

\`\`\`bash
{comando específico para testar esta subtarefa}
\`\`\`

---

## ✅ Checklist de Conclusão

### Implementação

- [ ] Código implementado conforme os passos
- [ ] Sem `console.log` de debug
- [ ] Sem `TODO` ou `FIXME` sem issue
- [ ] Imports organizados
- [ ] Tipagem TypeScript completa (sem `any`)

### Qualidade

- [ ] Testes passando
- [ ] Linter sem erros (`npm run lint`)
- [ ] Build sem erros (`npm run build`)

### Documentação

- [ ] Comentários em código complexo
- [ ] JSDoc em funções públicas
- [ ] README atualizado (se necessário)

---

## ⚠️ Riscos e Cuidados

| Risco     | Como Evitar |
| --------- | ----------- |
| {risco 1} | {mitigação} |

### ❌ Não Faça Isso

- ❌ {Erro comum 1 e por que é errado}

### 💡 Dicas

- 💡 {Dica útil}

---

## 🔗 Dependências

### Esta subtarefa depende de:

- `[{STACK}] {Nome da subtarefa anterior}` - {O que precisa estar pronto}

### Desbloqueia:

- `[{STACK}] {Nome da próxima subtarefa}` - {O que será desbloqueado}

### Pode ser feita em paralelo com:

- `[{STACK}] {Nome de subtarefa paralela}` - {Por que não há dependência}

---

## 📚 Referências

### Documentação Oficial

- [{Nome da doc}]({link}) - {Para que usar}

### Arquivos de Exemplo

- `{caminho/arquivo-exemplo.ts}` - {O que copiar daqui}

### Tech Spec Relacionada

- Seção {X.Y}: {descrição}

---

## 🆘 Precisa de Ajuda?

1. **Revise os arquivos de referência** listados acima
2. **Consulte a Tech Spec** seção relevante
3. **Pergunte no Slack** canal #{canal}
4. **Documentação**: {links úteis}
```

---

## Regras de Qualidade CRÍTICAS

### ✅ Uma subtarefa BEM mastigada tem

| Característica               | Descrição                         | BOM                                                 | RUIM                             |
| ---------------------------- | --------------------------------- | --------------------------------------------------- | -------------------------------- |
| **Título específico**        | Descreve exatamente o que fazer   | "[BACKEND] Criar endpoint POST /api/users/register" | "[BACKEND] Criar API de usuário" |
| **Código COMPLETO**          | TODO o código, sem "..."          | Código com imports, função, tipos                   | "Implemente a função X"          |
| **Explicação linha a linha** | Explica POR QUÊ existe            | "bcrypt.hash com salt 10 para..."                   | Código sem explicação            |
| **Cenários de teste**        | TODOS os casos                    | Tabela input/output                                 | "Escreva testes"                 |
| **Referências concretas**    | Aponta arquivos reais para copiar | "Copie user.controller.ts"                          | "Siga o padrão"                  |
| **Checklist verificável**    | Itens específicos                 | "Linter sem erros: npm run lint"                    | "Código limpo"                   |

### ❌ REJEITE subtarefas que

- Sejam **fatias horizontais** (só enum, só repository, só factory, só DTO, só contratos/interfaces sem implementação funcional)
- **Não passem no Teste de Validação de independência** (não mergeáveis isoladamente sem quebrar o sistema)
- Usem termos vagos: "implementar", "criar" sem detalhes
- Não tenham código de exemplo
- Não listem arquivos específicos
- Não expliquem o contexto e o porquê
- Assumam conhecimento que o dev pode não ter
- Usem "..." ou "// rest of code"
- Caibam em **menos de 4h** — é sinal forte de fatia horizontal atômica; agrupar com a próxima subtarefa
- Excedam 1 dia de trabalho (nesse caso, dividir em **duas fatias verticais independentes**, nunca em fatias horizontais)

---

## Formato de Saída: JSON

### Estrutura Obrigatória

```json
{
  "subtasks": [
    {
      "summary": "[STACK] Título específico da subtarefa",
      "description": "Template completo com:\n\n## 🎯 O Que Você Vai Fazer\n\n... (resto conforme template acima)"
    },
    {
      "summary": "[STACK] Próxima subtarefa",
      "description": "..."
    }
  ]
}
```

### Regras CRÍTICAS para o JSON

1. **APENAS JSON** - Sem texto antes ou depois
2. **Use `\n` para quebras de linha** dentro das strings
3. **Escape aspas com `\"`** dentro das strings
4. **Todos os títulos com [STACK]** - Obrigatório
5. **Description ULTRA DETALHADA** - Siga o template COMPLETAMENTE
6. **Código COMPLETO** - Não use "..." ou placeholder
7. **Caminhos reais** - Use paths que existem no projeto
8. **Valide JSON** - Antes de retornar

---

## Mapeamento de Dependências

### Padrão de Dependência (fatias verticais, não camadas)

Cada nó abaixo é uma subtarefa **completa e independente** — endpoint inteiro, modal inteiro, tela inteira. As setas indicam dependência real de dados/contratos entre entregáveis, não split por camada.

```
[BACKEND] Endpoint POST /X (migration + use-case + factory + repo + testes)
  ↓ (fornece contrato de API)
[FRONTEND] Modal de criação de X (componente + integração + testes)

[BACKEND] Endpoint GET /Y (fatia vertical completa)   ←── pode rodar em paralelo
[FRONTEND] Tela de listagem de Y (fatia vertical)     ←── pode rodar em paralelo
```

> ⚠️ Se você está montando uma cadeia do tipo `[DATA] tabela → [BACKEND] DTO → [BACKEND] repository → [BACKEND] use-case → [BACKEND] controller`, **pare**: isso é fatia horizontal. Reagrupe tudo em uma única subtarefa `[BACKEND] Endpoint POST /X`.

### Como Documentar

Cada subtarefa deve ter seção "🔗 Dependências" indicando:

- ✅ **Depende de**: qual subtarefa precisa estar pronta (ex: endpoint pronto antes da tela que o consome)
- ✅ **Desbloqueia**: qual subtarefa será desbloqueada
- ✅ **Paralela com**: qual pode ser feita simultaneamente (geralmente outro entregável vertical independente)

---

## Checklist de Qualidade Final

Antes de retornar o JSON, valide CADA subtarefa:

### ✅ Completude

- [ ] Cobre TODAS as partes da Tech Spec
- [ ] Setup, implementação, testes incluídos
- [ ] Cada subtarefa é um "tutorial completo"

### ✅ Granularidade

- [ ] TODAS as subtarefas têm entre 4h e 1 dia de trabalho
- [ ] Subtarefas são autocontidas
- [ ] Nenhuma é vaga

### ✅ Independência (fatia vertical)

- [ ] Cada subtarefa, mergeada isoladamente, deixa a aplicação funcionando
- [ ] A entrega de cada subtarefa é observável (testável ou demonstrável)
- [ ] Nenhuma subtarefa é apenas contrato, interface, tipo, enum ou repository isolado
- [ ] Cadeia `[DATA] → [BACKEND] DTO → [BACKEND] repo → [BACKEND] use-case` foi consolidada em UMA subtarefa por endpoint

### ✅ Ownership de QA

- [ ] Testes unitários de backend estão dentro do próprio `[BACKEND]` — não viraram `[QA]` separado
- [ ] Testes unitários de frontend estão dentro do próprio `[FRONTEND]` — não viraram `[QA]` separado
- [ ] Subtarefas `[QA-BACKEND]` existem **apenas** quando o escopo ultrapassa uma única subtarefa de backend
- [ ] Subtarefas `[QA-FRONTEND]` existem **apenas** quando o escopo ultrapassa uma única subtarefa de frontend
- [ ] Subtarefas `[QA]` são exclusivamente E2E ou integração cruzando backend + frontend — ownership do QA Engineer

### ✅ Detalhamento

- [ ] Código COMPLETO em cada passo
- [ ] Explicações de código
- [ ] Arquivos específicos listados
- [ ] Cenários de teste com input/output
- [ ] Checklist verificável

### ✅ Dependências

- [ ] Ordem de execução clara
- [ ] Dependências mapeadas
- [ ] Paralelas identificadas

### ✅ Validação

- [ ] JSON é válido
- [ ] Nenhuma subtarefa vaga
- [ ] Toda subtarefa tem ≥ 4h e ≤ 1 dia de trabalho
- [ ] Nenhuma fatia horizontal (split por camada)
- [ ] Todas passam no Teste de Validação de independência
- [ ] Todos os títulos com [STACK]
- [ ] Nenhum "..."

---

## Integração com Outros Workflows

### Entrada (de onde vem)

```
eng.build-tech-spec → tech-spec.md → eng.breakdown-subtasks
```

### Saída (para onde vai)

```
eng.breakdown-subtasks → subtasks JSON → Jira
```

### Relação com Outros Workflows

| Workflow             | Relação                            |
| -------------------- | ---------------------------------- |
| `build-tech-spec`    | Cria a Tech Spec que será quebrada |
| `breakdown-subtasks` | Quebra em subtarefas executáveis   |
| `start`              | Cria a architecture.md             |
| `plan`               | Usa as fases (não as subtarefas)   |

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Fatia horizontal (split por camada)** — o erro mais comum
   - ❌ `[DATA] Criar migration users` + `[BACKEND] Criar DTO` + `[BACKEND] Criar repository` + `[BACKEND] Criar use-case` + `[BACKEND] Criar controller` (5 cards, nenhum entrega valor sozinho)
   - ❌ `[BACKEND] Adicionar valor ao enum StatusPagamento`
   - ❌ `[BACKEND] Criar factory do use-case X`
   - ✅ `[BACKEND] Criar endpoint POST /api/payments/create` — uma subtarefa contendo migration + DTO + repository + use-case + factory + controller + enum + testes

2. **Subtarefa muito grande (múltiplos entregáveis juntos)**
   - ❌ "[BACKEND] Implementar todo o sistema de pagamento" (múltiplos endpoints = múltiplos entregáveis)
   - ✅ "[BACKEND] Endpoint POST /api/payment/create" + "[BACKEND] Endpoint POST /api/payment/refund" (duas fatias verticais independentes)

3. **Título vago**
   - ❌ "[BACKEND] Implementar feature"
   - ✅ "[BACKEND] Criar endpoint POST /api/payment/process"

4. **Sem código de exemplo**
   - ❌ "Crie um serviço para..."
   - ✅ Código COMPLETO com imports, tipos, implementação

5. **Sem arquivos específicos**
   - ❌ "Siga o padrão do projeto"
   - ✅ "Copie a estrutura de `src/services/user.service.ts`"

6. **Sem checklist**
   - ❌ "Código pronto"
   - ✅ Lista verificável de itens

---

## Exemplo de Subtarefa BEM FEITA vs MAL FEITA

### ❌ MAL FEITA

```json
{
  "summary": "[BACKEND] Criar autenticação",
  "description": "Implementar o sistema de autenticação com JWT.\n\nFaça: Login, registro e validação.\n\nUse bcrypt para senha e JWT para token.\n\nRetorne o usuário no login."
}
```

**Problemas:**

- Título vago
- Sem detalhamento
- Sem código
- Sem arquivos específicos
- Sem testes

### ✅ BEM FEITA

````json
{
  "summary": "[BACKEND] Criar endpoint POST /api/auth/register com validação",
  "description": "## 🎯 O Que Você Vai Fazer\n\nCriar o endpoint de registro que recebe email/senha, valida dados, cria usuário no banco e retorna JWT.\n\n---\n\n## 📋 Contexto\n\n### Por que?\nSistema precisa permitir novos usuários se cadastrem.\n\n### Pré-requisitos\n- [ ] Migration de usuários ([DATA] Criar migration tabela users)\n\n---\n\n## 🛠️ Stack\n\n| Tech | Versão | Para |\n|------|--------|------|\n| Express | 4.18+ | Framework HTTP |\n| bcrypt | 5.1+ | Hash de senha |\n| JWT | 9.0+ | Tokens |\n\n---\n\n## 📁 Arquivos\n\n| Arquivo | Ação | Descrição |\n|---------|------|--------|\n| `src/controllers/auth.controller.ts` | 🆕 | Controlador |\n| `src/services/auth.service.ts` | 🆕 | Lógica de negócio |\n| `src/routes/auth.ts` | 🆕 | Rotas |\n| `src/__tests__/auth.spec.ts` | 🆕 | Testes |\n\n---\n\n## 👣 Passos\n\n### Passo 1: Criar schema de validação\n\n```typescript\n// src/schemas/auth.schema.ts\nimport { body } from 'express-validator';\n\nexport const registerSchema = [\n  body('email')\n    .isEmail()\n    .withMessage('Email inválido')\n    .normalizeEmail(),\n  body('password')\n    .isLength({ min: 8 })\n    .withMessage('Mínimo 8 caracteres')\n    .matches(/[A-Z]/)\n    .withMessage('Precisa letra maiúscula'),\n];\n```\n\n**Explicação:**\n- `isEmail()`: Valida formato\n- `normalizeEmail()`: Padroniza\n- `matches(/[A-Z]/)`: Regex para maiúscula\n\n---\n\n### Passo 2: Criar AuthService\n\n```typescript\n// src/services/auth.service.ts\nimport bcrypt from 'bcrypt';\nimport jwt from 'jsonwebtoken';\n\nexport class AuthService {\n  async register(email: string, password: string) {\n    // Hash da senha\n    const hash = await bcrypt.hash(password, 10);\n    \n    // Criar usuário (assumindo repo existe)\n    const user = await this.userRepo.create({\n      email,\n      passwordHash: hash,\n    });\n    \n    // Gerar token\n    const token = jwt.sign(\n      { userId: user.id },\n      process.env.JWT_SECRET!,\n      { expiresIn: '24h' }\n    );\n    \n    return { user, token };\n  }\n}\n```\n\n**Explicação:**\n- `bcrypt.hash(password, 10)`: 10 salt rounds é seguro\n- `jwt.sign()`: Cria token que expira em 24h\n- Não retornamos passwordHash no response\n\n---\n\n## 🧪 Testes\n\n```typescript\n// src/__tests__/auth.spec.ts\nimport request from 'supertest';\nimport { app } from '../app';\n\ndescribe('POST /api/auth/register', () => {\n  it('deve registrar com email e senha válidos', async () => {\n    const response = await request(app)\n      .post('/api/auth/register')\n      .send({\n        email: 'test@example.com',\n        password: 'Senha123!',\n      });\n    \n    expect(response.status).toBe(201);\n    expect(response.body).toHaveProperty('token');\n  });\n  \n  it('deve retornar 400 para email inválido', async () => {\n    const response = await request(app)\n      .post('/api/auth/register')\n      .send({\n        email: 'invalid',\n        password: 'Senha123!',\n      });\n    \n    expect(response.status).toBe(400);\n  });\n});\n```\n\n### Cenários\n\n| Cenário | Input | Output |\n|---------|-------|--------|\n| Válido | email + senha válidos | 201 + token |\n| Email inválido | email sem @ | 400 VALIDATION_ERROR |\n| Senha fraca | < 8 chars | 400 VALIDATION_ERROR |\n\n---\n\n## ✅ Checklist\n\n- [ ] Schema criado\n- [ ] AuthService implementado\n- [ ] AuthController implementado\n- [ ] Rotas configuradas\n- [ ] Testes passando\n- [ ] Linter clean\n- [ ] Build ok\n\n---\n\n## ⚠️ Riscos\n\n| Risco | Como Evitar |\n|-------|-------------|\n| JWT_SECRET exposto | Usar .env, nunca commitar |\n| Senha em log | Não logar req.body |\n\n---\n\n## 🔗 Dependências\n\n**Depende de:** [DATA] Criar migration tabela users\n**Desbloqueia:** [FRONTEND] Criar tela de registro\n**Paralela com:** [INFRA] Configurar variáveis JWT\n"
}
````

**Diferenças:**

- ✅ Título específico
- ✅ Código COMPLETO
- ✅ Explicação linha a linha
- ✅ Testes com cenários
- ✅ Arquivos específicos
- ✅ Checklist verificável
- ✅ Dependências mapeadas
