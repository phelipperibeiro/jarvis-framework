---
env_file: "@/ENV.md"
---

> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Overlay de empresa — precedência na chamada

Perfil ativo: `COMPANY_PROFILE` do `ENV.md` (vazio = `stark-industries`, o overlay padrão). O overlay fica em `$IDE/overlays/{COMPANY_PROFILE}/` e espelha o core: `workflows/`, `skills/`, `agents/`, `rules/`, `rules-on-demand/`, `templates/`.

**Antes de seguir um workflow, skill ou agente, ou de ler um template ou uma rule-on-demand por caminho**, confira `$IDE/overlays/{COMPANY_PROFILE}/{tipo}/{mesmo caminho}`. Existe → leia-o e siga-o **em vez** do do core. Não existe → siga o core, sem aviso.

Precedência: **overlay > especialização de stack > core.**

Não escreva no overlay: só o `/jarvis-fork` (CLI `jarvis fork`) grava lá, com confirmação. `rules/` não passa por aqui: a cópia em `$IDE/rules/` já vem resolvida na instalação (sync e Passo 8 do `/jarvis-init`), marcada com `> Overlay: …` quando é da empresa.
