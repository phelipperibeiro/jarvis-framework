<div align="center">

# Jarvis

**Framework de desenvolvimento orientado por contexto para IDEs de IA.**

[O que e o Jarvis?](docs/visao-geral.md) &#8226; [Estrutura](docs/estrutura/README.md) &#8226; [Get Started](#get-started) &#8226; [Atualizar](#atualizar--sincronizar) &#8226; [GitHub](https://github.com/phelipperibeiro/jarvis-framework)

</div>

---

## Get Started

### 1. Instale

Global (comando `jarvis` no PATH):

```bash
npm install -g jarvis-ai-framework
```

**Só neste workspace** (não sobe no PATH):

```bash
cd workspace-squad/
npm install jarvis-ai-framework --save-dev
```

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

Se instalou só com `--save-dev`, use `npx jarvis init --ide cursor`.

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

**Só neste workspace** (não sobe no PATH):

```bash
cd workspace-squad/
npm install /caminho/para/jarvis --save-dev
```

**`npm link`** (útil se você altera o clone e quer refletir na hora):

```bash
cd /caminho/para/jarvis
npm link
```

Isso já registra o comando `jarvis` no global. Opcional, para o workspace resolver o pacote:

```bash
cd workspace-squad/
npm link jarvis-ai-framework
```

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
jarvis init --ide {ide}   # re-sincroniza os assets (agents/skills/workflows/rules)
```

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

**Só no workspace (`--save-dev`):**
```bash
cd workspace-squad/
npm install /caminho/para/jarvis --save-dev
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

Se o workspace usa `--save-dev` e já tem `jarvis-lock.json`, o `npm install` do passo 2 também dispara o **postinstall** e sincroniza sozinho para a IDE do lock.

### 4. ENV.md (só se houver variáveis novas)

No chat da IDE:

```
/jarvis-init
```

Escolha **Upgrade (C)** — adiciona chaves novas do template sem apagar os valores atuais.

### O que cada passo atualiza

| Passo | O que muda |
|-------|------------|
| `git pull` | Código do framework no clone |
| `npm install -g` / `--save-dev` | Binário `jarvis` + pacote que o `init` lê |
| `jarvis init` (ou postinstall com lock) | Arquivos em `.$IDE/` (skills, agents, workflows…) |
| `/jarvis-init` Upgrade | Só `$IDE/ENV.md` (variáveis faltantes) e, se você aceitar o passo opcional "adicionar as stacks", as listas de especializações |

`ENV.md`, `.jarvis/sessions/` e o `.gitignore` do workspace **não** são sobrescritos pelo sync de assets.

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
- **Issues/Feedback** &mdash; skill `jarvis-report-issue`
- **Duvidas sobre comandos** &mdash; Pergunte diretamente ao agent:
  `"Como funciona /eng.start?"` | `"Qual a diferenca entre /eng.work e /pr?"` | `"O que e CDD?"`
