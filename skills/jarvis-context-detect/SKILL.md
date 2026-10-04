---
name: jarvis-context-detect
description: >
  Detecta contexto do projeto e da tarefa para calibrar comportamento dos workflows.
  Trigger: Use no início de qualquer workflow para definir CONTEXT_PROFILE ou quando precisar recalibrar.
argument-hint: "[jira-key-opcional]"
disable-model-invocation: false
allowed-tools: Read Grep Glob Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# Context Detect - Detecção de Contexto CDD

Você é um **especialista em análise de contexto** focado em detectar características do projeto e da tarefa para calibrar o comportamento dos workflows do Framework Jarvis.

## Objetivo

Centralizar a lógica de detecção de contexto (CDD - Context-Driven Development) em um skill reutilizável que gera um `CONTEXT_PROFILE` para uso em workflows e agents.

## Entrada

- `$ARGUMENTS` - (Opcional) Jira key da tarefa para análise de tipo (ex: `TASK-123`, `BUG-456`)

---

## Quando Usar

Use este skill quando:
- Iniciar um novo workflow (`eng.start`, `eng.plan`, `eng.work`)
- Precisar recalibrar o contexto durante uma sessão
- Quiser verificar as características detectadas do projeto
- Outro workflow/agent precisar do CONTEXT_PROFILE

**NÃO usar quando:**
- O CONTEXT_PROFILE já foi definido e está válido na sessão
- Apenas consultando informações sem executar workflows
- A variável `ENABLE_CDD=false` estiver configurada no ENV.md

---

## Fluxo de Detecção

### 0. Verificação de Ativação do CDD

Antes de executar qualquer detecção, verifique se o CDD está habilitado:

```bash
# Verificar se ENABLE_CDD está configurado
grep "^ENABLE_CDD=" $IDE/ENV.md 2>/dev/null
```

**Comportamento:**

| ENABLE_CDD | Ação |
|------------|------|
| `true` | Executar detecção normalmente |
| `false` | Exibir mensagem e sair sem executar |
| Não definida | Assumir `false` (CDD desabilitado por padrão) |

**Se CDD estiver desabilitado**, exibir:

```
ℹ️ CDD (Context-Driven Development) está desabilitado

O sistema de detecção de contexto não será executado.
Os workflows usarão comportamento padrão sem calibração contextual.

Para habilitar, configure ENABLE_CDD=true no arquivo $IDE/ENV.md
```

E encerrar o skill sem executar as detecções.

### 1. Detecção do Tipo de Tarefa

Analise indicadores para classificar a tarefa:

```
┌─────────────────────────────────────────────────────────────┐
│ DETECÇÃO DO TIPO DE TAREFA                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Branch atual contém "hotfix/"?                              │
│   → SIM: tipo = hotfix                                      │
│                                                             │
│ Branch atual contém "fix/" ou "bugfix/"?                    │
│   → SIM: tipo = bugfix                                      │
│                                                             │
│ Jira key começa com "BUG-"?                                 │
│   → SIM: tipo = bugfix                                      │
│                                                             │
│ Branch contém "refactor/" ou "tech-debt/"?                  │
│   → SIM: tipo = refactor                                    │
│                                                             │
│ Caso contrário:                                             │
│   → tipo = feature                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Comando para detectar branch:
```bash
git branch --show-current
```

### 2. Detecção de Características do Projeto

Execute as verificações silenciosamente:

#### 2.1 Testes Existentes

```bash
# Verificar se existem arquivos de teste
find . -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" | head -5
```

| Resultado | Classificação | Impacto |
|-----------|---------------|---------|
| Arquivos encontrados | `testes: existentes` | Exigir testes para código novo |
| Nenhum arquivo | `testes: ausentes` | Sugerir, mas não bloquear |

#### 2.2 TypeScript Strict

```bash
# Verificar tsconfig.json
grep -l '"strict":\s*true' tsconfig.json 2>/dev/null
```

| Resultado | Classificação | Impacto |
|-----------|---------------|---------|
| Encontrado | `typescript: strict` | Impor tipagem forte, rejeitar `any` |
| Não encontrado | `typescript: relaxado` | Aceitar tipagem gradual |

#### 2.3 CI/CD

```bash
# Verificar pipelines
ls .github/workflows/*.yml 2>/dev/null || ls .gitlab-ci.yml 2>/dev/null
```

| Resultado | Classificação | Impacto |
|-----------|---------------|---------|
| Encontrado | `cicd: configurado` | Validar localmente antes de sugerir PR |
| Não encontrado | `cicd: ausente` | Alertar sobre ausência de validação |

#### 2.4 Linter/Formatter

```bash
# Verificar configuração de lint
ls .eslintrc* .prettierrc* biome.json 2>/dev/null | head -1
```

| Resultado | Classificação | Impacto |
|-----------|---------------|---------|
| Encontrado | `linter: configurado` | Garantir que código passa no lint |
| Não encontrado | `linter: ausente` | Seguir convenções observadas |

#### 2.5 Cobertura de Testes

```bash
# Verificar relatório de cobertura ou executar
ls coverage/lcov-report/index.html 2>/dev/null
```

| Resultado | Classificação |
|-----------|---------------|
| > 70% | `cobertura: alta` |
| 40-70% | `cobertura: média` |
| < 40% ou ausente | `cobertura: baixa` |

### 3. Leitura do ENV.md

Extraia as variáveis relevantes:

```bash
grep -E "^(POSITION|MAX_AI_EXECUTION_PERCENTAGE)=" $IDE/ENV.md
```

#### 3.1 Calibração por POSITION

**Valores válidos de POSITION:**

| Categoria | Valores | comunicacao |
|-----------|---------|-------------|
| Técnico Junior | `junior`, `pleno` | `didático` |
| Técnico Sênior | `senior`, `specialist` | `direto` |
| Liderança Técnica | `tech-lead`, `staff` | `estratégico` |
| Gestão de Produto | `pm`, `tpm`, `gpm` | `estratégico` |
| Executivo | `cto`, `principal` | `estratégico` |

> ⚠️ **Valor padrão**: Se POSITION não estiver definido ou tiver valor desconhecido, usar `pleno` (comunicacao: `didático`)

**Comportamento por comunicacao:**

| comunicacao | Comportamento |
|-------------|---------------|
| `didático` | Explicar decisões, incluir referências, usar exemplos |
| `direto` | Ser conciso, focar em trade-offs e riscos |
| `estratégico` | Incluir impacto organizacional, visão de longo prazo |

#### 3.2 Calibração por MAX_AI_EXECUTION_PERCENTAGE

| Valor | autonomia | Comportamento |
|-------|-----------|---------------|
| >= 80% | `alta` | Executar decisões, reportar ao final |
| 70-79% | `média` | Executar, pausar em decisões críticas |
| 60-69% | `baixa` | Apresentar opções, aguardar aprovação |

### 4. Detecção de Urgência

Analise a mensagem do usuário e contexto:

| Sinal | urgencia |
|-------|----------|
| Palavras: `urgente`, `rápido`, `produção`, `incidente`, `hotfix` | `alta` |
| Palavras: `tech-debt`, `refactor`, `melhorar` | `baixa` |
| Sem sinais específicos | `normal` |

---

## Geração do CONTEXT_PROFILE

Com base em todas as detecções, gere o perfil:

```yaml
CONTEXT_PROFILE:
  # Classificação da Tarefa
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [alta|normal|baixa]

  # Calibração de Rigor
  rigor: [mínimo|padrão|alto]

  # Calibração de Comunicação
  comunicacao: [didático|direto|estratégico]

  # Calibração de Autonomia
  autonomia: [baixa|média|alta]

  # Características do Projeto
  projeto:
    testes: [existentes|ausentes]
    typescript: [strict|relaxado|ausente]
    cicd: [configurado|ausente]
    linter: [configurado|ausente]
    cobertura: [alta|média|baixa]
```

### Matriz de Rigor

| tipo | urgencia | rigor resultante |
|------|----------|------------------|
| hotfix | alta | mínimo |
| hotfix | * | mínimo |
| bugfix | alta | mínimo |
| bugfix | normal | padrão |
| feature | * | padrão |
| refactor | * | alto |

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Output

### Arquivo Gerado

Salvar em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md` (se `TASK_MANAGER_KEY` fornecido) ou exibir no terminal.

### Formato de Saída

```markdown
# Contexto Detectado

## CONTEXT_PROFILE

```yaml
tipo: feature
urgencia: normal
rigor: padrão
comunicacao: direto
autonomia: alta

projeto:
  testes: existentes
  typescript: strict
  cicd: configurado
  linter: configurado
  cobertura: média
```

## Resumo Visual

| Aspecto | Valor | Impacto |
|---------|-------|---------|
| Tipo | feature | Fluxo completo |
| Rigor | padrão | Todas as validações |
| Comunicação | direto | Foco em trade-offs |
| Autonomia | alta | Executar e reportar |

## Ajustes Aplicados

- Testes: Exigir testes para código novo
- TypeScript: Impor tipagem forte
- CI/CD: Validar localmente antes de PR
- Linter: Garantir que código passa

---

> Este perfil será usado pelos workflows `eng.start`, `eng.plan` e `eng.work`.
> Para recalibrar, execute `/jarvis-context-detect` novamente.
```

---

## Mensagem de Conclusão

```
📊 CONTEXTO DETECTADO

🏷️ Tipo: {tipo}
⚡ Urgência: {urgencia}
⚙️ Rigor: {rigor}
💬 Comunicação: {comunicacao}
🤖 Autonomia: {autonomia}

📁 Projeto:
  - Testes: {testes}
  - TypeScript: {typescript}
  - CI/CD: {cicd}
  - Cobertura: {cobertura}

→ Perfil salvo em: {caminho}
→ Os workflows serão calibrados automaticamente.
→ Para ajustar, informe: "/jarvis-context-detect --override tipo=hotfix"
```

---

## Override Manual

O usuário pode sobrescrever qualquer valor detectado:

```
/jarvis-context-detect --override tipo=hotfix urgencia=alta
```

Parâmetros válidos para override:
- `tipo`: hotfix, bugfix, feature, refactor
- `urgencia`: alta, normal, baixa
- `rigor`: mínimo, padrão, alto
- `comunicacao`: didático, direto, estratégico
- `autonomia`: baixa, média, alta

---

## Regras

### Nunca
- Assumir contexto sem detectar
- Ignorar override explícito do usuário
- Verbalizar detecções intermediárias (apenas resultado final)

### Sempre
- Executar todas as verificações
- Respeitar hierarquia de detecção
- Permitir override do usuário
- Salvar perfil para reutilização

---

## Integração com Workflows

Este skill é chamado automaticamente pela Fase 0 dos workflows:

```
eng.start (Fase 0) → /jarvis-context-detect → CONTEXT_PROFILE
                           ↓
                    $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md
                           ↓
eng.plan (Fase 0) ← herda perfil
eng.work (Fase 0) ← herda perfil
```

Workflows podem ler o perfil existente:

```bash
cat $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md
```

Se o arquivo existir e for recente (< 1 hora), usar perfil existente.
Se não existir ou for antigo, executar detecção novamente.

---

## Recursos Adicionais

- **Template**: Veja [assets/context-profile-template.md](assets/context-profile-template.md)
- **Documentação CDD**: Veja `$IDE/templates/CDD aplicado a Prompts.md`
