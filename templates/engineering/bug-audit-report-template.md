---
# Card ou número de controle, se houver; sem chave, o nome da pasta da sessão.
task_key: {TASK-123 | bug-audit-AAAAMMDD-HHMMSS}

# Data da varredura (YYYY-MM-DD).
created_at: {YYYY-MM-DD}

# Escopo varrido: pasta, módulo ou --all.
escopo: {escopo}

# Como a varredura rodou. Opções: sequência | paralelo (com o número de subagentes)
execucao: {sequência | paralelo (N subagentes)}
---

# Varredura: {escopo}

> Relatório do `/eng.debug` (caso varrer). Fica na sessão; o comando não abre nem comenta card. Cada suspeito traz o card pronto para o usuário abrir.

## Resumo

- **Suspeitos:** {N} — P0: {N} · P1: {N} · P2: {N} · P3: {N}
- **Por categoria:** BUG-CRÍTICO {N} · BUG-ALTO {N} · BUG-MÉDIO {N} · BUG-BAIXO {N} · CODE-SMELL {N} · DÉBITO-TÉCNICO {N} · SEGURANÇA {N} · PERFORMANCE {N}
- **Verificações locais:** lint {ok | n problemas | não configurado} · testes {ok | n falhando | não configurados}
- **Fora do escopo ou não analisado:** {o que ficou de fora e por quê}

## Suspeitos por prioridade

> Um suspeito é um problema provável, ainda não confirmado como bug. Para confirmar, investigue-o com o `/eng.debug` (caso investigar).

### P0 — ação imediata

#### {n}. {título}

- **Categoria:** {BUG-CRÍTICO | SEGURANÇA | …}
- **Localização:** `{arquivo}:{linha}`
- **O que foi visto:** {trecho ou padrão encontrado}
- **Impacto:** {no usuário ou no negócio}
- **Sugestão de correção:** {como corrigir}

**Card pronto:**

```
Título: {título claro}
Tipo: {Bug | Task | Security}
Prioridade: P0
Labels: bug-audit, {categoria}
Descrição:
  Comportamento atual: {…}
  Comportamento esperado: {…}
  Localização: {arquivo}:{linha}
  Impacto: {…}
  Sugestão de correção: {…}
```

### P1 — próxima sprint

{mesma estrutura}

### P2 — backlog

{mesma estrutura}

### P3 — débito técnico

{mesma estrutura}

## Áreas de risco

- **Áreas críticas sem testes:** {área}: {motivo}
- **Código complexo:** `{arquivo}`: {sinal}
- **Dependências com problema conhecido:** {dependência, versão atual, versão segura}

## Recomendações

- **Curto prazo (1–2 sprints):** {…}
- **Médio prazo (3–6 meses):** {…}
- **Prevenção:** {testes, observabilidade, regras de lint, hooks}

## Próximo passo

{Investigar o suspeito {n} com o `/eng.debug` (caso investigar) | abrir os cards P0 e P1 no board | nova varredura em {área}}
