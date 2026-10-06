---
env_file: "@/ENV.md"
---

> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Regras de Tech Spec e Especificação Técnica

## Principais Regras

- Nunca invente dados ou informações. Se não souber, **não assuma nada**, pergunte para o usuário.
- Sempre siga as instruções de criação de tech spec na íntegra, seguindo os templates e workflows.
- Tech specs devem ser **auto-contidas**: um desenvolvedor deve poder executá-las sem precisar perguntar.
- Toda **decisão arquitetural deve ter justificativa documentada**.
- **Subtarefas devem ser fatias verticais completas** (endpoint inteiro, modal inteiro, tela inteira) com **mínimo 4h e máximo 1 dia** de trabalho. Nunca fatias horizontais (só enum, só repository, só factory). Se menor que 4h, agrupar com a próxima (sinal de fatia atômica). Se maior que 1 dia, quebrar em **duas fatias verticais independentes** — nunca em camadas.
- Sempre documente **riscos e mitigações** de forma explícita.
- Este workflow é executado por `POSITION=TECH LEAD` ou `GENERALIST` (ou quem o TL delegar); fora disso, informar e parar.
- Exemplos bom/ruim por princípio: um curto em cada princípio abaixo; os extensos estão em `docs/engenharia/eng.build-tech-spec.md` (leitura humana, não carregada pelo workflow). A estrutura e os formatos de entrega estão em `tech-spec-template.md`.

---

## Arquivos e localização

- Workflows: `$IDE/workflows/engineering/eng.build-tech-spec.md` (criação da tech spec) e `eng.breakdown-subtasks.md` (quebra em subtarefas); `eng.start.md` e `eng.plan.md` como referência. Template: `$IDE/templates/engineering/tech-spec-template.md`. Esta rule: `$IDE/rules-on-demand/engineering/eng.tech-spec-rules.md`.
- `$IDE/` resolve para a pasta da IDE atual (`.windsurf/`, `.claude/`, `.cursor/`).
- A tech spec **não** vai para `master-docs/`: fica na **sessão do projeto** e é anexada no Jira, que é a fonte da verdade; a sessão é temporária e não cria arquivos permanentes no repositório de código.
- Caminho: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/tech-spec.md` (ou `architecture.md`), com o `TASK_MANAGER_KEY` em **lowercase** e **sem** descrições ou sufixos na pasta. Exemplos: `$SESSIONS_DIR/eng/task-123/tech-spec.md`, `$SESSIONS_DIR/eng/story-456/tech-spec.md`.

---

## Princípios de Tech Spec

### 1. Rastreabilidade Total

**Princípio**: Toda tech spec deve ser rastreável até a história de negócio original.

**O que isso significa:**

- Link para história do Jira no topo do documento
- Referência aos critérios de aceitação de produto
- Conexão clara entre requisitos de negócio e decisões técnicas
- IDs de subtarefas vinculadas à história pai

**Validação:**

- [ ] Link para Jira funciona
- [ ] Critérios de aceitação de produto estão documentados
- [ ] Cada subtarefa referencia a tech spec
- [ ] Tech spec referencia PRD/FRD se existirem

**Exemplo:** ✅ `related_story: STORY-123` e `link_task: https://jira.empresa.com/browse/STORY-123` · ❌ `related_story: história do jira` e `link_task:` vazio.

---

### 2. Decisões Justificadas

**Princípio**: Toda decisão arquitetural deve ter contexto, alternativas e justificativa.

**Estrutura:** a de `tech-spec-template.md`, seção 2.5 (contexto, opções com prós e contras, decisão, justificativa e consequências).

**Validação:**

- [ ] Pelo menos 2 alternativas foram consideradas
- [ ] Prós e contras estão documentados
- [ ] Justificativa é clara e objetiva
- [ ] Consequências (positivas e negativas) estão documentadas

**Exemplo:** ✅ "Armazenar o JWT em cookie httpOnly: segurança é P0 e o CSRF é mitigável com token CSRF", citando a alternativa `localStorage` e as consequências · ❌ "Usar JWT. É melhor que sessões."

---

### 3. Subtarefas Executáveis

**Princípio**: Cada subtarefa é um **entregável completo e independente** (fatia vertical), executável por um desenvolvedor em **4h a 1 dia** sem precisar de contexto adicional. Terá sua própria branch, seu próprio commit e seu próprio deploy — portanto, precisa ser mergeável isoladamente sem quebrar o sistema.

**Características de Subtarefa Bem Definida:**

1. **Entregabilidade Independente (fatia vertical)** — PRÉ-REQUISITO ABSOLUTO
   - É um entregável completo end-to-end: endpoint inteiro, modal inteiro, tela inteira
   - Atravessa todas as camadas necessárias na MESMA subtarefa (migration + DTO + enum + use-case + factory + repository + controller + testes; ou tipos + hooks + integração + componente + estilos + testes no frontend)
   - Mergeada isoladamente, a aplicação continua funcionando
   - A entrega é observável: testável, demonstrável ou verificável
   - **Nunca** é uma fatia horizontal (só enum, só repository, só factory, só DTO, só contratos)

2. **Título Claro e Acionável**
   - Usa verbo de ação: Criar, Implementar, Adicionar, Atualizar
   - Específico sobre o que fazer
   - Não genérico ou vago

3. **Descrição Completa**
   - O QUE fazer
   - COMO fazer (direcionalmente)
   - POR QUE fazer (contexto)

4. **Arquivos Explícitos**
   - Lista de arquivos a modificar/criar
   - Tipo de mudança (Modificação/Criação/Remoção)
   - Breve descrição da mudança

5. **Critérios Testáveis**
   - Critérios de aceitação verificáveis
   - Como validar que está pronto
   - Não vago ("funcionar bem")

6. **Testes Definidos**
   - Quais testes unitários criar
   - Quais testes de integração criar
   - Casos de teste específicos

7. **Dependências Mapeadas**
   - O que precisa estar pronto antes (outras fatias verticais completas, nunca camadas isoladas)
   - O que esta subtarefa bloqueia

**Template de Validação:**

```
[ ] É uma fatia vertical completa (endpoint inteiro, modal inteiro, tela inteira)
[ ] Mergeada isoladamente, o sistema continua funcionando
[ ] A entrega é observável (testável ou demonstrável)
[ ] Título é específico e acionável
[ ] Descrição tem O QUE, COMO e POR QUE
[ ] Arquivos afetados estão listados
[ ] Critérios de aceitação são testáveis
[ ] Testes necessários estão definidos
[ ] Dependências estão mapeadas (outras fatias verticais, não camadas)
[ ] Estimativa entre 4h e 1 dia
[ ] Um dev pode executar sem perguntas adicionais
```

**Exemplo:** ✅ `SUBTASK-003: Criar endpoint POST /api/users com validação de email` (rota, validador e testes; 1,5h; critérios verificáveis) · ❌ `SUBTASK-003: Implementar API de usuários` (descrição "Criar API", critério "deve funcionar").

---

### 4. Riscos Documentados

**Princípio**: Riscos devem ser identificados proativamente com mitigações e planos B.

**Estrutura:** a tabela da seção 10 de `tech-spec-template.md` (risco, probabilidade, impacto, mitigação, plano B).

**Categorias de Riscos Comuns:**

1. **Riscos Técnicos**
   - Performance degradada
   - Complexidade subestimada
   - Incompatibilidade de bibliotecas
   - Débito técnico introduzido

2. **Riscos de Dependências**
   - API de terceiros instável
   - Mudanças em dependências externas
   - Bloqueios por outras histórias

3. **Riscos de Dados**
   - Migração complexa
   - Perda de dados
   - Inconsistência de estado

4. **Riscos de Segurança**
   - Vulnerabilidades introduzidas
   - Dados sensíveis expostos
   - Autenticação/Autorização mal implementada

**Validação:**

- [ ] Pelo menos 3 riscos identificados
- [ ] Probabilidade e impacto avaliados
- [ ] Mitigação definida para cada risco
- [ ] Plano B existe para riscos críticos (Alto impacto)

**Exemplo:** ✅ "API de pagamento instável causa timeouts | Média | Alto | retry com backoff (3 tentativas), timeout de 5s, circuit breaker | fila assíncrona" · ❌ "Algo pode dar errado | Não sei | Alto | Testar bem | Voltar atrás".

---

### 5. Estimativas Realistas

**Princípio**: Estimativas devem incluir implementação, testes, code review e buffer para imprevistos.

**Componentes da Estimativa:**

```
Estimativa de Subtarefa =
  + Tempo de implementação
  + Tempo de testes (unitários + integração)
  + Tempo de code review e ajustes
  + Buffer (10-20%)
```

**Regras:**

- **Mínimo por subtarefa**: 4h (abaixo disso é sinal forte de fatia horizontal atômica; agrupar com a próxima)
- **Máximo por subtarefa**: até 1 dia de trabalho
- **Ideal**: 4-6h

**Se > 1 dia** → quebrar em **duas fatias verticais independentes** (ex: dois endpoints distintos, duas telas distintas), **nunca** em fatias horizontais (camada de dados vs camada de API).

**Se < 4h** → agrupar com a próxima subtarefa até ultrapassar 4h formando uma fatia vertical completa.

**Estimativa Total:**

```
Estimativa Bruta = Soma de todas as subtarefas
Buffer = 25-30% (para imprevistos, discussões, blockers)
Estimativa Final = Estimativa Bruta * 1.25
```

**Validação:**

- [ ] Cada subtarefa tem estimativa em horas
- [ ] Toda subtarefa tem ≥ 4h e ≤ 1 dia
- [ ] Toda subtarefa é uma fatia vertical completa (nunca horizontal)
- [ ] Estimativa total inclui buffer de 25-30%
- [ ] Estimativa total bate com expectativa da história original

**Exemplo:** ✅ "Fases somam 18h + buffer de 25% = 22,5h (~3 dias úteis)", com cada subtarefa entre 4h e 1 dia · ❌ "Uns 3 dias", sem quebra, ou subtarefa de 5h marcada "muito grande" e sem divisão.

---

### 6. Testes Abrangentes

**Princípio**: Estratégia de testes deve cobrir unitário, integração e E2E com critérios claros.

**Pirâmide de Testes Esperada:**

```
       /\
      /  \  E2E (10-20%)
     /    \
    /______\ Integração (20-30%)
   /        \
  /__________\ Unitários (50-70%)
```

**Para Cada Nível:**

**Testes Unitários:**

- [ ] Testar funções/métodos isoladamente
- [ ] Mockar dependências externas
- [ ] Cobertura mínima: 80% do código novo
- [ ] Casos: caminho feliz + edge cases + erros

**Testes de Integração:**

- [ ] Testar integração entre módulos
- [ ] Testar integrações com banco (usar DB de teste)
- [ ] Testar integrações com APIs externas (mockar ou sandbox)
- [ ] Validar contratos entre componentes

**Testes E2E:**

- [ ] Testar fluxos críticos de usuário
- [ ] Usar dados realistas
- [ ] Validar funcionalidade completa
- [ ] Automatizar cenários de regressão

**Testes de Performance** (se aplicável):

- [ ] Load testing: simular N usuários concorrentes
- [ ] Stress testing: encontrar limite do sistema
- [ ] Validar SLAs (ex: API < 200ms p95)

**Testes de Segurança** (se aplicável):

- [ ] OWASP Top 10 verificado
- [ ] Scan de vulnerabilidades
- [ ] Penetration testing básico

**Exemplo:** ✅ "Cobertura alvo 85%: 15 unitários, 5 de integração, 3 E2E; carga de 100 usuários com p95 < 500 ms (k6)" · ❌ "Vamos testar tudo bem. Cobertura: o máximo possível."

---

### 7. Documentação Completa

**Princípio**: Documentação deve ser atualizada como parte da implementação, não depois.

**Documentação Obrigatória:**

- **README.md**: atualizar se a feature muda o setup, as variáveis de ambiente ou a instalação.
- **API.md** (se aplicável): novos endpoints, request/response, exemplos de uso e códigos de erro.
- **ARCHITECTURE.md** (se mudança arquitetural): diagramas, novas decisões e trade-offs.
- **CHANGELOG.md**: entrada para a versão, no formato Keep a Changelog.
- **Comentários no código**: decisões não óbvias e algoritmos complexos explicados, TODOs com contexto e deadline, sem comentários óbvios.

**Validação:**

- [ ] Documentação é parte dos critérios de aceitação
- [ ] Links para docs externas funcionam
- [ ] Exemplos de código são válidos e testados
- [ ] Linguagem clara e objetiva

**Exemplo:** ✅ critérios "README com a env var JWT_SECRET, API.md com POST /auth/login, CHANGELOG atualizado" · ❌ critérios "Código pronto" e "Testes ok" (documentação esquecida).

---

## Validação de Tech Spec

### Checklist de Revisão

Use este checklist antes de finalizar uma tech spec:

**Conteúdo Obrigatório:**

- [ ] Metadados completos (frontmatter YAML)
- [ ] Contexto da história de negócio
- [ ] Análise técnica detalhada
- [ ] Componentes afetados identificados
- [ ] Decisões arquiteturais documentadas com justificativas
- [ ] Plano de implementação faseado
- [ ] Subtarefas detalhadas (fatia vertical, 4h a 1 dia cada)
- [ ] Dependências mapeadas
- [ ] Riscos identificados com mitigações
- [ ] Estratégia de testes definida
- [ ] Considerações de segurança
- [ ] Considerações de performance
- [ ] Documentação a atualizar

**Qualidade:**

- [ ] Linguagem clara e objetiva
- [ ] Sem jargões sem definição
- [ ] Diagramas úteis e legíveis
- [ ] Links funcionam
- [ ] Exemplos de código são válidos
- [ ] Estimativas realistas
- [ ] Sem ambiguidades críticas
- [ ] Rastreável até história original

**Subtarefas, decisões e riscos:** as validações do "Template de Validação" (princípio 3) e as dos princípios 2 e 4 (pelo menos 2 alternativas por decisão, pelo menos 3 riscos, mitigação para cada risco e plano B para os críticos).

---

## Integração com Jira

### Criação de Subtarefas

**Formato de Descrição no Jira:**

Use markdown compatível com Jira:

```markdown
h2. Descrição
{Descrição técnica detalhada}

h2. Arquivos a Modificar/Criar

- {{path/to/file1.py}} - _[Modificação]_ - {Descrição}
- {{path/to/file2.tsx}} - _[Criação]_ - {Descrição}

h2. Critérios de Aceitação

- {color:green}✓{color} {Critério 1}
- {color:green}✓{color} {Critério 2}

h2. Testes Requeridos
_Unitários:_

- {{test_funcao()}} - {descrição}

h2. Dependências

- Depende de: [SUBTASK-XXX|https://jira.../SUBTASK-XXX]

h2. Referências

- [Tech Spec|{link}]
- [História Original|{link}]
```

### Metadados de Subtarefa no Jira

- **Tipo**: Subtarefa
- **História Pai**: STORY-XXX
- **Prioridade**: P0/P1/P2/P3
- **Estimativa**: Xh (em horas)
- **Labels**: `tech-spec`, `{área}` (backend, frontend, etc.), `{tipo}` (feature, bugfix, etc.)
- **Componentes**: {Componente do sistema afetado}
- **Sprint**: {Sprint atual ou próximo}

### Vinculação de Dependências

Use links do Jira para dependências:

- **Blocks**: Esta subtarefa bloqueia SUBTASK-XXX
- **Is Blocked By**: Esta subtarefa é bloqueada por SUBTASK-XXX
- **Relates To**: Esta subtarefa se relaciona com SUBTASK-XXX

---

## Manutenção de Tech Specs

### Quando Atualizar

Tech specs devem ser atualizadas quando:

- [ ] Decisões arquiteturais mudam durante implementação
- [ ] Novos riscos são identificados
- [ ] Escopo da história muda
- [ ] Dependências são alteradas
- [ ] Estimativas provam estar incorretas

### Versionamento

Use a seção **Histórico de Revisões** do template (data, versão, autor, mudanças).

### Status do Documento

Atualize o status no frontmatter:

- **Draft**: Em elaboração
- **In Review**: Aguardando revisão
- **Approved**: Aprovado para implementação
- **Implemented**: Implementação concluída
- **Archived**: Arquivado (histórico)

---

## Antipadrões - O Que Evitar

### ❌ Tech Spec Genérica

```markdown
# Tech Spec: Implementar Login

Vamos implementar login de usuários.

Subtarefas:

- Fazer backend
- Fazer frontend
- Testar
```

**Problemas:**

- Sem contexto de negócio
- Sem decisões arquiteturais
- Subtarefas muito vagas e grandes
- Sem critérios de aceitação
- Sem riscos identificados

---

### ❌ Decisões Sem Justificativa

```markdown
Decisão: Vamos usar MongoDB

Justificativa: Porque é NoSQL e escalável.
```

**Problemas:**

- Sem alternativas consideradas
- Justificativa superficial
- Sem trade-offs documentados
- Sem contexto do porquê NoSQL

---

### ❌ Subtarefas Muito Grandes

```markdown
SUBTASK-001: Implementar sistema de autenticação completo (3 dias)
```

**Problemas:**

- Muito grande (> 1 dia) — múltiplos endpoints e telas em uma única subtarefa
- Não específica
- Difícil de estimar
- Difícil de testar incrementalmente

**Correção**: dividir em fatias verticais independentes, ex: `[BACKEND] Endpoint POST /auth/register`, `[BACKEND] Endpoint POST /auth/login`, `[FRONTEND] Tela de registro`, `[FRONTEND] Tela de login` — **nunca** em camadas (`[BACKEND] Schemas`, `[BACKEND] Controllers`, etc).

---

### ❌ Estimativas Sem Base

```markdown
Estimativa Total: Uns 2-3 dias
```

**Problemas:**

- Sem quebra por subtarefa
- Sem buffer
- Muito vaga

---

### ❌ Riscos Ignorados

```markdown
Riscos: Nenhum identificado.
```

**Problemas:**

- Todo projeto tem riscos
- Falta de análise crítica
- Equipe não preparada para problemas

---

## Recursos e Referências

### Templates

- import `$IDE/templates/engineering/tech-spec-template.md`

### Workflows

- import `$IDE/workflows/engineering/eng.build-tech-spec.md`
- import `$IDE/workflows/engineering/eng.breakdown-subtasks.md`

### Documentação Relacionada

- import `$IDE/rules/product/prod-rules.md` - Regras de produto (complementar)
- `docs/technical/adr/` - Architecture Decision Records

---

**Lembre-se**: Uma tech spec bem feita economiza horas de discussão e retrabalho. Invista tempo na elaboração.
