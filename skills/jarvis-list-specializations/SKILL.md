---
name: jarvis-list-specializations
description: >
  Lista as especializações de stack instaladas no projeto (backend e frontend), a área de cada uma
  e se ela está registrada em BACKEND_SPECIALIZATIONS ou FRONTEND_SPECIALIZATIONS. Só lê: não altera
  o ENV.md, as listas nem nenhum skill.
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
argument-hint: "[backend|frontend]"
disable-model-invocation: false
---

# Jarvis List Specializations - Consulta das especializações de stack

## Objetivo

Mostrar, sem alterar nada, **todas as especializações instaladas** no projeto, estejam ou não registradas nas listas do `ENV.md`, para a pessoa decidir o que ligar ou desligar.

## Entrada

- `$ARGUMENTS` - (Opcional) `backend` ou `frontend`, para listar só uma área. Vazio lista as duas.

## Recursos

- **ENV**: `$IDE/ENV.md` (listas `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS`)
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

Para cada área, leia a lista (aceita vírgula, colchetes, espaços e aspas):

```bash
grep -E '^BACKEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
grep -E '^FRONTEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'
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

| `metadata.area` | `metadata.stack` | Classificação |
|---|---|---|
| `backend` ou `frontend` | presente | **Especialização** da área |
| `backend` ou `frontend` | ausente | **Skill base** da área (não é especialização) |
| `global`, `product` ou outra | qualquer | Fora da listagem |
| ausente | qualquer | **Pendente** (sem marcação de área) |

### Passo 4: Cruzar com as listas

- Uma especialização está **registrada** se o `name` consta na lista da sua área.
- Um item da lista **sem skill instalado** aparece como "registrado sem skill instalado".
- Se `$ARGUMENTS` for `backend` ou `frontend`, mostre só essa área.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Saída

Por área, uma tabela:

```
### Backend
| Skill | Stack | Registrada |
|-------|-------|------------|
| eng-backend-golang | golang | ✅ |
| eng-backend-php | php | ➖ |

Registrado sem skill instalado: eng-backend-naoexiste
```

Depois, os **pendentes** em uma única linha:

```
Sem marcação de área (pendentes): eng-global-pr, eng-qa-gate, jarvis-context-detect, ...
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
