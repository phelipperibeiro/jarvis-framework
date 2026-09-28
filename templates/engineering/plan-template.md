# {NOME_DA_FEATURE}

> 📋 **Plano de Execução** | Jira: [{TASK_MANAGER_KEY}]({TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY})
>
> Se você está trabalhando nesta feature, **atualize este arquivo** conforme progride.

---

## Resumo

{Breve descrição do objetivo da feature em 2-3 frases}

---

## Pré-requisitos

- [ ] `architecture.md` revisado
- [ ] Ambiente de desenvolvimento configurado
- [ ] Dependências instaladas
- [ ] Branch base atualizada

---

## FASE 1: {Nome da Fase} [Não Iniciada ⏳]

> ⏱️ **Tempo estimado**: ~{X} minutos
> 
> 📝 **Objetivo**: {Objetivo específico desta fase}

### 1.1 {Nome da Tarefa} [Não Iniciada ⏳]

**O que fazer:**
{Descrição clara da ação a ser realizada}

**Onde fazer:**
- `{caminho/do/arquivo.ts}`

**Como fazer:**
1. {Passo 1}
2. {Passo 2}
3. {Passo 3}

**Como verificar:**
- {Critério de conclusão / teste}

### 1.2 {Nome da Tarefa} [Não Iniciada ⏳]

**O que fazer:**
{Descrição clara da ação a ser realizada}

**Onde fazer:**
- `{caminho/do/arquivo.ts}`

**Como fazer:**
1. {Passo 1}
2. {Passo 2}

**Como verificar:**
- {Critério de conclusão / teste}

### 1.T Testes da Fase 1 [Não Iniciada ⏳]

> 🧪 **Obrigatório**: Toda fase deve incluir testes para o código implementado.

**O que testar:**
- {Funcionalidade implementada em 1.1}
- {Funcionalidade implementada em 1.2}

**Tipos de teste:**
- [ ] Unitário: {funções/métodos a testar}
- [ ] Integração: {endpoints/serviços a testar} (se aplicável)
- [ ] E2E: {fluxo a testar} (se aplicável)

**Onde criar:**
- `{caminho/dos/testes}`

**Cobertura mínima:** {%} (conforme `architecture.md` seção 6.5)

**Como verificar:**
- Executar `{comando de teste}` e verificar cobertura
- Todos os testes passando

### Comentários da Fase 1:

{Espaço para anotar mudanças, aprendizados e decisões durante a execução}

---

## FASE 2: {Nome da Fase} [Não Iniciada ⏳]

> ⏱️ **Tempo estimado**: ~{X} minutos
>
> 📝 **Objetivo**: {Objetivo específico desta fase}
>
> ⚠️ **Dependência**: Requer FASE 1 completada

### 2.1 {Nome da Tarefa} [Não Iniciada ⏳]

**O que fazer:**
{Descrição clara da ação a ser realizada}

**Onde fazer:**
- `{caminho/do/arquivo.ts}`

**Como fazer:**
1. {Passo 1}
2. {Passo 2}

**Como verificar:**
- {Critério de conclusão / teste}

### 2.2 {Nome da Tarefa} [Não Iniciada ⏳]

**O que fazer:**
{Descrição clara da ação a ser realizada}

**Onde fazer:**
- `{caminho/do/arquivo.ts}`

**Como fazer:**
1. {Passo 1}
2. {Passo 2}

**Como verificar:**
- {Critério de conclusão / teste}

### 2.T Testes da Fase 2 [Não Iniciada ⏳]

> 🧪 **Obrigatório**: Toda fase deve incluir testes para o código implementado.

**O que testar:**
- {Funcionalidade implementada em 2.1}
- {Funcionalidade implementada em 2.2}

**Tipos de teste:**
- [ ] Unitário: {funções/métodos a testar}
- [ ] Integração: {endpoints/serviços a testar} (se aplicável)
- [ ] E2E: {fluxo a testar} (se aplicável)

**Onde criar:**
- `{caminho/dos/testes}`

**Cobertura mínima:** {%} (conforme `architecture.md` seção 6.5)

**Como verificar:**
- Executar `{comando de teste}` e verificar cobertura
- Todos os testes passando

### Comentários da Fase 2:

{Espaço para anotar mudanças, aprendizados e decisões durante a execução}

---

## FASE 3: {Nome da Fase} [Não Iniciada ⏳]

> ⏱️ **Tempo estimado**: ~{X} minutos
>
> 📝 **Objetivo**: {Objetivo específico desta fase}
>
> ⚠️ **Dependência**: Requer FASE 2 completada

### 3.1 {Nome da Tarefa} [Não Iniciada ⏳]

**O que fazer:**
{Descrição clara da ação a ser realizada}

**Onde fazer:**
- `{caminho/do/arquivo.ts}`

**Como fazer:**
1. {Passo 1}
2. {Passo 2}

**Como verificar:**
- {Critério de conclusão / teste}

### 3.T Testes da Fase 3 [Não Iniciada ⏳]

> 🧪 **Obrigatório**: Toda fase deve incluir testes para o código implementado.

**O que testar:**
- {Funcionalidade implementada em 3.1}

**Tipos de teste:**
- [ ] Unitário: {funções/métodos a testar}
- [ ] Integração: {endpoints/serviços a testar} (se aplicável)
- [ ] E2E: {fluxo a testar} (se aplicável)

**Onde criar:**
- `{caminho/dos/testes}`

**Cobertura mínima:** {%} (conforme `architecture.md` seção 6.5)

**Como verificar:**
- Executar `{comando de teste}` e verificar cobertura
- Todos os testes passando

### Comentários da Fase 3:

{Espaço para anotar mudanças, aprendizados e decisões durante a execução}

---

## Dependências entre Tarefas

```
FASE 1
  ├── 1.1 ──┐
  └── 1.2 ──┴──→ FASE 2
                   ├── 2.1 (sequencial) → 2.2
                   └──────────────────────→ FASE 3
                                              └── 3.1
```

**Legenda:**
- `→` = Dependência sequencial (uma após a outra)
- Tarefas no mesmo nível podem ser paralelas

---

## Notas Importantes

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| {Risco 1} | {Alta/Média/Baixa} | {Alto/Médio/Baixo} | {Ação preventiva} |

### Pontos de Atenção

- {Ponto 1}
- {Ponto 2}

### Decisões Pendentes

- [ ] {Decisão que precisa ser tomada}

---

## Histórico de Atualizações

| Data | Fase | Status | Observação |
|------|------|--------|------------|
| {DD/MM/AAAA} | - | Criado | Plano inicial criado |

---

## Checklist Final

- [ ] Todas as fases completadas ✅
- [ ] Todos os testes passando
- [ ] Código revisado
- [ ] Documentação atualizada
- [ ] Pronto para PR
