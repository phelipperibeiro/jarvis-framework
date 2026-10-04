---
description: Workflow de Engenharia para Resposta a Incidentes de Seguranca (CVEs, vulnerabilidades, breaches)
globs:
  alwaysApply: false
recommended_model: claude-opus-4-6-20250529
model_tier: very_high
model_justification: Incident response requer analise rapida e precisa de vulnerabilidades, avaliacao de impacto e decisoes de contencao que afetam producao
---

# Workflow de Engenharia – Security Incident Response

## Objetivo

Guiar o SENTINEL (ENG) na resposta estruturada a incidentes de seguranca — desde CVEs criticas ate vulnerabilidades reportadas e breaches. Prioriza contencao rapida seguida de correcao definitiva e documentacao preventiva.

---

## Quando Usar Este Workflow

- CVE critica publicada que pode afetar dependencias do projeto
- Vulnerabilidade reportada por ferramenta de scan (SAST/DAST)
- Secret vazado no repositorio ou em producao
- Incidente de seguranca reportado (acesso indevido, dados expostos)
- Alerta de dependencia comprometida (supply chain attack)

---

## Pre-requisitos

### Validar ENV.md

```bash
if [ ! -f "$IDE/ENV.md" ]; then
  echo "ENV.md nao encontrado. Execute /jarvis-init primeiro."
  exit 1
fi
```

### Entrada do Incidente

```
/eng.security-incident [referencia]

Onde [referencia] pode ser:
- CVE ID: CVE-2024-XXXXX
- URL do advisory: https://github.com/advisories/GHSA-xxxx
- Descricao: "SQL injection no endpoint /api/users"
- Card do $TASK_MANAGER: TASK-1234
```

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Fase 4 – Remediation › 4.1 Implementar correcao | `/eng-security-cybersecurity` | Sempre — como referência de padrões seguros ao implementar a correção |

---

## Fase 1 – Triage

**Objetivo**: classificar rapidamente a severidade e impacto.

### 1.1 Coletar informacoes

```markdown
## Triage

**Referencia**: {CVE, advisory URL ou descricao}
**Reportado por**: {ferramenta, pesquisador, equipe interna}
**Data do report**: {ISO-8601}
**Tipo**: {CVE em dependencia | vulnerabilidade no codigo | secret leak | breach | outro}
```

### 1.2 Classificar severidade

| Criterio | CRITICAL | HIGH | MEDIUM | LOW |
|----------|----------|------|--------|-----|
| Explorabilidade | Remota, sem auth | Remota, com auth | Local ou com privilegio | Teorica |
| Impacto | RCE, data breach, auth bypass | Escalacao de privilegio, data leak parcial | DoS, info disclosure limitada | Baixo impacto |
| Dados afetados | PII, financeiro, credenciais | Dados internos sensiveis | Dados nao-sensiveis | Nenhum |
| Superficie | Endpoint publico | Endpoint autenticado | Funcao interna | Codigo morto |

### 1.3 Decisao de urgencia

| Severidade | SLA de resposta | Acao imediata |
|------------|-----------------|---------------|
| **CRITICAL** | Conter em 1h, corrigir em 24h | Notificar TL/CTO, iniciar contencao |
| **HIGH** | Corrigir em 48h | Notificar TL, planejar correcao |
| **MEDIUM** | Corrigir na proxima sprint | Criar card, documentar |
| **LOW** | Backlog | Documentar, corrigir quando conveniente |

---

## Fase 2 – Assessment

**Objetivo**: determinar se e como o projeto e afetado.

### 2.1 Para CVEs em dependencias

```bash
# Verificar se a dependencia vulneravel esta instalada
grep "{pacote}" package.json package-lock.json 2>/dev/null
# ou
pip show {pacote} 2>/dev/null

# Verificar versao instalada vs. versao afetada
npm ls {pacote} 2>/dev/null

# Verificar se o codigo usa a funcao/modulo vulneravel
grep -rn --include="*.ts" --include="*.js" "{funcao_ou_import_afetado}" src/ 2>/dev/null
```

### 2.2 Para vulnerabilidades no codigo

```bash
# Localizar o codigo vulneravel
grep -rn --include="*.ts" --include="*.js" --include="*.py" "{pattern}" src/ 2>/dev/null

# Verificar se o endpoint e acessivel publicamente
# Verificar se ha guards/middleware protegendo
# Verificar se inputs sao validados antes de chegar ao ponto vulneravel
```

### 2.3 Para secrets vazados

```bash
# Verificar se o secret ainda esta ativo
# Verificar onde o secret e usado
grep -rn "{secret_parcial}" . --include="*.ts" --include="*.js" --include="*.env" --include="*.yml" 2>/dev/null

# Verificar historico git
git log --all --oneline -S "{secret_parcial}" 2>/dev/null | head -10
```

### 2.4 Documentar assessment

```markdown
## Assessment

**Projeto afetado**: sim | nao | parcialmente
**Versao afetada**: {versao da dependencia ou do codigo}
**Superficie de ataque**: {endpoints, funcoes, configs afetadas}
**Dados em risco**: {tipo de dados que podem ser comprometidos}
**Exploracao confirmada**: sim | nao | nao verificavel
```

---

## Fase 3 – Containment

**Objetivo**: limitar o impacto imediato enquanto a correcao definitiva e preparada.

### Acoes de contencao por tipo

| Tipo | Acao de contencao |
|------|-------------------|
| Endpoint vulneravel | Desabilitar endpoint ou adicionar guard temporario |
| Secret vazado | Revogar/rotacionar o secret IMEDIATAMENTE |
| Dependencia com CVE | Avaliar se patch esta disponivel, aplicar se possivel |
| Auth bypass | Adicionar validacao extra, revogar sessions ativas se necessario |
| Data exposure | Verificar logs de acesso, avaliar notificacao (LGPD 72h) |

### Documentar contencao

```markdown
## Containment

**Acao tomada**: {descricao da contencao}
**Timestamp**: {ISO-8601}
**Reversivel**: sim | nao
**Impacto da contencao**: {funcionalidades temporariamente afetadas}
```

> **IMPORTANTE**: Contencao e temporaria. Sempre seguir com correcao definitiva.

---

## Fase 4 – Remediation

**Objetivo**: implementar correcao definitiva e validar.

### 4.1 Implementar correcao

- Usar o skill `eng-security-cybersecurity` como referencia de padroes seguros
- Corrigir a causa raiz (nao apenas o sintoma)
- Adicionar validacao/sanitizacao onde necessario
- Atualizar dependencias afetadas

### 4.2 Validar correcao

```bash
# Rodar testes existentes
npm test 2>/dev/null

# Verificar que a vulnerabilidade foi corrigida
# (reproduzir o vetor de ataque e confirmar que falha)

# Rodar npm audit novamente (se CVE em dep)
npm audit 2>/dev/null
```

### 4.3 Documentar correcao

```markdown
## Remediation

**Correcao aplicada**: {descricao tecnica}
**Arquivos alterados**: {lista}
**Testes adicionados**: {sim/nao — quais}
**Dependencias atualizadas**: {pacote@versao_antiga → pacote@versao_nova}
```

---

## Fase 5 – Post-mortem

**Objetivo**: documentar o incidente para aprendizado e prevencao.

### Template de post-mortem

```markdown
# Security Post-mortem

**Incidente**: {titulo}
**Severidade**: {CRITICAL|HIGH|MEDIUM|LOW}
**Data de deteccao**: {ISO-8601}
**Data de resolucao**: {ISO-8601}
**Tempo de resolucao**: {duracao}

## Timeline

| Timestamp | Evento |
|-----------|--------|
| {t0} | Vulnerabilidade reportada/detectada |
| {t1} | Triage concluida — severidade {X} |
| {t2} | Contencao aplicada |
| {t3} | Correcao implementada e testada |
| {t4} | Deploy da correcao |

## Causa Raiz

{O que causou a vulnerabilidade? Quando foi introduzida?}

## Impacto

{Dados afetados, usuarios impactados, janela de exposicao}

## Correcao

{O que foi feito para resolver}

## Prevencao

{O que sera feito para evitar recorrencia}

- [ ] {acao preventiva 1}
- [ ] {acao preventiva 2}
- [ ] {acao preventiva 3}

## Licoes Aprendidas

{O que o time aprendeu com este incidente}
```

---

## Regras

### Nunca
- Minimizar um incidente de seguranca ("provavelmente ninguem explorou")
- Deixar um secret vazado ativo enquanto investiga — revogar PRIMEIRO
- Aplicar correcao sem testes de validacao
- Pular o post-mortem ("ja foi resolvido, vamos seguir")
- Expor detalhes do incidente em canais publicos antes da correcao

### Sempre
- Comunicar achados CRITICAL ao TL/responsavel imediatamente
- Revogar secrets vazados antes de qualquer outra acao
- Documentar timeline completa do incidente
- Verificar se a vulnerabilidade afeta outros servicos do projeto
- Propor melhorias preventivas no post-mortem
