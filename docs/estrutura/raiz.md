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

Há `AGENTS.md` **aninhados** em `agents/`, `skills/`, `templates/` e `workflows/` — o mais próximo do arquivo em edição tem precedência.

Não confundir com o template `templates/engineering/AGENTS-template.md`, que gera o `AGENTS.md` **do projeto alvo** no `/jarvis-init`.

---

## `LICENSE`

Licença **MIT**.

Copyright (c) 2026 Felipe Ribeiro de Andrade.

Implicação prática: o uso, a cópia, a modificação e a redistribuição são livres, inclusive em produto proprietário, desde que o aviso de copyright e o texto da licença acompanhem as cópias. Leia o arquivo completo.

---

## `package.json`

Manifesto npm do pacote **`jarvis-ai-framework`**.

Campos importantes neste fork:

| Campo          | Valor / significado                                            |
| -------------- | -------------------------------------------------------------- |
| `name`         | `jarvis-ai-framework`          |
| `version`      | a versão lançada (ver o `package.json` e o `CHANGELOG.md`)     |
| `bin.jarvis`   | `./bin/jarvis.js` — comando global `jarvis`                    |
| `type`         | `module` (ESM)                                                 |
| `postinstall`  | `node bin/postinstall.js` — só imprime as dicas (`jarvis init`, `jarvis install-rtk`) |
| `files`        | O que entra no tarball ao publicar (assets + CLI)              |
| `engines.node` | `>=18`                                                         |
| `repository`   | GitHub `phelipperibeiro/jarvis-framework`                      |

Script útil: `test:comandos` (confere workflows, guias e links dos comandos).

A versão exibida no banner do `jarvis init` e em `jarvis --version` **vem daqui**. Ao evoluir o fork, incremente `version` para validar qual binário está no PATH.

---

## `taxonomy.md`

**Fonte de verdade** das opções organizacionais usadas pelo `/jarvis-init` e gerenciadas pelo `/taxonomy`.

Seções:

| Seção     | Exemplos neste fork                                         |
| --------- | ----------------------------------------------------------- |
| Squads    | `CORE`                                                      |
| Domain    | e-mail corporativo (opcional; fork sem domínio obrigatório) |

Cada opção é um heading `### NOME`. O init valida respostas contra essa lista.

Para customizar a org: edite o arquivo ou use `/taxonomy add|update|remove|validate`, depois alinhe o `ENV.md` com `/jarvis-init` se necessário.

`taxonomy.md` é **copiado** para `.$IDE/` no `jarvis init` (está em `SYNC_ROOT_FILES`).

---

## Outros arquivos na raiz (não listados no pedido, mas úteis)

| Arquivo / pasta | Nota                                                             |
| --------------- | ---------------------------------------------------------------- |
| `.gitignore`    | Deste repositório: ignora `node_modules`, `.history`, `.jarvis/` (sessões locais), `.claude/` e `trash-archived-docs/` |
| `.vscode/`      | Settings locais do editor — não faz parte do framework publicado |
| `.git/`         | Controle de versão                                               |
| `.history/`     | Histórico local de edições (IDE) — ignorado                      |

Voltar: [estrutura](./README.md)
