---
description: Revisão de lacunas antes de abrir o PR/MR, com o relatório gate-checklist.md na sessão
auto_execution_mode: 3
env_file: "@/ENV.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Revisão multi-agente requer coordenação, análise de código, validação de testes e verificação de conformidade
---

# pre-pr

Antes de abrir o PR/MR, este comando **revê a branch atrás de possíveis lacunas** (produto, código, testes, requisitos não funcionais, interface, segurança, documentação) e gera um relatório, o **`gate-checklist.md`**, na pasta da sessão. Ele é estruturado e explicativo, para você decidir o que ajustar e o que não ajustar.

> ⚠️ **Só revisa.** O `eng.pre-pr` não corrige código, não escreve testes, não atualiza documentação e não publica nada no Central docs. Ele aponta; quem decide e ajusta é você (ou o `eng.work`, se pedir).

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.pre-pr-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 🔀 **Transições**: `$IDE/rules-on-demand/engineering/eng.transitions-rules.md` — perguntas de início e de fim deste comando (a opção padrão mantém o fluxo de sempre).

## Skills recomendados

- **eng-qa-planner**: para avaliar cobertura de testes e identificar gaps antes do PR — se a especialização estiver registrada em `QA_SPECIALIZATIONS` (ver `$IDE/rules/engineering/eng.specializations-rules.md`). Sem ela, use a base `eng-qa` diretamente.
  - Arquivo: `$IDE/skills/eng-qa-planner/SKILL.md`
- **eng-global-docs-write**: para identificar documentação que ficou desatualizada com as mudanças da branch.
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
| Skills recomendados | `/eng-global-docs-write` | Para identificar documentação desatualizada pelas mudanças da branch |
| Skills recomendados | `/jarvis-docs-index` | Se for necessário atualizar o índice de documentação |
| Skills recomendados | `/eng-platform` + `PLATFORM_SPECIALIZATIONS` | Se a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade |
| Skills recomendados | `/eng-backend` e `/eng-frontend` (via `eng.specializations-rules.md`) | Para validar código de backend (endpoints, autenticação, workers) ou de frontend (componentes, performance de UI, WCAG 2.1 AA); a regra também carrega as especializações registradas no ENV.md |
| Gates › item 1 | `prod.pm-checker` (agente) | Sempre — verificar alinhamento da branch com os docs de produto e engenharia |
| Gates › item 2 | `eng.dev-code-reviewer` (agente) | Sempre — revisar o código antes de lançar |
| Gates › item 3 | `eng.qa.test-planner` (agente) | Sempre — identificar gaps de cobertura de testes na branch |
| Gates › item 5 | `eng.qa.test-architect` (agente) | Se a feature tiver requisitos não-funcionais (no `architecture.md` ou explícitos na task) |
| Gates › item 6 | `/eng-qa` + `QA_SPECIALIZATIONS` | Sempre — frontend e/ou backend conforme o projeto |
| Gates › item 7 | `eng.frontend.agent` (agente) | Se a branch tiver mudanças de interface (componentes, estilos, estado) |
| Gates › item 8 | `eng.ux-designer.agent` (agente) | Se a branch introduzir nova feature de UI ou alterar fluxo de usuário |
| Gates › item 9 | `eng.docs-writer` (agente) | Sempre — apontar documentação do projeto desatualizada (sem editar) |
| Gates › item 10 | Nenhuma — checklist inline | Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos |
| Publicação do relatório | `/eng-global-task-comment` | Só se o usuário responder **Sim** no fim: o `gate-checklist.md` com as decisões vira um comentário na issue/card (freelance pula) |

## Regras de Execução

- **Escopo**: avalie apenas as mudanças desta branch em relação à **branch base** (`Branch base:` do `architecture.md`; sem ele, pergunte).
- **Só apontar**: cada agente/gate devolve lacunas, não correções. Nenhum arquivo do projeto é alterado por este comando.
- **Evidências**: cite o comando rodado e o resultado, ou `arquivo:linha`, para cada lacuna.

## Gates (revisão)

1. Invoque o agente [prod.pm-checker]($IDE/agents/product/prod.pm-checker.md) para apontar desalinhamentos entre a branch e os documentos de produto e de engenharia (em `$PROD_DOCS`, `$ENG_DOCS` e no Central docs).
2. Invoque o agente [eng.dev-code-reviewer]($IDE/agents/engineering/eng.dev-code-reviewer.md) para apontar problemas de código (bugs, legibilidade, padrões do projeto).
3. Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para apontar lacunas de cobertura de testes. Lacunas críticas: funções públicas sem teste, lógica de negócio descoberta, tratamento de erro não validado.
4. **Se a feature tiver requisitos não funcionais** (no `architecture.md` ou explícitos na task), invoque o agente [eng.qa.test-architect]($IDE/agents/engineering/qa/eng.qa.test-architect.md) para apontar o que falta validar (performance, segurança, quality gates).
5. Use a base [eng-qa]($IDE/skills/eng-qa/SKILL.md) (ou a especialização registrada em `QA_SPECIALIZATIONS`) para rodar os testes automatizados da branch e registrar o resultado.
6. **Se a branch tiver mudanças de interface**, invoque o agente [eng.frontend.agent]($IDE/agents/engineering/eng.frontend.agent.md) para apontar problemas de tipagem, tokens de design e acessibilidade (WCAG 2.1 AA), aplicando as especializações de frontend registradas.
7. **Se a branch introduzir nova feature de UI ou alterar fluxo de usuário**, invoque o agente [eng.ux-designer.agent]($IDE/agents/engineering/eng.ux-designer.agent.md) para apontar empty states, loading, mensagens de erro e consistência visual.
8. **Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos**, aplique o checklist de segurança (padrões da base [eng-backend]($IDE/skills/eng-backend/SKILL.md) + `BACKEND_SPECIALIZATIONS`, [eng-frontend]($IDE/skills/eng-frontend/SKILL.md) + `FRONTEND_SPECIALIZATIONS` e, para infraestrutura, [eng-platform]($IDE/skills/eng-platform/SKILL.md) + `PLATFORM_SPECIALIZATIONS`): sanitização de inputs e queries parametrizadas, auth guards, headers e CORS, secrets no diff, `npm audit` sem HIGH/CRITICAL.
9. Invoque o agente [eng.docs-writer]($IDE/agents/engineering/eng.docs-writer.md) para apontar documentação do projeto que ficou desatualizada (sem editar).

## Relatório: `gate-checklist.md` (obrigatório)

Grave em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/gate-checklist.md`:

```markdown
# Gate checklist — {TASK_MANAGER_KEY}

> Branch: {branch} → {branch base} · Data: {AAAA-MM-DD}
> **Semáforo:** 🟢 pronto para PR | 🟡 pode abrir com notas | 🔴 há bloqueadores

## Resumo
{3 a 5 frases: o que a branch faz, quantas lacunas por severidade e o principal risco.}

## Lacunas

### {Área: Produto e documentação | Código | Testes | Não funcionais | Interface e UX | Segurança | Documentação do projeto}

| # | Lacuna | Onde | Por que importa | Sugestão | Severidade | Decisão |
|---|---|---|---|---|---|---|
| 1 | {o que falta ou está errado} | `{arquivo:linha}` | {impacto, em linguagem simples} | {como resolver} | 🔴 Bloqueador / 🟡 Importante / ⚪ Menor | {Ajustar \| Não ajustar: motivo} |

(uma tabela por área; área sem lacuna: "Nenhuma lacuna encontrada.")

## Evidências
{Comandos rodados (testes, lint, build, audit) e resultados.}

## PR Brief
- Resumo do que mudou:
- Como testar:
- Riscos / trade-offs:
```

A coluna **Decisão** nasce vazia: quem preenche é o usuário.

## Fechamento

1. Mostre o semáforo, o resumo e a lista de lacunas por severidade, com o caminho do `gate-checklist.md`.
2. Peça as decisões: para cada lacuna 🔴 e 🟡, "Ajustar" ou "Não ajustar" (com o motivo). Use `AskUserQuestion` por lacuna quando houver poucas; com muitas, deixe a pessoa responder em texto ou editar o arquivo. Grave as decisões na coluna **Decisão**.
3. Pergunte com `AskUserQuestion` (**Sim / Não**, sempre, nunca publicar sem a resposta): **"Publicar o gate-checklist.md (com as decisões) como comentário na issue/card?"**
   - **Sim** (e `TASK_MANAGER` preenchido): `/eng-global-task-comment {TASK_MANAGER_KEY}` com o conteúdo do arquivo.
   - **Não**, ou modo freelance: fica só na sessão.
4. Próximo passo: ajustar o que foi marcado "Ajustar" (à mão ou com o `/eng.work`) e rodar o `/eng.pr`, que usa o PR Brief deste relatório. Pergunte com `AskUserQuestion` (`eng.transitions-rules.md`): **"Seguir para o `/eng.pr`?"** → **Parar aqui para ajustar (como hoje)** / **Seguir para o `/eng.pr`**. Com lacuna marcada "Ajustar", deixe isso claro na opção de seguir ("Seguir mesmo com {n} lacunas a ajustar"). Com "Seguir", chame o `/eng.pr {TASK_MANAGER_KEY}` (ou mostre o comando).
