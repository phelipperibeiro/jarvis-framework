<div align="center">

# Jarvis

**Framework de desenvolvimento orientado por contexto para IDEs de IA.**

[O que e o Jarvis?](docs/visao-geral.md) &#8226; [Estrutura](docs/estrutura/README.md) &#8226; [Get Started](#get-started) &#8226; [Atualizar](#atualizar--sincronizar) &#8226; [GitHub](https://github.com/phelipperibeiro/jarvis-framework)

</div>

---

## Get Started

### 1. Instale

O Jarvis é instalado **só global** (comando `jarvis` no PATH):

```bash
npm install -g jarvis-ai-framework
```

Não instale o pacote dentro do projeto: o `jarvis init` roda **dentro do projeto** e copia os assets do Jarvis global para a pasta da IDE. Se ele achar uma cópia local (`node_modules` ou dependência no `package.json`), avisa que ela é ignorada.

Confira **onde** o binário ficou no PATH (útil se houver mais de uma instalação):

```bash
which jarvis
jarvis --version
```

> Quer editar o próprio framework (skills, agents, workflows) e ver as mudanças refletidas na hora? Veja [Desenvolvendo o Jarvis localmente](#desenvolvendo-o-jarvis-localmente) mais abaixo.

### 2. Bootstrap da IDE

```bash
jarvis init --ide cursor
```

IDEs: `windsurf` · `claude` · `cursor` · `codex` · `opencode` · `gemini` · `kiro`

### 3. No chat da IDE

```
/jarvis-init
```

Siga o guia do seu papel. Sem `/jarvis-init`, o `ENV.md` não existe e o resto dos comandos não tem contexto.

---

## Desenvolvendo o Jarvis localmente

Se você quer editar o framework (skills, agents, workflows) e ver as mudanças refletidas na hora, instale a partir de um clone local em vez do npm registry.

### 1. Clone

```bash
git clone https://github.com/phelipperibeiro/jarvis-framework.git
```

Ou baixe o ZIP e extraia. O path da pasta clonada é o que você usa no passo seguinte.

### 2. Instale a partir do clone

Global (comando `jarvis` no PATH):

```bash
npm install -g /caminho/para/jarvis
```

**`npm link`** (útil se você altera o clone e quer refletir na hora):

```bash
cd /caminho/para/jarvis
npm link
```

Isso já registra o comando `jarvis` no global. Não rode `npm link jarvis-ai-framework` dentro do workspace: isso cria uma cópia local em `node_modules`, que o `jarvis init` ignora (e avisa).

Confira **onde** o binário ficou no PATH (útil se houver mais de uma instalação):

```bash
which jarvis
jarvis --version
```

### 3. Bootstrap da IDE e 4. No chat da IDE

Mesmos passos 2 e 3 do [Get Started](#get-started) acima — `jarvis init --ide {ide}` e `/jarvis-init` no chat.

---

## Atualizar / sincronizar

**Instalou via npm registry** (fluxo padrão do [Get Started](#get-started)):

```bash
npm install -g jarvis-ai-framework@latest
jarvis init --upgrade --ide {ide}   # assets + variáveis novas do ENV.md + documentos para as pastas novas
```

`jarvis init --ide {ide}` numa pasta já instalada mostra o menu **Atualizar** (Enter, o mesmo que o `--upgrade`) / **Reinstalar** (o mesmo que o `--force`) / **Cancelar**, com a versão instalada e a do pacote. No fim, ele só manda rodar o `/jarvis-init upgrade` quando há pendência.

Na IDE, o `/jarvis-init upgrade` vai direto ao Upgrade (C), cuida do que precisa de conversa (Central docs antigo e o passo das stacks) e, no fim, valida o `ENV.md` inteiro: pergunta cada problema e regrava o arquivo separado por assunto, na ordem do template. O `--upgrade` só **acrescenta** chaves ao `ENV.md`, no fim do arquivo: nenhuma chave existente muda. Ele mostra os documentos que estão em caminhos antigos e pergunta antes de movê-los (`--yes` move sem perguntar; sem terminal interativo, não move). Também lista os skills instalados que saíram do framework e pergunta antes de removê-los (`--remove-stale` remove sem perguntar só os listados; skills registrados em `*_SPECIALIZATIONS` nunca são listados).

**Instalou via clone local** (fluxo de [Desenvolvendo o Jarvis localmente](#desenvolvendo-o-jarvis-localmente)) — quando o repo no GitHub ganhar commits novos, sincronize assim:

### 1. Atualizar o clone

```bash
cd /caminho/para/jarvis
git pull
```

### 2. Atualizar o pacote instalado

**Global:**
```bash
npm install -g /caminho/para/jarvis
```

**Com `npm link`:** o `git pull` no clone já basta — o link aponta para a pasta.

Antes de seguir, confira se o `jarvis` do PATH é o que você acabou de atualizar:

```bash
which jarvis
jarvis --version
```

### 3. Espelhar assets na pasta da IDE

No **workspace** (onde roda o projeto / squad):

```bash
cd workspace-squad/
jarvis init --ide cursor
# confirme com "s" se a pasta .cursor/ (ou equivalente) já existir
```

Isso copia de novo `agents/`, `skills/`, `workflows/`, `rules/`, `templates/` para `.$IDE/` e atualiza o `jarvis-lock.json`.

Esse é o único caminho de atualização dos assets: o `npm install -g` não sincroniza nenhum projeto sozinho. Quando os assets do projeto estão atrás do Jarvis global, o `/jarvis-init` avisa no início e oferece o `jarvis init --upgrade`.

### 4. ENV.md (só se houver variáveis novas)

No chat da IDE:

```
/jarvis-init
```

Escolha **Upgrade (C)** — adiciona chaves novas do template sem apagar os valores atuais e oferece o passo opcional **"adicionar as stacks"**.

> **Vindo de uma versão anterior à 2.0?** O Upgrade é **obrigatório**: sem as chaves `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`, os comandos `eng.*` de backend e de frontend param. Skills criados por você precisam de `metadata.area` (veja [especializações de stack](docs/especializacoes-de-stack.md#atualizando-de-uma-versão-anterior)).

### O que cada passo atualiza

| Passo | O que muda |
|-------|------------|
| `git pull` | Código do framework no clone |
| `npm install -g` | Binário `jarvis` + pacote que o `init` lê |
| `jarvis init` | Arquivos em `.$IDE/` (skills, agents, workflows…) e o Context7 no arquivo de MCP da IDE (ex.: `.mcp.json` no Claude Code; só acrescenta, sem apagar outros servidores) |
| `/jarvis-init` Upgrade | Só `$IDE/ENV.md` (variáveis faltantes) e, se você aceitar o passo opcional "adicionar as stacks", as listas de especializações |

`ENV.md`, `.jarvis/sessions/` e o `.gitignore` do workspace **não** são sobrescritos pelo sync de assets. O `.gitignore` só é criado ou alterado quando a raiz tem `.git`; sem `.git` (como no modo workspace) a raiz não é versionada e o init não o toca.

| Papel | Descricao | Link |
|-------|-----------|------|
| **Produto** | Especificacoes, PRDs e gestao de requisitos | `workflows/product/` |
| **TechLead** | Arquitetura, tech specs e revisao tecnica | `workflows/engineering/` |
| **Developer** | Implementacao, testes e entrega de codigo | `workflows/engineering/` |
| **QA** | Testes E2E, exploratórios, quality gates e relatórios de qualidade | `workflows/engineering/qa/` |

| Recurso | Descricao | Link |
|---------|-----------|------|
| **Skills** | Playbooks executaveis (`eng-backend`, `eng-frontend`, `eng-global-pr`, …) | `skills/` |
| **Identidade** | `USER=` no ENV.md (fallback: git / SO). `jarvis whoami` | — |
| **Documentacao** | Geracao e organizacao de docs tecnica e de negocio | `templates/` |
| **Troubleshooting** | Configuracao e uso | `/jarvis-init` |

---

## Estilo dos artefatos

O `/jarvis-init` pergunta o `ARTIFACT_STYLE` (variável do `ENV.md`):

| Valor | O que acontece |
|---|---|
| `ai-generated` (padrão) | Como sempre: metadados, links de rastreabilidade e padrões da ferramenta |
| `human-generated` | Nada do que o Jarvis publica (commit, PR/MR, comentário no card, issue; sempre depois da pergunta) leva marca de IA ou da IDE: o `/eng.pr` confere e limpa antes do push. Todo documento gerado pergunta, no fim, se você quer a versão humanizada, gravada ao lado como `{nome}.public.md` para repassar a clientes ou stakeholders |

Com `human-generated`, o `/jarvis-init` copia a rule `rules/artifact-style-rules.md` (eixo `ARTIFACT_STYLE` do `Applies to`); com `ai-generated`, ela nem existe na sessão. Trocou o valor à mão? Rode `/jarvis-init upgrade`.

## Funciona com qualquer stack

O Jarvis não presume Go, PHP, NestJS ou React. Cada área (backend e frontend) tem uma **skill base neutra**, e cada projeto registra no `ENV.md` as **especializações** da sua stack (`BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`). Os comandos `eng.*` carregam a base mais o que o projeto registrou.

- **Na instalação:** o `/jarvis-init` oferece o passo opcional "adicionar as stacks", que lê o workspace e sugere registrar ou criar a especialização de cada stack
- **A qualquer momento:** `/jarvis-create-specialization backend golang` cria a especialização a partir do código do projeto, mostra para revisão e só então grava e registra
- **Consulta:** `/jarvis-list-specializations` mostra o que está instalado e registrado

Guia completo: [`docs/especializacoes-de-stack.md`](docs/especializacoes-de-stack.md).

---

## Camadas

O Jarvis e organizado em 5 camadas.

| Camada | O que faz |
|--------|-----------|
| **Agents** | Agentes especializados de IA para engenharia, QA e produto |
| **Skills** | Playbooks executaveis com logica autonoma |
| **Templates** | Modelos de documentos (ARD, RFC, Tech Spec, PRD, Epic) |
| **Rules** | Regras de dominio filtradas por perfil (HUB, POSITION, AREA, SQUAD) no `/jarvis-init` |
| **Workflows** | Fluxos de execucao dos comandos slash |

---

## Suporte

Precisa de ajuda?

- **Documentacao completa (proposta e conceitos)** &mdash; [`docs/visao-geral.md`](docs/visao-geral.md)
- **Estrutura do repo (cada pasta/arquivo)** &mdash; [`docs/estrutura/`](docs/estrutura/README.md)
- **Lista rapida de comandos (`eng.*` e `prod.*`)** &mdash; [`docs/comandos.md`](docs/comandos.md)
- **Produto / PM / PO (comandos e exemplos)** &mdash; [`docs/produto/`](docs/produto/README.md)
- **Engenharia (um guia por comando `eng.*`)** &mdash; [`docs/engenharia/`](docs/engenharia/README.md)
- **Indice de docs/** &mdash; [`docs/README.md`](docs/README.md)
- **Instrucoes para agentes / mapa de skills** &mdash; `AGENTS.md`
- **Issues/Feedback** &mdash; skill `jarvis-report-issue` (pergunta antes de abrir; sem a CLI do host (`gh`), sem login, sem rede ou com o seu Não, a issue fica em `.jarvis/issues/issue-{desc}.md` para abrir à mão)
- **Duvidas sobre comandos** &mdash; Pergunte diretamente ao agent:
  `"Como funciona /eng.start?"` | `"Qual a diferenca entre /eng.work e /pr?"` | `"O que e CDD?"`
