---
status: GO
branch: "{branch-name}"
date: "{YYYY-MM-DD HH:MM}"
qa: "{nome do QA responsável}"
version: "1.0"
---

# QA Sign-off — {branch-name}

**Decisão**: ✅ GO / 🚫 NO-GO
**Branch**: {branch-name}
**Data**: {YYYY-MM-DD HH:MM}
**QA Responsável**: {nome}

---

## Tasks incluídas neste deploy

| Task | Título |
|------|--------|
| {ID} | {título} |

---

## Cobertura verificada

| Área / Domínio | E2E | Exploratório | Quality Gate |
|----------------|-----|-------------|-------------|
| {domínio} | ✅ passou / ⚠️ parcial / ❌ ausente | ✅ / ⚠️ / ❌ | ✅ / ⚠️ / ❌ |

---

## Bugs abertos relacionados

| ID | Título | Decisão QA |
|----|--------|------------|
| {ID} | {título} | Bloqueador / Aceito com ressalva / Não relacionado |

---

## Ressalvas aceitas

> Listar itens que não estão 100% cobertos mas foram aceitos conscientemente com justificativa.

- {ressalva}: {motivo da aceitação}

---

## Decisão final

**{✅ GO — aprovado para deploy} / {🚫 NO-GO — bloqueadores em aberto}**

{Justificativa em 1-2 linhas}
