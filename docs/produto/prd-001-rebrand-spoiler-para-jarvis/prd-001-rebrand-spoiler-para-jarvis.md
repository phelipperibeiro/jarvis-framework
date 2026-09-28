---
id: PRD-001
name: Rebrand Spoiler para Jarvis
version: 1.0.0
status: backlog
last_editor: Felipe Ribeiro de Andrade
updated_at: 2026-09-28
related_repo:
  - https://github.com/phelipperibeiro/jarvis-framework
related_prd: []
related_frd: []
created_at: 2026-09-28
created_by: Felipe Ribeiro de Andrade
---

# PRD-001: Rebrand Spoiler para Jarvis

## TL;DR

- **O que** resolver:
  - O framework ainda carrega a identidade "Spoiler", herdada do projeto original ligado à Frota162, mesmo após o fork ter sido desacoplado dessa origem.
  - Nome de pacote npm, comando CLI, paths de estado local, variáveis de ambiente e a arte ASCII do banner (incluindo o desenho de um carrinho) continuam referenciando "Spoiler".
  - 114 arquivos `.md`/`.json`/`.js` no repositório contêm referências textuais a "spoiler", o que gera inconsistência de identidade em toda a documentação e código.
- **Por que** resolver:
  - O repositório já foi renomeado no GitHub para `jarvis-framework` e não há mais vínculo com a Frota162 (ver [docs/mapa-desacoplamento-frota.md](../../mapa-desacoplamento-frota.md)); manter "Spoiler" no código é inconsistente com a identidade pública do projeto.
  - Usuários que instalarem o pacote via `npm install -g` veriam um comando `spoiler` e um banner desalinhados com o nome real do repositório.
  - É o único mantenedor do fork agora e quer que a marca "Jarvis" — com a arte do rostinho já desenhada — represente o projeto de forma consistente.
- **Como** resolver:
  - Renomear pacote npm e comando CLI de `spoiler-framework`/`spoiler` para `jarvis-framework`/`jarvis`.
  - Trocar path de estado local `~/.spoiler/` por `~/.jarvis/` e a variável de ambiente `SPOILER_ENV_FILE` por `JARVIS_ENV_FILE`.
  - Substituir o banner do CLI (hoje um wordmark ASCII em blocos "SPOILER" + desenho de um carrinho, em `bin/lib/utils/ui.js`) pelo frame do rostinho já desenhado em [jarvis.md](../../../jarvis.md).
  - Varrer os 114 arquivos com referência textual a "spoiler" (código, documentação, regras, skills, workflows, templates, agents) e atualizar para "Jarvis".

## Contexto

Este repositório é o código-fonte do próprio framework de desenvolvimento assistido por IA — as pastas `agents/`, `skills/`, `workflows/`, `rules/` e `templates/` na raiz são o que vira `$IDE/` (`.claude/`, `.windsurf/`, etc.) quando instalado em outro projeto. O projeto nasceu como um fork do antigo "Spoiler", que era ligado à Frota162 (event bus Redis, squads específicos, login OAuth corporativo). Esse vínculo já foi removido em uma etapa anterior de desacoplamento, documentada em [docs/mapa-desacoplamento-frota.md](../../mapa-desacoplamento-frota.md).

Apesar do desacoplamento funcional, a identidade textual e visual do projeto — nome de pacote, comando CLI, paths de configuração local, e a arte ASCII do banner (que ainda mostra um carrinho, resquício do nome "Spoiler") — não foi atualizada. O repositório remoto já foi renomeado para `github.com/phelipperibeiro/jarvis-framework`, criando uma divergência entre o nome público do projeto e o que o próprio código/CLI exibe ao usuário.

### Declaração do problema ou da oportunidade

O framework carrega uma identidade desatualizada ("Spoiler") que não reflete mais o nome real do projeto nem seu propósito atual como fork independente. Isso gera confusão para quem instala o pacote, lê a documentação ou vê o banner do CLI.

- O comando CLI instalado (`spoiler`) e o nome do pacote npm (`spoiler-framework`) não correspondem ao nome do repositório (`jarvis-framework`).
- O banner exibido ao rodar o CLI mostra um wordmark "SPOILER" e um desenho de carrinho, sem relação com a nova identidade "Jarvis".
- Paths de estado local (`~/.spoiler/`) e a variável de ambiente (`SPOILER_ENV_FILE`) mantêm o nome antigo, criando inconsistência entre configuração e marca.
- Documentação, regras, skills, workflows, templates e agents (114 arquivos) referenciam "spoiler" em exemplos de comando, nomes de skill e textos explicativos, exigindo uma varredura completa para eliminar o nome antigo.

## Solução

Esta é uma limpeza de identidade que substitui toda referência a "Spoiler" por "Jarvis" no framework — nome de pacote, comando CLI, paths de estado, variáveis de ambiente e arte ASCII — sem alterar nenhum comportamento funcional.

Esta solução renomeia a identidade técnica e visual do framework de "Spoiler" para "Jarvis": pacote npm e comando CLI (`jarvis-framework`/`jarvis`), paths de estado local (`~/.jarvis/`) e variável de ambiente (`JARVIS_ENV_FILE`), além do banner do CLI, que passa a exibir o rostinho já desenhado pelo mantenedor em vez do wordmark em blocos e do desenho do carrinho antigos. O impacto esperado é eliminar qualquer resquício textual ou visual de "Spoiler" no código, documentação e experiência de uso do CLI, alinhando o projeto à sua identidade atual como fork independente.

### Listagem das funcionalidades que compõem o escopo da solução

Esta iniciativa é um único bloco de trabalho técnico (rebrand), sem features de produto a decompor em FRDs. O escopo é tratado diretamente como fases de execução (ver seção "Plano de Execução Sugerido"), que alimentam `/eng.start` e `/eng.plan` para a implementação.

#### Evoluções futuras

__Nenhuma oportunidade de evolução futura identificada.__

### Resumo de solução técnica

Não há ARDs ou especificações técnicas prévias para este repositório. As decisões técnicas relevantes para este rebrand estão descritas abaixo, validadas diretamente com o mantenedor do projeto:

- **Nome de pacote/CLI**: `jarvis-framework` (pacote npm) / `jarvis` (comando). Substitui `spoiler-framework`/`spoiler`. Justificativa: alinhar nome público (repositório, pacote, comando) em um único padrão.
- **Estado local e env var**: `~/.spoiler/` → `~/.jarvis/`; `SPOILER_ENV_FILE` → `JARVIS_ENV_FILE`. Justificativa: rebrand completo, sem vestígio do nome antigo em paths ou configuração — evita confusão para quem inspeciona variáveis de ambiente ou diretórios de estado.
- **Banner do CLI**: usar somente o rostinho desenhado em [jarvis.md](../../../jarvis.md) (`bin/lib/utils/ui.js`, função `showBanner()`), removendo o wordmark ASCII em blocos "SPOILER" e o desenho do carrinho. Justificativa: o mantenedor já produziu a arte final e optou por uma identidade visual mais simples (um rosto) em vez de um wordmark + mascote.
- **URLs do repositório**: `repository`, `homepage` e `bugs` do `package.json` apontam para `github.com/phelipperibeiro/jarvis-framework`. Justificativa: repositório remoto já foi renomeado; o `origin` local já foi atualizado para esse endereço.

## O que essa solução não é

Esta solução é uma troca de identidade textual e visual (marca, nomes, paths, arte ASCII). Ela não altera nenhum comportamento, arquitetura ou funcionalidade do framework.

#### Fora do escopo do conceito dessa solução

- Não renomeia as pastas de IDE em si (`.claude/`, `.windsurf/`, `.cursor/`, `.codex/`, `.opencode/`, `.kiro/`) — esses nomes pertencem às próprias IDEs e não têm relação com "Spoiler".
- Não reimplementa ou altera o comportamento de nenhum comando, skill, workflow ou agente — é puramente rebrand de identidade.
- Não inclui a criação de uma nova arte ASCII — a arte do rostinho já foi desenhada pelo mantenedor em [jarvis.md](../../../jarvis.md) e deve ser usada como está.
- Não cobre a limpeza retroativa do histórico de commits do Git (menções antigas a "Spoiler" permanecem no histórico).

## Indicadores de Sucesso

- `grep -ri spoiler` no repositório (fora de `node_modules/` e do histórico do git) retorna zero ocorrências ao final da iniciativa.
- `npm install -g jarvis-framework && jarvis --version` funciona e exibe o banner com o rostinho, sem menção a "Spoiler" ou ao carrinho antigo.
- Nenhuma quebra funcional: todos os comandos existentes (`init`, `whoami`, `list`, `install-rtk`, etc.) continuam funcionando sob o novo nome de comando.

## Artefatos e Documentação
- [jarvis.md](../../../jarvis.md) — arte ASCII do rostinho a ser usada no banner do CLI.
- [docs/mapa-desacoplamento-frota.md](../../mapa-desacoplamento-frota.md) — histórico do desacoplamento da Frota162, contexto anterior a este rebrand.
- [issues/spoiler-pendencias.md](../../../issues/spoiler-pendencias.md) — pendências técnicas registradas sob o nome antigo do projeto; deve ser renomeado/atualizado como parte da Fase 5.

## Repositórios relacionados
- [github.com/phelipperibeiro/jarvis-framework](https://github.com/phelipperibeiro/jarvis-framework) — repositório único onde este rebrand é aplicado.

## Especificações relacionadas

Não há PRDs, FRDs ou ARDs relacionados existentes neste repositório no momento da criação deste documento.

**PRDs relacionadas**: nenhuma.

**FRDs relacionadas**: nenhuma.

**ARDs relacionadas**: nenhuma.

### Histórias, tasks, Issues relacionadas

- Nenhuma issue formal criada ainda. O plano de execução abaixo deve ser convertido em issues/tasks via `/eng.start` + `/eng.plan` antes da implementação.

---

## Plano de Execução Sugerido

> Não faz parte do template padrão de PRD, mas documentado aqui para orientar a transição para os workflows de engenharia (`/eng.start`, `/eng.plan`, `/eng.work`).

1. **Fase 1 — Identidade técnica**: `package.json` (name, bin, description, author, repository, homepage, bugs, script `prepublishOnly`), `bin/spoiler.js` → `bin/jarvis.js`, `bin/commands/*.js`, `bin/lib/auth/session.js`, `bin/lib/config/constants.js`, `bin/lib/env-loader.js`, `bin/lib/utils/paths.js`, `bin/postinstall.js` (paths `~/.spoiler/` → `~/.jarvis/`, env var `SPOILER_ENV_FILE` → `JARVIS_ENV_FILE`).
2. **Fase 2 — Banner/UI**: `bin/lib/utils/ui.js` — remover wordmark ASCII "SPOILER" e desenho do carrinho, substituir pelo frame do rostinho de `jarvis.md`.
3. **Fase 3 — Documentação raiz**: `README.md`, `AGENTS.md`, `taxonomy.md`, `members.md`, `LICENSE` (author).
4. **Fase 4 — Conteúdo do framework**: varredura textual em `rules/`, `skills/`, `workflows/`, `agents/`, `templates/` (exemplos de comando como `/init-spoiler`, `spoiler docs sync`, `spoiler checkin`, e demais menções).
5. **Fase 5 — Renomear arquivos com "spoiler" no nome**: skill `init-spoiler` (renomear pasta/arquivos da skill), `issues/spoiler-pendencias.md`.

**Critério de conclusão de cada fase**: `grep -ri spoiler` nos arquivos da fase retorna zero ocorrências, e (quando aplicável) o comando/funcionalidade testada continua funcionando.
