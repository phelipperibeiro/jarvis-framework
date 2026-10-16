---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Card ou número de controle da tarefa (TASK_MANAGER do ENV.md; freelance = número de controle).
task_key: {TASK-123}

# URL do card no task manager (padrão da eng.integrations-rules.md). Vazio no modo freelance.
card_url: {URL}

# Pull/Merge Request aberto: número e URL. O daily.md só existe com PR aberto.
pr: {#n URL}

# Branch de trabalho e branch base (Branch base: do architecture.md).
branch: {branch}
base: {main | dev | outra}

# Dias efetivamente trabalhados no período eng.start → registro (descontados fim de semana não
# trabalhado, feriados e outros dias não trabalhados informados). Ex.: "3 (2026-10-13, 2026-10-14, 2026-10-15)"
worked_days: {n (datas)}

# A descrição usa o formato post mortem? Opções: yes | no
# yes = bugfix/hotfix, mais de 1 dia trabalhado, ou investigação longa confirmada pelo usuário
post_mortem: {yes | no}

# Data da última atualização deste arquivo (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}
---

# Daily — {TASK_KEY}

> Registro pessoal do esforço: narrativa auditável e linha pronta para o timesheet. Fica só na sessão, nunca é publicado. Uma seção por data (`## AAAA-MM-DD`), no formato abaixo, para um comando futuro juntar os registros de um dia.

## {AAAA-MM-DD}

### Descrição detalhada

{Um parágrafo narrativo: o contexto técnico, o que foi feito e as decisões. Detalhe suficiente para servir de embasamento em questionamentos futuros, auditorias ou consultas técnicas.}

**Post mortem** _(só quando `post_mortem: yes`)_
- **Problema e causa raiz:** {o problema identificado e a causa raiz, se aplicável}
- **Investigação:** {o raciocínio e o processo de investigação adotado}
- **Solução / direcionamento:** {a solução ou o direcionamento técnico final}

**Mudança de escopo** _(só quando pedida pela liderança: gerente, PM, tech lead)_
- **O que mudou:** {…}
- **Quem pediu:** {papel/nome, como o usuário informou}
- **Impacto:** {no prazo, no esforço, no resultado}

**Referências:** card [{TASK_KEY}]({URL}) · PR/MR [#{n}]({URL}) · commits `{hash}`, `{hash}`

### Timesheet

`{TASK_KEY} — {resumo da atividade em uma única linha}`
