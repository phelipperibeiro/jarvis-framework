---
description: Workflow de Engenharia para Audit de Bugs e Gaps de Qualidade
globs:
  alwaysApply: false
recommended_model: claude-sonnet-4-20250514
model_tier: very_high
model_justification: Audit requer análise profunda de código, identificação de patterns, priorização de riscos e geração de relatórios estruturados
---

# Workflow de Engenharia – Bug Audit & Quality Assessment

## Objetivo

Guiar o Bug Hunter (ENG) na análise sistemática de projetos existentes para identificar bugs latentes, code smells, gaps de qualidade e débito técnico, gerando relatório estruturado e cards no task manager ($TASK_MANAGER) para rastreamento.

---

## Quando Usar Este Workflow

- Onboarding em projeto legado
- Revisão de qualidade pós-incidente
- Assessment periódico de saúde do código
- Preparação para refactoring de larga escala
- Análise de risco antes de mudanças críticas

---

## Pré-requisitos

### Validar ENV.md

```bash
# Verificar existência e completude
if [ ! -f "$IDE/ENV.md" ]; then
  echo "⚠️ ENV.md não encontrado. Execute /init-jarvis primeiro."
  exit 1
fi

# Validar variáveis obrigatórias
required_vars=("WORKSPACE" "IDE" "SQUAD" "HUB" "AREA" "POSITION")
for var in "${required_vars[@]}"; do
  if ! grep -q "^$var=.\+" "$IDE/ENV.md"; then
    echo "⚠️ Variável $var não definida no ENV.md"
  fi
done
```

### Definir Escopo (Argumento)

```
/eng.bug-audit [escopo]

Onde [escopo] pode ser:
- Caminho de pasta/arquivo: ./src/components/
- Módulo específico: auth-service
- Projeto completo: --all
- Por tecnologia: --tech=react
```

---

## Fase 0 – Análise de Contexto (CDD)

> 📚 **Skill**: Use `/context-detect` se existir uma sessão ativa
> ⚙️ **Configurável**: Controlada pela variável `ENABLE_CDD` no ENV.md

### Verificação de Ativação

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou não definida → Pular esta fase
- Se `ENABLE_CDD=true` → Herdar contexto

### Calibração por Urgência

| urgencia | Comportamento no Audit |
|----------|------------------------|
| `alta` | Foco em bugs críticos e blockers, análise rápida |
| `normal` | Análise balanceada: bugs + code smells + débito técnico |
| `baixa` | Análise profunda: inclui refactoring opportunities e melhorias arquiteturais |

### Calibração por POSITION

| POSITION | Foco do Relatório |
|----------|-------------------|
| `junior`, `pleno` | Explicações detalhadas, referências para aprendizado |
| `senior`, `specialist` | Direto ao ponto, foco em trade-offs e riscos |
| `tech-lead`, `staff` | Incluir impacto organizacional, custo vs. benefício |
| `pm`, `tpm`, `gpm`, `cto` | Impacto no negócio, ROI de correções |

---

## Fase 1 – Scoping (Definição de Escopo)

### 1.1 Entender o Contexto do Projeto

Perguntar ao usuário (se não estiver claro):

- Qual é o **propósito** do projeto/módulo?
- Quais são as **áreas críticas** (autenticação, pagamentos, dados sensíveis)?
- Existe alguma **área conhecida** com problemas recorrentes?
- Qual é a **prioridade**: bugs funcionais, performance, segurança, UX?

### 1.2 Identificar Stack e Tecnologias

```bash
# Detectar tecnologias principais
ls package.json 2>/dev/null && echo "Node.js project detected"
ls requirements.txt 2>/dev/null && echo "Python project detected"
ls Gemfile 2>/dev/null && echo "Ruby project detected"

# Detectar frameworks
grep -E "(react|vue|angular|svelte)" package.json 2>/dev/null
grep -E "(django|flask|fastapi)" requirements.txt 2>/dev/null
```

### 1.3 Avaliar Cobertura de Testes

```bash
# Verificar se há testes
find . -name "*.test.*" -o -name "*.spec.*" | head -5

# Verificar cobertura (se configurada)
[ -f coverage/coverage-summary.json ] && cat coverage/coverage-summary.json
```

### 1.4 Definir Escopo Final

Criar arquivo de sessão com escopo:

```bash
mkdir -p $SESSIONS_DIR/eng/bug-audit-$(date +%Y%m%d-%H%M%S)/

cat > $SESSIONS_DIR/eng/bug-audit-$(date +%Y%m%d-%H%M%S)/scope.md << 'EOF'
# Escopo do Audit

**Data**: $(date +%Y-%m-%d)
**Workspace**: ${WORKSPACE}
**Escopo definido**: {caminho ou --all}

## Áreas a Analisar
- [ ] {área 1}
- [ ] {área 2}
- [ ] {área 3}

## Prioridades
1. {prioridade 1}
2. {prioridade 2}
3. {prioridade 3}

## Critérios de Severidade
- **CRÍTICO**: Impacto em produção, segurança, perda de dados
- **ALTO**: Bug funcional, impacto em UX crítica
- **MÉDIO**: Code smell, débito técnico impactante
- **BAIXO**: Melhoria de código, otimização
EOF
```

---

## Fase 2 – Scanning (Análise e Detecção)

### 2.1 Análise Automatizada

Execute verificações automatizadas disponíveis:

```bash
# Linter (se configurado)
npm run lint 2>/dev/null || echo "Linter não configurado"

# Type checking (TypeScript)
npx tsc --noEmit 2>/dev/null || echo "TypeScript não configurado"

# Security scan (se disponível)
npm audit 2>/dev/null || echo "npm audit não disponível"

# Testes (para identificar quebrados)
npm test -- --passWithNoTests 2>/dev/null || echo "Testes não configurados"
```

### 2.2 Análise Manual Guiada

#### A. **Bugs Funcionais**

Procurar por padrões problemáticos:

```bash
# Tratamento de erro inadequado
grep -r "catch.*{}" --include="*.js" --include="*.ts"
grep -r "catch (e) {}" --include="*.js" --include="*.ts"

# Console.log em produção
grep -r "console.log" --include="*.js" --include="*.ts" | grep -v "test"

# Variáveis não inicializadas
grep -r "let.*;" --include="*.js" --include="*.ts"

# Comparação com == ao invés de ===
grep -r " == " --include="*.js" --include="*.ts" | grep -v "test"
```

#### B. **Code Smells**

Identificar anti-patterns:

- **Funções gigantes** (> 50 linhas)
- **Arquivos gigantes** (> 300 linhas)
- **Duplicação de código**
- **Acoplamento excessivo**
- **Complexidade ciclomática alta**

```bash
# Funções muito longas (heurística)
find . -name "*.js" -o -name "*.ts" | xargs wc -l | sort -nr | head -20

# Duplicação (similaridade)
# (usar ferramentas externas se disponíveis: jscpd, simian)
```

#### C. **Gaps de Segurança**

Procurar por vulnerabilidades comuns:

```bash
# Injeção SQL
grep -r "execute.*+.*" --include="*.js" --include="*.ts"
grep -r "query.*\${" --include="*.js" --include="*.ts"

# XSS
grep -r "innerHTML.*=" --include="*.js" --include="*.ts"
grep -r "dangerouslySetInnerHTML" --include="*.jsx" --include="*.tsx"

# Segredos expostos
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.js" --include="*.ts" | grep -v "test"
```

#### D. **Problemas de Performance**

- Loops aninhados
- Queries N+1
- Lack of pagination
- Memory leaks (event listeners não removidos)

```bash
# Loops aninhados
grep -A 5 "for.*{" | grep "for.*{"

# Event listeners sem cleanup
grep -r "addEventListener" --include="*.js" --include="*.ts" | grep -v "removeEventListener"
```

#### E. **Débito Técnico**

- TODOs e FIXMEs não tratados
- Código comentado
- Dependencies desatualizadas

```bash
# TODOs e FIXMEs
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.js" --include="*.ts"

# Código comentado
grep -rn "^.*//.*function\|^.*//.*const\|^.*//.*let" --include="*.js" --include="*.ts"

# Dependencies vulneráveis
npm outdated 2>/dev/null
```

### 2.3 Análise de Arquitetura

Avaliar estrutura e organização:

- Separação de concerns
- Estrutura de pastas
- Modularidade
- Consistência de padrões

---

## Fase 3 – Classification (Classificação e Priorização)

### 3.1 Categorizar Problemas

Para cada problema identificado:

| Categoria | Descrição |
|-----------|-----------|
| **BUG-CRÍTICO** | Afeta produção, segurança, perda de dados |
| **BUG-ALTO** | Quebra funcionalidade importante, impacto UX |
| **BUG-MÉDIO** | Comportamento inesperado não crítico |
| **BUG-BAIXO** | Edge case, problema visual menor |
| **CODE-SMELL** | Anti-pattern, código difícil de manter |
| **DÉBITO-TÉCNICO** | Código desatualizado, falta de testes |
| **SEGURANÇA** | Vulnerabilidade potencial |
| **PERFORMANCE** | Lentidão, uso excessivo de recursos |

### 3.2 Calcular Severidade

```
Severidade = (Impacto × Probabilidade × Esforço de Correção)

Impacto: 1-5 (1=mínimo, 5=crítico)
Probabilidade: 1-5 (1=raro, 5=frequente)
Esforço: 1-5 (1=trivial, 5=complexo)
```

### 3.3 Priorizar para Criação de Cards

| Prioridade | Critério |
|------------|----------|
| **P0** | Severidade >= 60, categoria BUG-CRÍTICO ou SEGURANÇA |
| **P1** | Severidade >= 40, categoria BUG-ALTO |
| **P2** | Severidade >= 20, categoria BUG-MÉDIO ou CODE-SMELL |
| **P3** | Severidade < 20, categoria BUG-BAIXO ou DÉBITO-TÉCNICO |

---

## Fase 4 – Reporting (Geração de Relatório)

### 4.1 Estrutura do Relatório

Gerar arquivo `bug-audit-report.md` na sessão:

```markdown
# Bug Audit Report

**Workspace**: ${WORKSPACE}
**Data**: $(date +%Y-%m-%d)
**Escopo**: {escopo analisado}
**Executado por**: Bug Hunter (eng.bug-hunter)

---

## Resumo Executivo

- **Total de problemas encontrados**: {N}
  - Bugs Críticos: {N}
  - Bugs Altos: {N}
  - Bugs Médios: {N}
  - Bugs Baixos: {N}
  - Code Smells: {N}
  - Débito Técnico: {N}
  - Segurança: {N}
  - Performance: {N}

- **Cobertura de Testes**: {X}%
- **Dependencies Desatualizadas**: {N}
- **TODOs/FIXMEs**: {N}

---

## Problemas por Prioridade

### P0 - Críticos (Ação Imediata)

#### 1. {Título do problema}
- **Categoria**: {BUG-CRÍTICO | SEGURANÇA}
- **Localização**: {arquivo:linha}
- **Descrição**: {descrição detalhada}
- **Impacto**: {impacto no negócio/usuário}
- **Sugestão de Correção**: {como corrigir}
- **Estimativa**: {esforço estimado}
- **Card $TASK_MANAGER**: {ID} (a ser criado)

### P1 - Altos (Próxima Sprint)

{repetir estrutura}

### P2 - Médios (Backlog)

{repetir estrutura}

### P3 - Baixos (Débito Técnico)

{repetir estrutura}

---

## Análise de Áreas de Risco

### Áreas Críticas Sem Testes
- {área 1}: {motivo}
- {área 2}: {motivo}

### Código Complexo (Alta Complexidade Ciclomática)
- {arquivo}: {métrica}

### Dependencies Vulneráveis
| Dependência | Versão Atual | Versão Segura | Severidade |
|-------------|--------------|---------------|------------|
| {dep1} | {v1} | {v2} | HIGH |

---

## Recomendações Estratégicas

### Curto Prazo (1-2 sprints)
1. {recomendação 1}
2. {recomendação 2}

### Médio Prazo (3-6 meses)
1. {recomendação 1}
2. {recomendação 2}

### Longo Prazo (6-12 meses)
1. {recomendação 1}
2. {recomendação 2}

---

## Melhorias Preventivas

### Testes
- Aumentar cobertura para {X}%
- Adicionar testes de integração em {áreas}

### Observabilidade
- Adicionar logs estruturados em {áreas}
- Configurar alertas para {cenários}

### Processo
- Adicionar linter rules para prevenir {padrão}
- Configurar pre-commit hooks para {validações}

---

## Anexos

### A. Lista Completa de TODOs/FIXMEs
{lista}

### B. Dependencies Desatualizadas
{lista}

### C. Métricas de Código
- Linhas de código: {N}
- Arquivos analisados: {N}
- Complexidade média: {N}
```

### 4.2 Salvar Relatório

```bash
# Salvar relatório na sessão
cat > $SESSIONS_DIR/eng/bug-audit-$(date +%Y%m%d-%H%M%S)/bug-audit-report.md << 'EOF'
{conteúdo do relatório}
EOF

# Notificar usuário
echo "✅ Relatório gerado em: $SESSIONS_DIR/eng/bug-audit-$(date +%Y%m%d-%H%M%S)/bug-audit-report.md"
```

---

## Fase 5 – Ticketing (Criação de Cards no Task Manager)

### 5.1 Usar Skill bug-report

Para cada problema P0 e P1:

```bash
/bug-report create \
  --title="{título do bug}" \
  --category="{categoria}" \
  --severity="{P0|P1|P2|P3}" \
  --location="{arquivo:linha}" \
  --description="{descrição}" \
  --suggestion="{sugestão de correção}"
```

### 5.2 Estrutura dos Cards Criados

Cada card deve conter:

- **Título**: Claro e descritivo
- **Tipo**: Bug / Task (débito técnico) / Security
- **Prioridade**: Baseada na classificação P0-P3
- **Labels**: `bug-audit`, `{categoria}`, `{severidade}`
- **Descrição**:
  - Comportamento atual
  - Comportamento esperado
  - Localização no código
  - Impacto
  - Sugestão de correção
- **Anexo**: Link para o relatório completo

### 5.3 Sumarizar Cards Criados

```markdown
## Cards Criados no $TASK_MANAGER

| Card ID | Título | Prioridade | Categoria |
|---------|--------|------------|-----------|
| PROJ-101 | {título} | P0 | BUG-CRÍTICO |
| PROJ-102 | {título} | P0 | SEGURANÇA |
| PROJ-103 | {título} | P1 | BUG-ALTO |
| ... | ... | ... | ... |

**Total de cards criados**: {N}
```

---

## Checklist de Conclusão

- [ ] Escopo definido e documentado
- [ ] Análise automatizada executada
- [ ] Análise manual completada para todas as categorias
- [ ] Problemas classificados e priorizados
- [ ] Relatório gerado no formato padrão
- [ ] Relatório salvo em `$SESSIONS_DIR/eng/{session-id}/bug-audit-report.md`
- [ ] Cards P0 e P1 criados no task manager
- [ ] Recomendações estratégicas documentadas
- [ ] Melhorias preventivas sugeridas
- [ ] Usuário notificado sobre conclusão

---

## Tratamento de Erros

### Escopo não definido
- Perguntar ao usuário qual área analisar
- Sugerir começar por áreas críticas

### Projeto sem estrutura reconhecível
- Solicitar explicação do usuário sobre organização
- Adaptar análise conforme necessário

### Ferramentas indisponíveis (linter, testes, etc.)
- Prosseguir com análise manual
- Recomendar configuração dessas ferramentas

### Muitos problemas encontrados (> 100)
- Priorizar P0 e P1 no relatório principal
- Criar anexo com lista completa
- Sugerir análise incremental por áreas

---

## Mensagem de Conclusão

```
✅ Bug Audit concluído!

**Resumo**:
- Problemas encontrados: {N}
  - Críticos (P0): {N}
  - Altos (P1): {N}
  - Médios (P2): {N}
  - Baixos (P3): {N}

**Cards criados no $TASK_MANAGER**: {N}

**Relatório completo**: $SESSIONS_DIR/eng/{session-id}/bug-audit-report.md

**Próximos passos**:
1. Revisar problemas P0 imediatamente
2. Planejar correção de P1 na próxima sprint
3. Priorizar P2 e P3 no backlog de débito técnico
4. Implementar melhorias preventivas sugeridas
```

---

## Integração com Outros Workflows

- **eng.debug**: Para investigar bugs específicos encontrados no audit
- **eng.work**: Para implementar correções
- **eng.pr**: Para submeter correções
- **eng-qa-gate**: Para validar correções antes de merge

---

## Regras

### Nunca
- Fazer suposições sobre severidade sem análise
- Criar cards sem descrição adequada
- Ignorar problemas de segurança
- Relatar falsos positivos sem validação

### Sempre
- Validar ENV.md antes de iniciar
- Definir escopo claramente
- Priorizar por impacto real no negócio
- Fornecer sugestões de correção
- Documentar melhorias preventivas
- Salvar relatório na sessão
- Notificar usuário sobre conclusão
