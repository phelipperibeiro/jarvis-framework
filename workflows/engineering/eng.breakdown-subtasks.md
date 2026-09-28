---
description: Workflow para quebrar Tech Spec em subtarefas ULTRA DETALHADAS e executáveis
auto_execution_mode: 0
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Decomposição de tarefas requer análise detalhada, geração de código de exemplo e estruturação de subtarefas executáveis
---
# Breakdown Subtasks - Gerador de Subtarefas Mastigadas

Você receberá uma Tech Spec completa e deve quebrá-la em subtarefas **EXTREMAMENTE DETALHADAS** para o Jira.

> ⚠️ **PRINCÍPIO FUNDAMENTAL**: Cada subtarefa deve ser tão detalhada que um desenvolvedor júnior possa executá-la SEM precisar perguntar nada. A subtarefa deve ser um "tutorial passo-a-passo" completo.

<input>
#$ARGUMENTS
</input>

---

## Fase 1: Análise Profunda da Tech Spec

### 1.1 Extração de Informações

Analise a Tech Spec e extraia **TUDO**:

- **Componentes afetados**: Quais arquivos/módulos serão criados ou modificados
- **Decisões arquiteturais**: Tecnologias, padrões, convenções escolhidas
- **Escopo explícito**: O que está incluído E o que foi explicitamente excluído
- **Riscos identificados**: Pontos de atenção e possíveis bloqueios
- **Testes necessários**: Unitários, integração, E2E - com cenários específicos
- **Contratos de API**: Requests, responses, headers, status codes
- **Modelos de dados**: Schemas, validações, relacionamentos
- **Fluxos de usuário**: Jornadas, estados, transições

### 1.2 Investigação do Codebase (OBRIGATÓRIA)

**ANTES de criar subtarefas**, use as ferramentas para:

1. **Encontrar arquivos similares** - Use glob para localizar exemplos no projeto
2. **Entender padrões existentes** - Use grep para ver como funcionalidades similares foram implementadas
3. **Analisar estrutura** - Use read para entender a arquitetura dos arquivos que serão modificados
4. **Documente os achados** - Documente os padrões achados

---

## Fase 2: Estratégia de Breakdown Granular

### 2.1 Princípio de Independência (fatia vertical) — INVIOLÁVEL

> **Cada subtarefa é uma unidade de entrega independente.**
> Terá **sua própria branch, seu próprio commit e seu próprio deploy**.
> Precisa ser mergeável isoladamente sem quebrar o sistema.

Cada subtarefa deve ser uma **fatia vertical** (vertical slice) — atravessa todas as camadas necessárias (migration + DTO + enum + repository + use-case + factory + controller + testes; ou, no frontend, tipos + hooks + integração + componente + estilos + testes) e entrega um fluxo end-to-end funcional.

**Fatias horizontais são PROIBIDAS** — cards isolados só para enum, só para repository, só para factory, só para DTO, só para interfaces/contratos sem implementação funcional.

**Exemplos canônicos:**

| ❌ Fatia horizontal (PROIBIDA) | ✅ Fatia vertical (OBRIGATÓRIA) |
|---|---|
| Card só para adicionar valor em enum `StatusPagamento` | `[BACKEND] Endpoint POST /api/payments/create` — inclui migration + enum + DTO + use-case + factory + repository + controller + testes |
| Card só para criar `PaymentRepository` | `[BACKEND] Endpoint POST /api/payments/refund` — outra fatia vertical completa |
| Card só para criar factory do `CreatePaymentUseCase` | `[FRONTEND] Modal de confirmação de pagamento` — componente + estado + integração + estilos + testes |
| Cadeia `[DATA] migration → [BACKEND] DTO → [BACKEND] repo → [BACKEND] use-case → [BACKEND] controller` (5 cards) | `[BACKEND] Endpoint POST /api/X` (1 card com tudo acima) |

**Teste de Validação** (responda sim para as três — se não, reagrupe com a próxima subtarefa):

1. Posso fazer merge desta branch sem quebrar o sistema?
2. Posso testar/demonstrar esta entrega sem depender das próximas subtarefas?
3. Esta subtarefa entrega valor observável (endpoint funcionando, modal usável, tela navegável)?

**Granularidade (sanity check):**

- **Tempo**: mínimo 4h, máximo 1 dia de trabalho por subtarefa
- Se < 4h → sinal forte de fatia horizontal atômica (enum/DTO/factory isolados) → **agrupar obrigatoriamente** com a próxima
- Se > 1 dia → dividir em **duas fatias verticais independentes** (ex: dois endpoints distintos), nunca em fatias horizontais
- Se passa no Teste de Validação mas é < 30min → pode agrupar com outra fatia do mesmo contexto, desde que ainda forme UM entregável

### 2.2 Ordem Lógica de Implementação (NÃO separação por camada)

Quando múltiplas fatias verticais irmãs existem, use a ordem abaixo como **heurística de priorização** entre elas. **Esta ordem não separa cada subtarefa em uma camada** — uma única fatia vertical geralmente toca múltiplas camadas.

1. **Entregáveis `[BACKEND]`** primeiro (quando há frontend dependente)
   - Cada fatia vertical de backend inclui migration + schema + DTO + enum + use-case + factory + repository + controller + testes na MESMA subtarefa
2. **Entregáveis `[FRONTEND]`** que consomem os endpoints já prontos
   - Cada fatia vertical de frontend inclui tipos + hooks + integração + componente + estilos + testes na MESMA subtarefa
3. **Entregáveis `[DATA]`** — apenas quando o dado persistido é entregável por si só (ex: seed de referência consumido diretamente), não como pré-requisito de um endpoint
4. **Entregáveis `[QA]`** — testes E2E que cruzam múltiplas fatias já mergeadas

> ⚠️ **Não crie uma fatia `[DATA]` para a migration de um endpoint e outra fatia `[BACKEND]` para o endpoint em si.** A migration vai dentro da mesma fatia do endpoint.

### 2.3 Prefixos de Stack (OBRIGATÓRIO)

**CADA subtarefa DEVE começar com um prefixo indicando a stack PREDOMINANTE do entregável** (não a única camada tocada):

| Prefixo      | Uso                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `[DATA]`     | Entregáveis cujo valor principal é dado persistido (seeds de referência úteis por si só)        |
| `[BACKEND]`  | Endpoint, worker ou job completo — inclui migration, schema, DTO, enum, use-case, factory, repo, controller, testes |
| `[FRONTEND]` | Tela, modal ou fluxo UI completo — inclui tipos, hooks, integração, componente, estilos, testes |
| `[QA]`       | Testes de integração/E2E que cruzam múltiplas subtarefas já mergeadas                           |
| `[INFRA]`    | Mudança completa de pipeline, config de ambiente ou deployment                                  |
| `[DOCS]`     | Documentação independente (não parte de uma subtarefa de código)                                |

### 2.4 Mapeamento de Dependências

Para CADA subtarefa, identifique:

- **Bloqueia**: Quais subtarefas dependem desta
- **Depende de**: Quais subtarefas precisam estar prontas
- **Paralela com**: Quais podem ser feitas simultaneamente

---

## Fase 3: Criação de Subtarefas ULTRA DETALHADAS

### 3.1 Template de Description (SIGA EXATAMENTE)

Cada subtarefa deve ter uma description em Markdown seguindo este template:

````markdown
## 🎯 O Que Você Vai Fazer

{Descrição em 2-3 frases do objetivo final desta subtarefa. O que o desenvolvedor terá ao finalizar?}

---

## 📋 Contexto da Tarefa

### Por que isso é necessário?
{Explique o motivo de negócio ou técnico para esta subtarefa existir}

### Onde isso se encaixa?
{Explique como esta subtarefa se conecta com as outras e com a funcionalidade final}

### Pré-requisitos
- [ ] {Subtarefa anterior concluída, se houver}
- [ ] {Ambiente configurado, se necessário}
- [ ] {Acesso a recursos específicos, se necessário}

---

## 🛠️ Stack Técnico

| Tecnologia | Versão/Especificação | Para que será usada |
|------------|---------------------|---------------------|
| {Tech 1} | {versão} | {propósito} |
| {Tech 2} | {versão} | {propósito} |

### Padrões do Projeto a Seguir
- **Nomenclatura**: {padrão de nomes usado no projeto}
- **Estrutura de pastas**: {onde os arquivos devem ficar}
- **Convenções de código**: {eslint rules, prettier, etc}

### Arquivos de Referência (COPIE O PADRÃO)
- `{caminho/arquivo-similar.ts}` - Use como base para {o quê}
- `{caminho/outro-arquivo.ts}` - Copie a estrutura de {o quê}

---

## 📁 Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `{caminho/arquivo1.ts}` | 🆕 Criar | {O que este arquivo fará} |
| `{caminho/arquivo2.ts}` | ✏️ Modificar | {O que será alterado e por quê} |
| `{caminho/arquivo3.spec.ts}` | 🆕 Criar | Testes para {o quê} |

---

## 👣 Passo a Passo de Implementação

### Passo 1: {Título descritivo}

**O que fazer:**
{Explicação detalhada do que fazer neste passo}

**Código:**
```{language}
// {caminho/do/arquivo.ts}

{código completo ou estrutura esperada}
```

**Explicação do código:**
- Linha X: {explica o que faz e por quê}
- Linha Y: {explica o que faz e por quê}

**Validação deste passo:**
- [ ] {Como verificar se este passo está correto}

---

### Passo 2: {Título descritivo}

**O que fazer:**
{Explicação detalhada}

**Código:**
```{language}
// {caminho/do/arquivo.ts}

{código completo}
```

**Explicação do código:**
- {explicações linha a linha das partes importantes}

**Validação deste passo:**
- [ ] {Como verificar se está correto}

---

### Passo 3: {Continue quantos passos forem necessários}

...

---

## 🧪 Testes Obrigatórios

### Arquivo de teste: `{caminho/do/arquivo.spec.ts}`

```{language}
// {caminho/do/arquivo.spec.ts}

{código completo dos testes com todos os cenários}
```

### Cenários a Testar

| Cenário | Input | Output Esperado | Já implementado? |
|---------|-------|-----------------|------------------|
| {cenário 1} | {input} | {output} | [ ] |
| {cenário 2} | {input} | {output} | [ ] |
| {cenário de erro 1} | {input inválido} | {erro esperado} | [ ] |

### Como Executar os Testes
```bash
{comando para rodar os testes específicos desta subtarefa}
```

---

## ✅ Checklist de Conclusão

Antes de marcar como concluída, verifique:

### Implementação
- [ ] Código implementado conforme os passos acima
- [ ] Nenhum `console.log` de debug deixado no código
- [ ] Nenhum `TODO` ou `FIXME` sem issue linkada
- [ ] Imports organizados e sem imports não utilizados
- [ ] Tipagem TypeScript completa (sem `any`)

### Qualidade
- [ ] Testes unitários passando
- [ ] Testes de integração passando (se aplicável)
- [ ] Linter sem erros (`npm run lint`)
- [ ] Build sem erros (`npm run build`)

### Documentação
- [ ] Comentários em código complexo
- [ ] JSDoc em funções públicas
- [ ] README atualizado (se necessário)

### Revisão
- [ ] Auto-revisão do código feita
- [ ] PR criado com descrição clara
- [ ] Screenshots/vídeos anexados (se UI)

---

## ⚠️ Riscos e Cuidados

| Risco | Probabilidade | Impacto | Como Evitar |
|-------|---------------|---------|-------------|
| {risco 1} | Alta/Média/Baixa | Alto/Médio/Baixo | {mitigação} |
| {risco 2} | ... | ... | ... |

### Armadilhas Comuns (NÃO faça isso!)
- ❌ {Erro comum 1 e por que é errado}
- ❌ {Erro comum 2 e por que é errado}

### Dicas de Implementação
- 💡 {Dica útil 1}
- 💡 {Dica útil 2}

---

## 🔗 Dependências

### Esta subtarefa depende de:
- `[{STACK}] {Nome da subtarefa anterior}` - {O que você precisa que esteja pronto}

### Subtarefas que dependem desta:
- `[{STACK}] {Nome da próxima subtarefa}` - {O que será desbloqueado}

### Pode ser feita em paralelo com:
- `[{STACK}] {Nome de subtarefa paralela}` - {Por que não há dependência}

---

## 📚 Referências

### Documentação Oficial
- [{Nome da doc}]({link}) - {Para que usar}

### Arquivos de Exemplo no Projeto
- `{caminho/arquivo-exemplo.ts}` - {O que copiar daqui}

### Tech Spec Relacionada
- Seção {X.Y} da Tech Spec: {link ou referência}

---

## 🆘 Precisa de Ajuda?

Se travar em algum ponto:

1. **Revise os arquivos de referência** listados acima
2. **Consulte a Tech Spec** seção {relevante}
3. **Pergunte no Slack** canal #{canal} mencionando @{pessoa}
4. **Documentação**: {links úteis}
````

---

### 3.2 Princípios de Subtarefas MASTIGADAS

**✅ Uma subtarefa BEM mastigada tem:**


| Característica                | Descrição                            | Exemplo BOM                                                                         | Exemplo RUIM                      |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| **Fatia vertical**             | Entregável completo end-to-end (mergeável isolado, testável por si só) | "[BACKEND] Endpoint POST /payments/create (migration + enum + use-case + factory + repo + controller + testes)" | "[BACKEND] Criar factory do CreatePaymentUseCase" / "[BACKEND] Adicionar valor em enum StatusPagamento" |
| **Título específico**        | Descreve exatamente o que fazer        | "[BACKEND] Criar endpoint POST /api/users/register com validação de email único" | "[BACKEND] Criar API de usuário" |
| **Código completo**           | Mostra TODO o código a ser escrito    | Código com imports, função completa, tipos                                       | "Implemente a função X"         |
| **Explicação linha a linha** | Explica POR QUÊ cada parte existe     | "bcrypt.hash() com salt 10 para..."                                                 | Código sem explicação          |
| **Cenários de teste**         | Lista TODOS os casos a testar          | Tabela com input/output esperado                                                    | "Escreva testes"                  |
| **Referências concretas**     | Aponta arquivos existentes para copiar | "Copie estrutura de user.controller.ts"                                             | "Siga o padrão do projeto"       |
| **Checklist acionável**       | Itens específicos e verificáveis     | "Linter sem erros (npm run lint)"                                                   | "Código limpo"                   |

**❌ NÃO aceite subtarefas que:**

- Usem termos vagos como "implementar", "criar" sem detalhes
- Não tenham código de exemplo
- Não listem arquivos específicos
- Não expliquem o contexto e o porquê
- Assumam conhecimento que o dev pode não ter
- Sejam **fatias horizontais** (só contratos, só interfaces, só tipos sem implementação funcional)

---

## Fase 4: Formato de Saída

Gere a saída em **Markdown**, uma seção por subtarefa, usando o separador `---` entre elas. Cada subtarefa segue o template da Fase 3 com um header de resumo.

### Estrutura de cada subtarefa

```markdown
# Subtarefa N: [STACK] Título descritivo da subtarefa

**Depende de:** Subtarefa X (ou "nenhuma")
**Desbloqueia:** Subtarefa Y (ou "nenhuma")
**Paralela com:** Subtarefa Z (ou "nenhuma")

{Description ULTRA DETALHADA seguindo o template da Fase 3 — incluindo todas as seções:
O Que Você Vai Fazer, Contexto da Tarefa, Stack Técnico, Arquivos a Criar/Modificar,
Passo a Passo de Implementação, Testes Obrigatórios, Checklist de Conclusão,
Riscos e Cuidados, Referências}

---
```

### Regras de formatação

1. **Markdown nativo** — sem JSON, sem strings escapadas, sem `\\n`
2. **Todos os títulos com [STACK]** — BACKEND, FRONTEND, DATA, QA, INFRA, DOCS
3. **Description ULTRA DETALHADA** — siga o template da Fase 3 COMPLETAMENTE
4. **Código completo** — não use "..." ou "// resto do código"
5. **Caminhos reais** — use paths que existem no projeto
6. **Numeração sequencial** — Subtarefa 1, Subtarefa 2, etc.

---

## Checklist de Qualidade Final

Antes de retornar, valide CADA subtarefa:

### Completude
- [ ] Cobre TODAS as partes da Tech Spec
- [ ] Setup, implementação, testes incluídos
- [ ] Cada subtarefa é um "tutorial completo"

### Granularidade
- [ ] Subtarefas são autocontidas
- [ ] Nenhuma subtarefa é vaga

### Valor Unitário (fatia vertical)
- [ ] Cada subtarefa, mergeada isoladamente, deixa a aplicação funcionando
- [ ] A entrega de cada subtarefa é observável (testável ou demonstrável)
- [ ] Nenhuma subtarefa é apenas contrato, interface ou tipo sem implementação funcional

### Detalhamento
- [ ] Código COMPLETO em cada passo
- [ ] Explicações do código
- [ ] Arquivos específicos listados
- [ ] Cenários de teste com input/output
- [ ] Checklist verificável

### Dependências
- [ ] Ordem de execução clara
- [ ] Dependências mapeadas
- [ ] Paralelas identificadas

---

Agora, analise a Tech Spec fornecida e gere as subtarefas em Markdown EXTREMAMENTE DETALHADAS.
