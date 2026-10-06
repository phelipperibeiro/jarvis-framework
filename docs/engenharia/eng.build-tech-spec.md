# `/eng.build-tech-spec` — Tech Spec a partir de um card

Workflow: `workflows/engineering/eng.build-tech-spec.md` · Regras: `rules-on-demand/engineering/eng.tech-spec-rules.md` · Template: `templates/engineering/tech-spec-template.md` (um só: traz a estrutura da Tech Spec e, na seção final "Entrega", os formatos de entrega: descrição da subtarefa no board, comentário na história, mensagem final e fluxo resumido)

## Em uma frase

Transforma um épico ou uma história do board em uma **Tech Spec**: decisões arquiteturais justificadas, plano de implementação, riscos, testes e (para histórias) subtarefas prontas para virar cards.

## O que é

A Tech Spec é o documento técnico auto-contido de um card: um desenvolvedor deve conseguir executá-la sem precisar perguntar. Ela **é salva na sessão** (`.jarvis/sessions/eng/{card}/tech-spec.md`) e anexada ao card, que é a fonte da verdade.

> **Restrito a `POSITION=TECH LEAD` ou `GENERALIST`** (ou a quem o Tech Lead delegar). Com outro cargo no `ENV.md`, o comando informa e para.

## Quando usar

- Antes de implementar uma história ou épico que precisa de especificação técnica detalhada
- Quando o time quer subtarefas bem definidas para distribuir o trabalho

## Quando **não** usar

- Você quer o fluxo enxuto de planejamento de uma tarefa → [`eng.start`](./eng.start.md)
- Só quer quebrar uma Tech Spec que já existe → [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md)
- A decisão ainda está em discussão → [`eng.create-rfc`](./eng.create-rfc.md)

## Como funciona

O comando começa **detectando se o card é um épico ou uma história** (e pergunta se não conseguir inferir). O tipo decide o resto do fluxo.

**Etapas comuns**

1. **Entendimento profundo:** lê o card, o contexto de negócio, valida pré-requisitos e faz perguntas de clarificação
2. **Validação de necessidade de RFC:** checa 8 critérios (impacta mais de uma squad, altera arquitetura ou infra, nova dependência crítica, custo recorrente, SLA ou contratos, lock-in, dados sensíveis, padrão reutilizável). Se qualquer um se aplicar, o RFC é obrigatório: você cria um, vincula um existente ou segue sem RFC justificando

**Caminho A: épico → Tech Spec arquitetural**

Investigação arquitetural, proposta (decisões, desenho, contratos, riscos), apresentação a você e geração do documento `tech-spec-arch.md`. **Não quebra em subtarefas**, porque a quebra em histórias vem de Produto.

**Caminho B: história → Tech Spec de implementação**

Investigação técnica do codebase, **avaliação de complexidade**, proposta arquitetural, quebra em subtarefas, riscos e considerações, criação do `tech-spec.md`, criação das subtarefas no board (ou um template para você criar) e validação final.

## Regras que importam

- **Nunca inventa dados**; se não souber, pergunta
- Toda decisão arquitetural tem justificativa, com pelo menos duas alternativas consideradas
- Toda Tech Spec documenta riscos com mitigação
- Subtarefas são **fatias verticais completas** (endpoint inteiro, modal inteiro, tela inteira) e nunca fatias horizontais (só enum, só repository, só DTO)

## Próximo passo típico

[`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md) → [`eng.start`](./eng.start.md) em cada subtarefa

## Exemplos (bom e ruim por princípio)

Cada princípio da rule tem um exemplo curto; aqui estão os mais completos, para consulta humana (o workflow não carrega este arquivo). Os exemplos ruins de Tech Spec genérica, decisão sem justificativa, subtarefa grande, estimativa sem base e risco ignorado estão nos "Antipadrões" da rule.

**Rastreabilidade**: ✅ `related_story: STORY-123`, `link_task: https://jira.empresa.com/browse/STORY-123`, `related_prd: Sistema de Autenticação (link)` · ❌ `related_story: história do jira`, `link_task:` vazio.

**Decisão justificada**: ✅ "Armazenamento de tokens JWT: opção A `localStorage` (persistente e simples, mas vulnerável a XSS e sem expiração automática); opção B cookie `httpOnly` (protege contra XSS e expira sozinho, mas exige proteção CSRF e é mais complexo em multi-domínio). Decisão: cookie `httpOnly`, porque a segurança é P0 e o CSRF é mitigável com token CSRF" · ❌ "Usar JWT. É melhor que sessões."

**Subtarefa executável**: ✅ `SUBTASK-003: Criar endpoint POST /api/users com validação de email`, com descrição (retorna 400 se o email for inválido), arquivos (`routes/users.py`, `validators/email.py`, `tests/test_users.py`), critérios verificáveis (201 com o usuário criado, 400 com mensagem, senha com bcrypt), testes (`test_create_user_valid_email`, `..._invalid_email`, `..._duplicate_email` → 409), dependência `SUBTASK-002` e estimativa de 1,5h · ❌ `SUBTASK-003: Implementar API de usuários` com critério "API deve funcionar" e teste "testar tudo".

**Risco com mitigação**: ✅ "Migration falha em produção e deixa o banco inconsistente | Baixa | Crítico | testar em cópia de produção, script de rollback, backup antes e validação depois | rollback automático, restore do backup e feature flag" · ❌ "Algo pode dar errado | Não sei | Alto | Testar bem | Voltar atrás".

**Estimativa realista**: ✅ fases somam 18h, buffer de 25% (+4,5h), estimativa final de 22,5h (~3 dias úteis), com toda subtarefa entre 4h e 1 dia · ❌ "Uns 3 dias", sem quebra.

**Estratégia de testes**: ✅ cobertura alvo de 85%; 15 unitários, 5 de integração (usuário persistido, email duplicado, login devolve JWT) e 3 E2E (cadastro e login, redefinição de senha, login inválido mostra erro); carga de 100 usuários com p95 < 500 ms e p99 < 1 s (k6) · ❌ "Vamos testar tudo bem. Cobertura: o máximo possível."

**Documentação**: ✅ critérios "README com a env var `JWT_SECRET`, `API.md` com `POST /auth/login`, `CHANGELOG.md` atualizado" · ❌ critérios "Código pronto" e "Testes ok" (documentação esquecida).
