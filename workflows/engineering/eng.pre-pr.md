---
description: Validação de segurança para realizar um pull request ou merge request
auto_execution_mode: 3
env_file: "@/ENV.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Revisão multi-agente requer coordenação, análise de código, validação de testes e verificação de conformidade
---

# pre-pr

Estamos nos aproximando de finalizar o trabalho nesta branch e nos preparar para um solicitação de integração. Agora, é hora de fazer verificações finais e limpezas para assegurar que estamos alinhados com nossos convenções e objetivos.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.

## Skills recomendados

- **eng-qa-planner**: para avaliar cobertura de testes e identificar gaps antes do PR — se a especialização estiver registrada em `QA_SPECIALIZATIONS` (ver `$IDE/rules/engineering/eng.specializations-rules.md`). Sem ela, use a base `eng-qa` diretamente.
  - Arquivo: `$IDE/skills/eng-qa-planner/SKILL.md`
- **eng-global-docs-write**: para atualizar documentação baseada nas mudanças da branch.
  - Arquivo: `$IDE/skills/eng-global-docs-write/SKILL.md`
- **jarvis-docs-index**: para atualizar o índice de documentação quando necessário.
  - Arquivo: `$IDE/skills/jarvis-docs-index/SKILL.md`
- **eng-platform** + a especialização registrada em `PLATFORM_SPECIALIZATIONS` (se houver uma): para validar thresholds de performance e analisar regressões quando a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade (temas 14, 15 e 16).
  - Arquivo: `$IDE/skills/eng-platform/SKILL.md`
- **Skills de backend e frontend**: para validar código de backend (endpoints, autenticação, workers) ou de frontend (componentes, performance de UI e acessibilidade WCAG 2.1 AA), aplique a regra `$IDE/rules/engineering/eng.specializations-rules.md` para a área envolvida: ela carrega o skill base e as especializações registradas no `ENV.md`.
  - Arquivo da regra: `$IDE/rules/engineering/eng.specializations-rules.md`

<arguments>
#$ARGUMENTS
</arguments>

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Skills recomendados | `/eng-qa-planner` | Se a especialização estiver registrada em `QA_SPECIALIZATIONS`; sem ela, usar a base `/eng-qa` diretamente |
| Skills recomendados | `/eng-global-docs-write` | Para atualizar a documentação com base nas mudanças da branch |
| Skills recomendados | `/jarvis-docs-index` | Se for necessário atualizar o índice de documentação |
| Skills recomendados | `/eng-platform` + `PLATFORM_SPECIALIZATIONS` | Se a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade |
| Skills recomendados | `/eng-backend` e `/eng-frontend` (via `eng.specializations-rules.md`) | Para validar código de backend (endpoints, autenticação, workers) ou de frontend (componentes, performance de UI, WCAG 2.1 AA); a regra também carrega as especializações registradas no ENV.md |
| Gate 0: Verificar Documentação Central | `/jarvis-docs-central` (via `jarvis docs publish --tipo ard`) | Se `CENTRAL_DOCS_REPO` estiver configurado, houver mudança arquitetural, o ARD estiver desatualizado ou novo e o usuário aceitar publicar |
| Gates › item 1 | `prod.pm-checker` (agente) | Sempre — verificar alinhamento da branch com os docs de produto e engenharia |
| Gates › item 2 | `eng.dev-code-reviewer` (agente) | Sempre — revisar o código antes de lançar |
| Gates › item 3 | `eng.qa.test-planner` (agente) | Sempre — identificar gaps de cobertura de testes na branch |
| Gates › item 4 | `eng.qa.testing-engineer` (agente) | Se o test-planner identificar gaps críticos (escrever os testes faltantes) |
| Gates › item 5 | `eng.qa.test-architect` (agente) | Se a feature tiver requisitos não-funcionais (no `architecture.md` ou explícitos na task) |
| Gates › item 6 | `/eng-qa` + `QA_SPECIALIZATIONS` | Sempre — frontend e/ou backend conforme o projeto |
| Gates › item 7 | `eng.frontend.agent` (agente) | Se a branch tiver mudanças de interface (componentes, estilos, estado) |
| Gates › item 8 | `eng.ux-designer.agent` (agente) | Se a branch introduzir nova feature de UI ou alterar fluxo de usuário |
| Gates › item 9 | `eng.docs-writer` (agente) | Sempre — atualizar a documentação do projeto |
| Gates › item 10 | Nenhuma — checklist inline | Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos |
| Saída final › 2) Bloqueadores e pendências | `/eng-global-task-comment` | Só se a validação reprovar (status RED): um comentário com o motivo (freelance pula) |

## Regras de Execução

- **Escopo**: avalie apenas as mudanças desta branch em relação ao branch base (ex.: `main`/`master`).
- **Evidências**: sempre que mencionar “testes/validações passando”, inclua quais comandos foram usados e o resultado (ou descreva smoke tests manuais quando não houver suíte).
- **Revalidação**: se qualquer gate levar a mudanças no código, reexecute no mínimo:
  - Gate 2 (revisão técnica)
  - Gate 3 (testes/validações)

## Gates

### Gate 0: Verificar Documentação Central (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md:

**Passo 1:** Detectar mudanças arquiteturais no diff da branch
```bash
git diff main...HEAD | grep -E "(class|interface|schema|migration|config)" || true
```

**Passo 2:** Se mudanças arquiteturais detectadas:
- Verificar se ARD local existe em `./docs/engineering/`
- Comparar com ARD do central-docs (se existir)
- Se desatualizado ou novo:
  - Perguntar: "Publicar ARD atualizado no central-docs?"
  - Se sim: executar `jarvis docs publish --file <path> --tipo ard --feature <slug>`

**Passo 3:** Se novos contratos/APIs criados:
- Verificar se há RFC relacionado
- Se não: sugerir criar RFC para decisões arquiteturais

**Comportamento:**
- Se `CENTRAL_DOCS_REPO` vazio → pular silenciosamente
- Não bloquear PR por docs desatualizados (apenas avisar)

---

1. Invoque o agente [prod.pm-checker]($IDE/agents/product/prod.pm-checker.md) para verificar se a branch está alinhada com os docs do projeto, documentação de produto e de engenharia.
2. Invoque o agente [eng.dev-code-reviewer]($IDE/agents/engineering/eng.dev-code-reviewer.md) para revisar o código e assegurar que está bom para lançar.
3. Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para identificar gaps de cobertura de testes na branch.
4. **Se o test-planner identificar gaps críticos**, invoque o agente [eng.qa.testing-engineer]($IDE/agents/engineering/qa/eng.qa.testing-engineer.md) para escrever os testes faltantes antes de prosseguir.
   - Gaps críticos: funções públicas sem teste, lógica de negócio descoberta, tratamento de erros não validado
   - Gaps aceitáveis (com justificativa): código de infraestrutura, integrações já cobertas por e2e
5. **Se a feature tiver requisitos não-funcionais** (definidos no `architecture.md` ou explícitos na task), invoque o agente [eng.qa.test-architect]($IDE/agents/engineering/qa/eng.qa.test-architect.md) para validar:
   - Testes de performance executados e dentro dos thresholds
   - Testes de segurança passando (RBAC, injection, etc.)
   - Quality gates configurados corretamente
6. Use a base [eng-qa]($IDE/skills/eng-qa/SKILL.md) (ou a especialização registrada em `QA_SPECIALIZATIONS`, se houver uma) para validar testes automatizados nas mudanças da branch, frontend e/ou backend conforme o projeto.
7. **Se a branch tiver mudanças de interface** (componentes, estilos, estado), invoque o agente [eng.frontend.agent]($IDE/agents/engineering/eng.frontend.agent.md) para validar:
   - Tipagem forte (quando a linguagem tem), tokens de design do projeto usados, acessibilidade WCAG 2.1 AA
   - Aplicar as exigências das especializações de frontend registradas (ver `eng.specializations-rules.md`)
8. **Se a branch introduzir nova feature de UI ou alterar fluxo de usuário**, invoque o agente [eng.ux-designer.agent]($IDE/agents/engineering/eng.ux-designer.agent.md) para verificar:
   - Empty states, loading states e mensagens de erro em linguagem humana
   - Consistência com padrões visuais existentes no produto
9. Invoque o agente [eng.docs-writer]($IDE/agents/engineering/eng.docs-writer.md) para atualizar a documentação do projeto.
10. **Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos**, aplicar o gate de segurança (os padrões de segurança da base [eng-backend]($IDE/skills/eng-backend/SKILL.md) + `BACKEND_SPECIALIZATIONS` / [eng-frontend]($IDE/skills/eng-frontend/SKILL.md) + `FRONTEND_SPECIALIZATIONS` e, para infraestrutura, do [eng-platform]($IDE/skills/eng-platform/SKILL.md) + `PLATFORM_SPECIALIZATIONS` servem de referência):
   - Revisar sanitização de inputs e queries parametrizadas
   - Verificar auth guards em endpoints novos
   - Validar headers de segurança e configurações de CORS
   - Escanear secrets no diff (`grep` por patterns de tokens/senhas)
   - Verificar `npm audit` sem vulnerabilidades HIGH/CRITICAL
   - Se achados CRITICAL: status **Red** (bloqueador)

Você também precisará lidar com todo o feedback que esses agentes fornecerem e fazer mudanças e correções conforme necessário.

## Checklist final (obrigatório)

- [ ] Não existem bloqueadores abertos (segurança/bugs críticos).
- [ ] Testes e validações relevantes foram executados e passaram (com evidências automatizadas ou manuais).
- [ ] Cobertura de testes para mudanças da branch foi avaliada (e gaps críticos tratados ou justificados).
- [ ] Documentação foi revisada/atualizada (listar arquivos alterados) ou foi explicitado por que não foi necessário.
- [ ] Riscos conhecidos e trade-offs foram registrados (e follow-ups criados quando aplicável).

## Saída final (obrigatória)

### 1) Status Pre-PR (Semáforo)

- Green: pronto para PR
- Yellow: pode abrir PR com notas e follow-ups
- Red: não pode abrir PR (listar bloqueadores)

### 2) Bloqueadores e pendências

Se o status for **RED** (bloqueado), comente o bloqueio e o motivo no card com `/eng-global-task-comment` (freelance pula). GREEN e YELLOW não geram comentário.

- Bloqueadores:
- Pendências aceitas (com justificativa):
- Follow-ups (links/IDs):

### 3) PR Brief (para colar no PR)

- Resumo do que mudou:
- Como testar:
- Evidências de testes/validações:
- Docs atualizadas:
- Riscos / trade-offs:

Uma vez terminado, me avise e peça minha permissão para abrir o Pull Request.