# Contexto Detectado - {TASK_MANAGER_KEY}

> Gerado automaticamente pelo skill `/jarvis-context-detect`
> Data: {DATA_GERACAO}

---

## CONTEXT_PROFILE

```yaml
CONTEXT_PROFILE:
  # Classificação da Tarefa
  tipo: {TIPO}           # hotfix | bugfix | feature | refactor
  urgencia: {URGENCIA}   # alta | normal | baixa

  # Calibração de Rigor
  rigor: {RIGOR}         # mínimo | padrão | alto

  # Calibração de Comunicação
  comunicacao: {COMUNICACAO}  # didático | direto | estratégico

  # Calibração de Autonomia
  autonomia: {AUTONOMIA}      # baixa | média | alta

  # Características do Projeto
  projeto:
    testes: {TESTES}          # existentes | ausentes
    typescript: {TYPESCRIPT}  # strict | relaxado | ausente
    cicd: {CICD}              # configurado | ausente
    linter: {LINTER}          # configurado | ausente
    cobertura: {COBERTURA}    # alta | média | baixa
```

---

## Resumo Visual

| Aspecto | Valor | Impacto no Workflow |
|---------|-------|---------------------|
| **Tipo** | {TIPO} | {IMPACTO_TIPO} |
| **Urgência** | {URGENCIA} | {IMPACTO_URGENCIA} |
| **Rigor** | {RIGOR} | {IMPACTO_RIGOR} |
| **Comunicação** | {COMUNICACAO} | {IMPACTO_COMUNICACAO} |
| **Autonomia** | {AUTONOMIA} | {IMPACTO_AUTONOMIA} |

---

## Detecções do Projeto

### Testes
- **Status**: {TESTES}
- **Impacto**: {IMPACTO_TESTES}
- **Arquivos encontrados**: {ARQUIVOS_TESTE}

### TypeScript
- **Status**: {TYPESCRIPT}
- **Impacto**: {IMPACTO_TYPESCRIPT}

### CI/CD
- **Status**: {CICD}
- **Pipeline**: {PIPELINE_DETECTADO}
- **Impacto**: {IMPACTO_CICD}

### Linter/Formatter
- **Status**: {LINTER}
- **Ferramenta**: {FERRAMENTA_LINT}
- **Impacto**: {IMPACTO_LINTER}

### Cobertura de Testes
- **Status**: {COBERTURA}
- **Percentual**: {PERCENTUAL_COBERTURA}

---

## Fonte das Calibrações

### Do ENV.md
- **POSITION**: {POSITION}
- **MAX_AI_EXECUTION_PERCENTAGE**: {MAX_AI_PERCENTAGE}

### Da Branch
- **Branch atual**: {BRANCH_ATUAL}
- **Tipo inferido**: {TIPO_INFERIDO_BRANCH}

### Da Mensagem
- **Sinais de urgência**: {SINAIS_URGENCIA}

---

## Ajustes Aplicados aos Workflows

### eng.start
- {AJUSTE_START_1}
- {AJUSTE_START_2}

### eng.plan
- {AJUSTE_PLAN_1}
- {AJUSTE_PLAN_2}

### eng.work
- {AJUSTE_WORK_1}
- {AJUSTE_WORK_2}

---

## Override

Para sobrescrever este perfil, execute:

```bash
/jarvis-context-detect --override tipo={NOVO_TIPO} urgencia={NOVA_URGENCIA}
```

Ou edite manualmente os valores acima e salve o arquivo.

---

## Validade

- **Gerado em**: {DATA_GERACAO}
- **Válido até**: {DATA_EXPIRACAO} (1 hora após geração)
- **Recalibrar**: Execute `/jarvis-context-detect` para atualizar

---

> Este perfil é usado automaticamente pelos workflows do Framework Jarvis.
> Documentação: `$IDE/templates/cdd-aplicado-a-prompts.md`
