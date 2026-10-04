---
name: jarvis-create-specialization
description: >
  Cria uma especialização de stack (backend ou frontend) a partir do código do projeto: lê o
  projeto, gera o skill (SKILL.md e references/), mostra para revisão e, só depois da confirmação,
  grava eng-<área>-<stack> com a marcação area e stack e o registra na lista da área no ENV.md.
  Trigger: Use para adaptar o framework a uma stack nova ou do seu projeto (por exemplo, Go ou
  Vue), sem escrever o skill à mão nem editar arquivos do framework.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[backend|frontend] [stack]"
disable-model-invocation: false
---

# Jarvis Create Specialization - Criação guiada de especialização de stack

## Objetivo

Gerar uma especialização **fiel ao código do projeto** e deixá-la ligada sem passos extras. O criador lê o projeto, monta o skill, mostra tudo para revisão e **só depois da sua confirmação** grava e registra.

A especialização **soma-se** à skill base da área (`eng-backend` ou `eng-frontend`) e guarda só o que **depende da stack**. O que continua válido ao trocar de linguagem já está na base e não é repetido.

## Entrada

- `$ARGUMENTS` - (Opcional) `[backend|frontend] [stack]`, por exemplo `backend golang`. O que faltar, pergunte (uma pergunta por vez).

## Recursos

- **ENV**: `$IDE/ENV.md` (listas `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`)
- **Skills instalados**: `$IDE/skills/` (destino da gravação)
- **Moldes**: `assets/skill-especializacao-template.md` e `assets/referencia-template.md`
- **Regra relacionada**: `$IDE/rules/engineering/eng.specializations-rules.md`
- **Skill de consulta**: `$IDE/skills/jarvis-list-specializations/SKILL.md`

## Pré-requisito

Verifique se o `$IDE/ENV.md` existe. Se não existir, interrompa e oriente:

```
⚠️ O framework não foi inicializado.
O arquivo ENV.md não existe. Execute /jarvis-init antes de continuar.
```

## Quando Usar

- O projeto usa uma stack que o framework não traz pronta (por exemplo, Go, PHP, Vue)
- Uma especialização escrita à mão ou copiada de outro projeto ficou desatualizada
- Quer acrescentar outra stack a qualquer momento, na instalação ou depois

**Não use** para listar o que já existe (use `/jarvis-list-specializations`), para áreas além de backend e frontend, nem para remover skills ou itens das listas.

---

## Fluxo

> **Regra de ouro:** nada é gravado nem registrado antes da confirmação explícita da pessoa. Cancelar não altera nada.

### Passo 1: Validar a entrada

1. **Área:** só `backend` ou `frontend`. Qualquer outra:
   `ℹ️ A área "{área}" ainda não é suportada. Só backend e frontend. Nada foi criado.` e **fim**.
2. **Stack:** minúsculas e kebab-case, que casem com `^[a-z0-9][a-z0-9-]*$` (por exemplo, `golang`, `vue3-quasar`). Se não casar, recuse, explique o formato aceito (letras minúsculas, números e hífen) e peça outra. A stack vira parte de um caminho: **nunca** a use sem essa validação.

### Passo 2: Validar o ENV.md (antes de qualquer gravação)

Leia a variável da área (`BACKEND_SPECIALIZATIONS` ou `FRONTEND_SPECIALIZATIONS`) em `$IDE/ENV.md`:

```bash
grep -E '^BACKEND_SPECIALIZATIONS=' $IDE/ENV.md
```

Se a variável **não existir** (ausente; vazia é válida), **interrompa antes de gravar qualquer coisa**:
`⚠️ A variável {VAR} não existe no ENV.md. Execute /jarvis-init e escolha Upgrade (C) para acrescentá-la. Nada foi criado.`
**Nunca** crie a variável por conta própria.

### Passo 3: Verificar se há código

Procure, na pasta do projeto, arquivos-fonte e arquivos de dependência (`package.json`, `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `pyproject.toml`, `requirements.txt`, `Gemfile`, `Cargo.toml`, `*.csproj` e afins), **ignorando** `node_modules`, `vendor`, `.git` e pastas de build.

- **Nenhum encontrado:** `ℹ️ Não encontrei código no projeto. Não criei nenhum skill; a skill base de {área} continua valendo.` e **fim**.
- **Mais de uma pasta candidata** (workspace com vários projetos, ou `WORKSPACE_REPOS`): pergunte qual ler.

### Passo 4: Ler o projeto

Leia, **nesta ordem e dentro do limite**:

1. Arquivos de dependência e configuração (não contam no limite)
2. A estrutura de pastas
3. **No máximo 15 arquivos de código por área**, de 3 a 5 por camada, escolhendo os representativos (a pessoa pode apontar mais arquivos ou outra pasta)
4. A configuração de testes, lint e formatação
5. A documentação oficial atual das bibliotecas principais, via Context7. Se o Context7 estiver indisponível, siga só com o código e marque o que dependeria da documentação como "a validar"

**Nunca leia** `.env*`, chaves, certificados (`*.pem`, `*.key`), arquivos de credenciais ou de segredos. Se encontrar algo assim, ignore e **não cite o valor**.

### Passo 5: Gerar o skill (em memória)

Use os moldes de `assets/`. Gere:

- **`SKILL.md`** com **menos de 500 linhas**: Objetivo, Quando Usar, Stack do Projeto, Comandos, Índice de `references/`, Regras (Nunca e Sempre) e A validar. Frontmatter com `name`, `description` (com o gatilho de quando usar), `metadata.author: jarvis-create-specialization`, `version`, `area` e `stack`
- **`references/`**, um arquivo por tema, **só dos temas que o projeto confirma**: `1-convencoes-do-projeto.md`, `2-estrutura-e-arquitetura.md`, `3-padroes-de-codigo.md`, `4-testes.md`, `5-ferramentas-e-comandos.md`. Tema sem confirmação: **o arquivo não é criado** (nada de arquivo vazio)

Regras do conteúdo:

- **Cada afirmação cita o arquivo de origem.** O que não foi confirmado vai para "A validar", **nunca como fato**
- Só entra o que **depende da stack**. Pergunta-chave: "isso continua válido se eu mudar de linguagem?". Se sim, fica na base e não é repetido
- **Nunca** copie valores de segredos, tokens, chaves, senhas ou dados pessoais: cite padrões, não valores
- Exemplos de código são trechos curtos e reais do projeto

### Passo 6: Revisão

Mostre **tudo de uma vez**: o `SKILL.md` e cada arquivo de `references/`, com o caminho em que serão gravados. Pergunte: **confirmar**, **ajustar** ou **cancelar**.

- **Ajustar:** acrescente ou remova os detalhes pedidos, mostre de novo e repita até confirmar ou cancelar
- **Cancelar:** fim. Nada foi gravado nem registrado
- Resposta ambígua: **não grave**; pergunte de novo

### Passo 7: Skill já existente (antes de gravar)

Defina o destino: `$IDE/skills/eng-{área}-{stack}/`. Antes de gravar, verifique:

1. **A pasta já existe, ou o item já está na lista:** mostre o que muda (arquivos novos, alterados e removidos) e pergunte se deve sobrescrever. **Só sobrescreva com confirmação explícita.** Se a pessoa recusar, **nada muda**.
2. **A pasta existe e é do framework** (frontmatter com `metadata.author: jarvis-team`, por exemplo `eng-backend-nestjs`): avise que **o `jarvis init --force` sobrescreve essa pasta com o skill do framework**, e sugira outro nome (por exemplo, `eng-backend-nestjs-<sufixo>`) ou registrar o skill que já existe. Só siga com confirmação.
3. **O item está na lista mas a pasta não existe:** avise e ofereça criar a pasta.

Ao sobrescrever um skill que já está na lista, **não duplique** o item.

### Passo 8: Gravar o skill

Com a confirmação, grave **só** em `$IDE/skills/eng-{área}-{stack}/` (nunca fora dela e nunca no código do projeto): `SKILL.md` e os `references/*.md` dos temas confirmados.

- O `name` do frontmatter é **igual** ao nome da pasta, com `metadata.area` e `metadata.stack`
- **Releia** o que gravou e confira: os arquivos existem, têm conteúdo e o frontmatter devolve `name`, `area` e `stack`:

```bash
awk 'BEGIN{fm=0} /^---[[:space:]]*$/{fm++; next} fm==1 && /^name:/{n=$2} fm==1 && /^[[:space:]]+area:/{a=$2} fm==1 && /^[[:space:]]+stack:/{s=$2} END{printf "%s|area=%s|stack=%s\n", n, a, s}' $IDE/skills/eng-{área}-{stack}/SKILL.md
```

- Se **qualquer** arquivo falhar: **não registre** na lista e informe o que falhou

### Passo 9: Registrar na lista

1. Leia a linha `VAR=...` da área e separe os itens (aceita colchetes, espaços e aspas):
   `grep -E '^BACKEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'`
2. Se o item **não está** na lista: acrescente ao **final**. Os demais itens ficam como estavam; só o formato da linha é normalizado (**separado por vírgula, sem colchetes**)
3. Edite **só a linha dessa variável** (nunca outra linha do `ENV.md`) e **releia** o `ENV.md` para confirmar o resultado
4. Se a gravação da lista falhar (skill gravado, lista não): diga que o skill existe mas **não** está registrado e mostre a linha a acrescentar à mão. **Nunca** registre um skill que não foi gravado

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca

- Gravar ou registrar antes da confirmação explícita
- Ler `.env*`, chaves, certificados ou credenciais, ou copiar valores de segredos para o skill
- Apresentar como fato o que não foi confirmado no código
- Alterar o código do projeto
- Criar a variável da lista ou editar outra linha do `ENV.md`
- Duplicar um item na lista, ou remover itens existentes
- Gravar fora de `$IDE/skills/`
- Usar a stack em caminho sem validar `^[a-z0-9][a-z0-9-]*$`
- Criar especialização de área além de backend e frontend

### Sempre

- Citar o arquivo de origem de cada afirmação
- Mostrar o skill completo (com `references/`) antes de gravar
- Reler o que gravou, no skill e no `ENV.md`
- Avisar quando o nome coincide com um skill do framework

---

## Tratamento de Erros

| Situação | O que fazer |
|----------|-------------|
| Área fora de backend e frontend | Informar que não é suportada; fim |
| Stack fora do padrão de nome | Recusar, explicar o formato e pedir outra |
| `ENV.md` ou variável da lista ausente | Interromper antes de gravar; orientar `/jarvis-init` (Upgrade) |
| Sem código no projeto | Informar; a skill base continua valendo; fim |
| Context7 indisponível | Seguir só com o código; marcar o que depende da documentação como "a validar" |
| Nome coincide com skill do framework | Avisar do `jarvis init --force`; sugerir outro nome |
| Falha ao gravar o skill | Não registrar na lista; informar o que falhou |
| Falha ao gravar a lista | Informar que o skill existe e não está registrado; mostrar a linha |

---

## Limitações

A pasta de skills considerada é `$IDE/skills/`. Claude Code e Cursor são os suportados; em outras IDEs (por exemplo, Kiro e Codex) a estrutura é outra e o criador pode não funcionar. Só gera especializações de backend e frontend.

---

## Checklist de Conclusão

- [ ] Área e stack validadas
- [ ] Variável da lista existe no `ENV.md`
- [ ] A pessoa revisou e confirmou o skill
- [ ] Skill gravado em `$IDE/skills/eng-{área}-{stack}/` e relido
- [ ] Item acrescentado ao final da lista, sem duplicar, e `ENV.md` relido
- [ ] Nenhum segredo no skill gerado

---

## Mensagem de Conclusão

```
✅ Especialização criada: eng-{área}-{stack}

📁 Skill: $IDE/skills/eng-{área}-{stack}/SKILL.md
📚 references/: {arquivos gravados}
📋 {VAR}={lista atualizada}

Os comandos eng.* já carregam este skill na próxima tarefa de {área}.
Revise a seção "A validar" do skill assim que puder.
```

---

## Referências

- `$IDE/rules/engineering/eng.specializations-rules.md`: listas, formato e validação do nome
- `$IDE/skills/jarvis-list-specializations/SKILL.md`: consulta do que está instalado e registrado
- `$IDE/skills/AGENTS.md`: áreas reconhecidas e padrão de nomes
