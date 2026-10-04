# Arquivos da raiz

Documentação dos arquivos soltos na raiz do repositório Jarvis.

---

## `README.md`

**Para quem:** humano, primeira visita.  
**Tom:** leitura rápida.

Contém:

- Get Started (clone → install → `jarvis init` → `/jarvis-init`)
- Atualizar / sincronizar (`git pull`, `npm install`, `which jarvis`, `jarvis init`, Upgrade do ENV)
- Tabelas curtas de papéis, recursos e camadas
- Links para a documentação completa em `docs/`

Não explica cada pasta em profundidade — isso fica em [estrutura/](./README.md) e na [visão geral](../visao-geral.md).

---

## `AGENTS.md`

**Para quem:** agentes de IA (e humanos que mantêm o framework).  
**Tom:** operacional / normativo.

É o “manual do agente” **dentro deste repositório**:

- Visão geral (repo ≠ app executável)
- Árvore de pastas (histórico ainda cita `.windsurf/` como layout tipico pós-init)
- Pré-requisito `ENV.md` (exceto `/jarvis-init`)
- Taxonomia, variáveis obrigatórias, detecção de IDE
- Hierarquia de leitura de documentos
- Fluxos `/eng.start` → `/eng.pr`
- Mapa comando/workflow ↔ skill
- Lista de agentes ativos
- O que o repo **não** fornece (build de um produto específico)

Há `AGENTS.md` **aninhados** em `agents/`, `skills/`, `rules/`, `templates/`, `workflows/` — o mais próximo do arquivo em edição tem precedência.

Não confundir com o template `templates/engineering/AGENTS-template.md`, que gera o `AGENTS.md` **do projeto alvo** no `/jarvis-init`.

---

## `LICENSE`

Licença **GNU Affero General Public License v3 (AGPL-3.0)**.

Copyright: Jarvis Framework Contributors (2026).

Implicação prática: quem modifica e oferece o software em rede precisa disponibilizar o código correspondente sob AGPL. Leia o arquivo completo antes de redistribuir ou embutir em produto proprietário.

---

## `package.json`

Manifesto npm do pacote **`jarvis-framework`**.

Campos importantes neste fork:

| Campo          | Valor / significado                                            |
| -------------- | -------------------------------------------------------------- |
| `name`         | `jarvis-framework`             |
| `version`      | `2.0.0` — marco do fork de autoria própria                     |
| `bin.jarvis`   | `./bin/jarvis.js` — comando global `jarvis`                    |
| `type`         | `module` (ESM)                                                 |
| `postinstall`  | `node bin/postinstall.js` — sync se existir `jarvis-lock.json` |
| `files`        | O que entra no tarball ao publicar (assets + CLI)              |
| `engines.node` | `>=18`                                                         |
| `repository`   | GitHub `phelipperibeiro/jarvis-framework`                      |

Script útil: `test:comandos` (confere workflows, guias e links dos comandos).

A versão exibida no banner do `jarvis init` e em `jarvis --version` **vem daqui**. Ao evoluir o fork, incremente `version` para validar qual binário está no PATH.

---

## `taxonomy.md`

**Fonte de verdade** das opções organizacionais usadas pelo `/jarvis-init` e pelo skill `taxonomy-manager`.

Seções:

| Seção     | Exemplos neste fork                                         |
| --------- | ----------------------------------------------------------- |
| Squads    | `CORE`                                                      |
| Hubs      | `AI`, `FRONTEND`, `BACKEND`, `QA`, `DATA`, `FULLCYCLE`      |
| Positions | `JUNIOR` … `CTO`, `QA-ENGINEER`, `GENERALIST`, … |
| Areas     | `ENGINEERING`, `PRODUCT`                                    |
| Domain    | e-mail corporativo (opcional; fork sem domínio obrigatório) |

Cada opção é um heading `### NOME`. O init valida respostas contra essa lista.

Para customizar a org: edite o arquivo ou use `/taxonomy add|update|remove|validate`, depois alinhe o `ENV.md` com `/jarvis-init` se necessário.

`taxonomy.md` é **copiado** para `.$IDE/` no `jarvis init` (está em `SYNC_ROOT_FILES`).

---

## `members.md`

Tabela opcional de membros da organização.

Formato documentado no próprio arquivo:

`Nome Completo | email | posição | slack_user_id`

Uso típico: skills de comunicação / prioridades / onboarding que precisam resolver pessoa → Slack ID.

Neste fork o arquivo está **zerado** (só estrutura). Preencha para a sua org ou ignore se for freelance.

Também é sincronizado para `.$IDE/` no init.

---

## Outros arquivos na raiz (não listados no pedido, mas úteis)

| Arquivo / pasta | Nota                                                             |
| --------------- | ---------------------------------------------------------------- |
| `.gitignore`    | Ignora `.history` e `.jarvis/` (sessões locais do workspace)     |
| `.vscode/`      | Settings locais do editor — não faz parte do framework publicado |
| `.git/`         | Controle de versão                                               |
| `.history/`     | Histórico local de edições (IDE) — ignorado                      |

Voltar: [estrutura](./README.md)
