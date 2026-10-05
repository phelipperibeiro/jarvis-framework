---
name: jarvis-list-specializations
description: >
  Lista as especializações instaladas no projeto nas 6 áreas com especialização (backend, frontend,
  qa, data, automation, platform), a área de cada uma e se está registrada na variável
  `{ÁREA}_SPECIALIZATIONS` correspondente. Só lê: não altera o ENV.md, as listas nem nenhum skill.
  Trigger: Use para ver quais especializações existem, quais estão registradas e quais skills estão
  sem marcação de área.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Bash Glob Grep
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[backend|frontend|qa|data|automation|platform]"
disable-model-invocation: false
---

# Jarvis List Specializations - Consulta das especializações de stack

## Objetivo

Mostrar, sem alterar nada, **todas as especializações instaladas** no projeto, estejam ou não registradas nas listas do `ENV.md`, para a pessoa decidir o que ligar ou desligar.

## Entrada

- `$ARGUMENTS` - (Opcional) `backend`, `frontend`, `qa`, `data`, `automation` ou `platform`, para listar só uma área. Vazio lista as 6.

## Recursos

- **ENV**: `$IDE/ENV.md` (listas `BACKEND_SPECIALIZATIONS`, `FRONTEND_SPECIALIZATIONS`, `QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS`, `PLATFORM_SPECIALIZATIONS`)
- **Skills instalados**: `$IDE/skills/*/SKILL.md` (só o frontmatter)
- **Regra relacionada**: `$IDE/rules/engineering/eng.specializations-rules.md`
- **Criação**: `$IDE/skills/jarvis-create-specialization/SKILL.md`

---

## Pré-requisito

Verificar se o `$IDE/ENV.md` existe. Se não existir, interromper e orientar:

```
⚠️ O framework não foi inicializado.
O arquivo ENV.md não existe. Execute /jarvis-init antes de continuar.
```

---

## Fluxo

### Passo 1: Ler as listas

Para cada uma das 6 áreas, leia a lista (aceita vírgula, colchetes, espaços e aspas):

```bash
grep -E '^BACKEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^FRONTEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^QA_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^DATA_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^AUTOMATION_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^PLATFORM_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
```

Se uma variável **não existir** no `ENV.md`, informe que ela falta (sem criá-la) e siga com o restante.

### Passo 2: Ler os skills instalados

Para cada `$IDE/skills/*/SKILL.md`, leia **só o frontmatter**: `name`, `metadata.area` e `metadata.stack`.

```bash
for f in $IDE/skills/*/SKILL.md; do
  awk -v f="$f" 'BEGIN{fm=0} /^---[[:space:]]*$/{fm++; next}
    fm==1 && /^name:/{n=$2}
    fm==1 && /^[[:space:]]+area:/{a=$2}
    fm==1 && /^[[:space:]]+stack:/{s=$2}
    END{printf "%s|area=%s|stack=%s\n", n, a, s}' "$f"
done
```

### Passo 3: Classificar

As 6 áreas com especialização têm uma skill base fixa: `eng-backend`, `eng-frontend`, `eng-qa`, `eng-data`, `eng-automation`, `eng-platform`.

| `metadata.area` | `metadata.stack` | `name` | Classificação |
|---|---|---|---|
| `backend` ou `frontend` | presente | — | **Especialização** da área |
| `backend` ou `frontend` | ausente | — | **Skill base** da área (não é especialização) |
| `qa`, `data`, `automation` ou `platform` | — | igual à skill base da área | **Skill base** da área |
| `qa`, `data`, `automation` ou `platform` | — | diferente da skill base | **Especialização** da área (nunca tem `stack`) |
| `global`, `product`, `ai`, `devops` ou outra | qualquer | — | Fora da listagem |
| ausente | qualquer | — | **Pendente** (sem marcação de área) |

### Passo 4: Cruzar com as listas

- Uma especialização está **registrada** se o `name` consta na lista `{ÁREA}_SPECIALIZATIONS` da sua área.
- Um item da lista **sem skill instalado** aparece como "registrado sem skill instalado".
- Se `$ARGUMENTS` for uma das 6 áreas, mostre só essa área.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Saída

Por área, uma tabela (backend/frontend têm coluna "Stack"; qa/data/automation/platform não):

```
### Backend
| Skill | Stack | Registrada |
|-------|-------|------------|
| eng-backend-golang | golang | ✅ |
| eng-backend-php | php | ➖ |

Registrado sem skill instalado: eng-backend-naoexiste

### QA
| Skill | Registrada |
|-------|------------|
| eng-qa-planner | ✅ |
```

Depois, os **pendentes** em uma única linha:

```
Sem marcação de área (pendentes): algum-skill-sem-area, outro-skill-sem-area, ...
```

Sem nenhuma especialização instalada, diga: `Nenhuma especialização instalada.`

---

## Regras

### Nunca
- Alterar o `ENV.md`, qualquer lista ou qualquer skill
- Criar uma variável ausente
- Ler o corpo dos skills além do frontmatter

### Sempre
- Mostrar o que existe mesmo que não esteja registrado
- Deixar claro o que é especialização, o que é skill base e o que está pendente

---

## Limitações

A pasta de skills considerada é `$IDE/skills/`. Em IDEs com outra estrutura (por exemplo, Kiro e Codex) a listagem pode não funcionar. Claude Code e Cursor são os suportados.

---

## Mensagem de Conclusão

```
Consulta de especializações concluída.

Especializações: {N} instaladas, {R} registradas
Pendentes (sem marcação de área): {P}

Para registrar uma especialização, inclua o nome do skill na lista da área no ENV.md.
Para criar uma nova a partir do código do projeto, use /jarvis-create-specialization.
```
