# Template — Sessão de Teste Exploratório

Documento de registro de sessão exploratória estruturada.
Preencher antes, durante e após a sessão conforme indicado.

---

## Cabeçalho

```markdown
**Sessão ID**: EXP-{YYYYMMDD}-{N}
**Data**: {YYYY-MM-DD}
**QA Responsável**: {nome}
**Duração**: {30 / 60 / 90} minutos
**Início**: {HH:MM}
**Fim**: {HH:MM}
**Ambiente**: {staging / homologação / produção}
**Versão / Build**: {tag ou hash de deploy}
```

---

## Charter

> Preencher antes de iniciar a sessão.

```
Explorar {área/feature/fluxo}
para descobrir {tipo de informação / riscos a validar}
com foco em {dimensão(ões) de qualidade — máximo 2}
```

**Dimensões escolhidas:**
- [ ] Funcionalidade
- [ ] Robustez
- [ ] Consistência
- [ ] Performance percebida
- [ ] Acessibilidade
- [ ] Segurança superficial
- [ ] Integração
- [ ] Regressão

---

## Escopo

> O que está dentro e fora desta sessão.

**Incluído:**
- {fluxo/área 1}
- {fluxo/área 2}

**Excluído (coberto em outra sessão ou fora de escopo):**
- {item excluído e motivo}

---

## Roteiro de Risco (pré-sessão)

> Listar as hipóteses de risco a investigar — não é um script, é um guia de atenção.

| # | Hipótese de risco | Área | Prioridade |
|---|-------------------|------|------------|
| 1 | {o que pode falhar?} | {componente} | Alta / Média / Baixa |
| 2 | | | |

---

## Log de Execução

> Preencher durante a sessão — anotações livres, não precisa ser formal.

```
{HH:MM} — {o que foi feito / observado}
{HH:MM} — {achado ou comportamento interessante}
{HH:MM} — {dúvida para investigar}
```

---

## Achados

> Classificar com severidade conforme `eng.qa.exploratory-session-rules.md`.

### Bugs

| ID | Título | Severidade | Reprodutível? | Evidência |
|----|--------|------------|---------------|-----------|
| B01 | {título conciso} | S{1-4} | Sim / Às vezes / Não | {link / screenshot} |

**Detalhamento por bug:**

#### B01 — {título}

**Severidade:** S{N}
**Passos para reproduzir:**
1. {passo 1}
2. {passo 2}
3. {passo N}

**Comportamento observado:** {o que aconteceu}
**Comportamento esperado:** {o que deveria acontecer}
**Ambiente/dados:** {URL, dados utilizados, usuário, etc.}
**Evidência:** {link para screenshot/vídeo}

---

### Melhorias (S5 — não são bugs)

| ID | Sugestão | Área |
|----|----------|------|
| M01 | {sugestão de UX/comportamento} | {área} |

---

## Cobertura da Sessão

| Hipótese | Investigada? | Resultado |
|----------|-------------|-----------|
| {hipótese 1} | ✅ Sim / ⚠️ Parcial / ❌ Não | {o que foi encontrado} |

---

## Status do Charter

- [ ] ✅ Completo — charter totalmente coberto
- [ ] ⚠️ Parcial — {o que ficou pendente e motivo}
- [ ] ❌ Bloqueado — {causa do bloqueio}

---

## Próximos Passos

- [ ] Criar cards no $TASK_MANAGER para bugs S1–S4 via `eng-qa-bug-report`
- [ ] {ação específica derivada dos achados}
- [ ] Agendar sessão de follow-up se necessário: {foco da próxima sessão}

---

## Métricas da Sessão

```
Bugs encontrados   : S1={N} · S2={N} · S3={N} · S4={N}
Melhorias (S5)     : {N}
Hipóteses cobertas : {N}/{total}
Charter            : completo / parcial / bloqueado
Tempo efetivo      : {minutos} min de {total definido} min
```
