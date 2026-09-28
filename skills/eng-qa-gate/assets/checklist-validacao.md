# Checklist de Validação - Quality Gate

Este documento serve como referência para validação de Tech Specs antes do breakdown de subtarefas.

---

## Checklist por Tipo de Card

### TASK - Checklist Completo

#### Seção 1: Contexto da História (10%)

- [ ] História original do Jira referenciada (ID e link)
- [ ] Formato "Como/Eu quero/Para que" preenchido
- [ ] Contexto de negócio explicado
- [ ] Critérios de aceitação do produto listados
- [ ] Escopo definido (inclui/não inclui)

#### Seção 2: Análise Técnica (15%)

- [ ] Componentes afetados listados com tipo de mudança
- [ ] Arquitetura atual vs proposta descrita
- [ ] Diagrama de arquitetura incluído (se aplicável)
- [ ] Fluxo de dados documentado
- [ ] Tecnologias e bibliotecas listadas com justificativa
- [ ] Dependências mapeadas (externas, internas, outras stories)

#### Seção 3: Decisões Arquiteturais (10%)

- [ ] Pelo menos 1 decisão documentada
- [ ] Contexto da decisão explicado
- [ ] Mínimo 2 opções consideradas
- [ ] Prós e contras de cada opção
- [ ] Justificativa da escolha
- [ ] Consequências documentadas

#### Seção 4: Plano de Implementação (10%)

- [ ] Fases definidas com objetivos claros
- [ ] Subtarefas detalhadas por fase
- [ ] Arquivos a modificar/criar listados
- [ ] Critérios de aceitação técnicos por subtarefa
- [ ] Testes requeridos por subtarefa
- [ ] Estimativas em horas (máx. 2h por subtarefa)

#### Seção 5: Critérios de Aceitação (15%) - CRÍTICO

- [ ] Mínimo 3 critérios de aceitação
- [ ] Critérios são mensuráveis e testáveis
- [ ] Formato "Quando X, então Y"
- [ ] Cobrem cenário de sucesso
- [ ] Cobrem cenário de erro

#### Seção 6: Estratégia de Testes (10%)

- [ ] Cobertura alvo definida (%)
- [ ] Testes unitários planejados
- [ ] Testes de integração planejados
- [ ] Testes E2E planejados (se aplicável)
- [ ] Testes de performance (se aplicável)
- [ ] Testes de segurança (se aplicável)

#### Seção 7: Riscos e Mitigações (10%)

- [ ] Mínimo 2 riscos identificados
- [ ] Probabilidade avaliada (Alta/Média/Baixa)
- [ ] Impacto avaliado (Alto/Médio/Baixo)
- [ ] Mitigação definida para cada risco
- [ ] Plano B para riscos de alto impacto

#### Seção 8: Dependências (5%)

- [ ] Dependências externas listadas
- [ ] Dependências internas listadas
- [ ] Dependências de outras stories identificadas
- [ ] Ordem de execução clara

#### Seção 9: Validação e DoD (5%)

- [ ] Checklist de Definition of Done
- [ ] Critérios de código (review, lint, etc.)
- [ ] Critérios de testes
- [ ] Critérios de documentação
- [ ] Critérios de deploy

---

### SPIKE - Checklist Completo

#### Objetivo e Perguntas (25%)

- [ ] Objetivo claro e específico
- [ ] Perguntas a responder listadas (mín. 3)
- [ ] Hipóteses a validar documentadas
- [ ] Escopo da investigação definido

#### Referências de Discovery (25%) - CRÍTICO

- [ ] Documentação oficial referenciada
- [ ] APIs/SDKs relevantes listados
- [ ] Exemplos de código ou POCs existentes
- [ ] Links para recursos externos
- [ ] Artigos ou tutoriais relevantes

#### Critérios de Conclusão (20%)

- [ ] Entregáveis definidos (documento, POC, decisão)
- [ ] Formato do output especificado
- [ ] Critérios de sucesso claros
- [ ] Como validar que o spike foi concluído

#### Contexto e Justificativa (15%)

- [ ] Por que essa investigação é necessária
- [ ] Qual problema estamos tentando resolver
- [ ] Impacto se não investigarmos
- [ ] Relação com outras histórias/épicos

#### Timebox (10%)

- [ ] Tempo máximo definido (horas/dias)
- [ ] Checkpoints intermediários
- [ ] Critério de parada se não houver progresso

#### Próximos Passos (5%)

- [ ] O que fazer após conclusão do spike
- [ ] Como os resultados serão usados
- [ ] Histórias que serão criadas/atualizadas

---

### BUG - Checklist Completo

#### Comportamento Esperado vs Atual (20%)

- [ ] Comportamento esperado descrito claramente
- [ ] Comportamento atual descrito claramente
- [ ] Diferença entre os dois explicada
- [ ] Screenshots ou vídeos (se aplicável)

#### Passos para Reproduzir (20%) - CRÍTICO

- [ ] Passos numerados e detalhados
- [ ] Pré-condições listadas
- [ ] Dados de teste necessários
- [ ] Frequência de reprodução (sempre/às vezes)
- [ ] Passos são reproduzíveis por outra pessoa

#### Ambiente e Condições (10%)

- [ ] Browser/versão especificado
- [ ] Sistema operacional
- [ ] Ambiente (dev/staging/prod)
- [ ] Dados específicos que causam o bug
- [ ] Condições especiais (rede, horário, etc.)

#### Análise Técnica (20%) - CRÍTICO

- [ ] Causa raiz identificada ou hipótese
- [ ] Arquivos afetados listados
- [ ] Stack trace ou logs relevantes
- [ ] Componentes impactados

#### Severidade e Prioridade (15%)

- [ ] Severidade justificada (Crítico/Alto/Médio/Baixo)
- [ ] Prioridade justificada
- [ ] Impacto no usuário descrito
- [ ] Quantidade de usuários afetados (se conhecido)

#### Proposta de Solução (10%)

- [ ] Solução proposta ou investigação necessária
- [ ] Alternativas consideradas
- [ ] Riscos da correção

#### Testes de Regressão (5%)

- [ ] Testes que devem ser criados
- [ ] Áreas que devem ser testadas após correção
- [ ] Cenários de regressão identificados

---

## Critérios Bloqueantes Automáticos

Independente do score, o Quality Gate é **BLOQUEADO** se:

| Tipo | Critério Ausente |
|------|------------------|
| **TASK** | Critérios de Aceitação |
| **TASK** | Descrição vazia ou genérica |
| **SPIKE** | Referências de Discovery |
| **BUG** | Passos para Reproduzir |
| **BUG** | Análise Técnica |

---

## Exemplos

### Exemplo de Tech Spec Conforme (TASK)

```markdown
# TECH-001: Implementar Autenticação JWT

## 1. Contexto da História

**ID**: STORY-123
**Link**: https://jira.empresa.com/browse/STORY-123

**Como** usuário do sistema
**Eu quero** fazer login com email e senha
**Para que** eu possa acessar minhas informações de forma segura

### Contexto de Negócio
O sistema atual não possui autenticação. Usuários acessam sem identificação,
o que impede personalização e rastreamento de ações.

### Critérios de Aceitação (Produto)
- Quando usuário insere credenciais válidas, então é redirecionado ao dashboard
- Quando usuário insere credenciais inválidas, então vê mensagem de erro
- Quando token expira, então usuário é redirecionado ao login

### Escopo
**Inclui:**
- Login com email/senha
- Geração de token JWT
- Middleware de validação

**Não Inclui:**
- Login social (OAuth)
- Recuperação de senha
- 2FA

## 2. Análise Técnica

### Componentes Afetados
| Componente | Tipo | Impacto |
|------------|------|---------|
| auth.service.ts | Criação | Alto |
| user.controller.ts | Modificação | Médio |

### Decisões Arquiteturais

**Decisão 1: Armazenamento de Token**

**Contexto**: Onde armazenar o token JWT no frontend?

**Opções**:
- Opção A: localStorage - Prós: simples. Contras: vulnerável a XSS
- Opção B: httpOnly cookie - Prós: seguro. Contras: requer CSRF protection

**Decisão**: httpOnly cookie
**Justificativa**: Segurança é prioridade. CSRF é mitigável.

## 3. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação | Plano B |
|-------|-------|---------|-----------|---------|
| Token vazado | Baixa | Alto | Expiração curta (1h) | Blacklist de tokens |
```

### Exemplo de Tech Spec Bloqueada (TASK)

```markdown
# Implementar Login

## Descrição
Fazer o login funcionar.

## O que fazer
- Criar tela de login
- Conectar com backend
```

**Problemas**:
- ❌ Sem TASK_MANAGER_KEY
- ❌ Sem critérios de aceitação
- ❌ Sem análise técnica
- ❌ Sem decisões arquiteturais
- ❌ Sem riscos mapeados

**Status**: BLOQUEADO (0%)

---

## Referências

- Template completo: `$IDE/templates/engineering/tech-spec-template.md`
- Regras de Tech Spec: `$IDE/rules/engineering/eng.tech-spec-rules.md`
