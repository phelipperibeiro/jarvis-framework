CDD aplicado a Prompts                                                                          
                                                                                                  
  1. Contexto como input primário (você já faz isso)                                              
                                                                                                  
  O ENV.md é CDD puro — ele injeta variáveis de contexto (WORKSPACE, SQUAD, POSITION,          
  MAX_AI_EXECUTION_PERCENTAGE) que mudam o comportamento dos prompts sem alterar o prompt em si.  
                                                                                                  
  Pra ir além: os prompts poderiam adaptar seu nível de detalhe, tom e complexidade com base no   
  contexto. Exemplo:                                                                              
                                                                                                  
  ## Comportamento Adaptativo                                                                     
  - Se `POSITION` = junior → explicar decisões, sugerir leituras                                  
  - Se `POSITION` = senior → ser direto, focar em trade-offs                                      
  - Se `MAX_AI_EXECUTION_PERCENTAGE` > 80 → executar mais, perguntar menos                        
  - Se `MAX_AI_EXECUTION_PERCENTAGE` < 30 → planejar mais, executar menos                         
                                                                                                  
  2. Rejeitar "best practices" universais                                                         
                                                                                                  
  CDD diz: não existe prompt universalmente melhor. O que muda:                                   
  ┌────────────────────┬─────────────────────────────────────────────┐                            
  │      Contexto      │              Impacto no prompt              │                            
  ├────────────────────┼─────────────────────────────────────────────┤                            
  │ Projeto greenfield │ Menos restrições, mais exploração           │                            
  ├────────────────────┼─────────────────────────────────────────────┤                            
  │ Projeto legacy     │ Mais análise de impacto, mais cautela       │                            
  ├────────────────────┼─────────────────────────────────────────────┤                            
  │ Hotfix em produção │ Skip de documentação, foco cirúrgico        │                            
  ├────────────────────┼─────────────────────────────────────────────┤                            
  │ Feature complexa   │ Forçar artefatos (ARD, RFC) antes de código │                            
  └────────────────────┴─────────────────────────────────────────────┘                            
  Seus workflows hoje seguem um fluxo linear (start → plan → work → pr). CDD sugeriria que o fluxo
   se adapte ao contexto da tarefa, não o contrário.                                              
                                                                                                  
  3. Prompts que detectam contexto ao invés de assumir                                            
                                                                                                  
  Em vez de instruções rígidas, prompts CDD investigam antes de agir:                             
                                                                                                  
  ## Fase 0: Análise de Contexto                                                                  
  Antes de executar, determine:                                                                   
  1. **Tipo de mudança**: bug fix, feature, refactor, hotfix?                                     
  2. **Risco**: Quantos componentes são impactados?                                               
  3. **Maturidade do código**: Tem testes? Tem docs? Tem padrões claros?                          
  4. **Pressão**: Tem deadline? É incidente?                                                      
                                                                                                  
  → Adapte o rigor das fases seguintes com base nessas respostas.                                 
                                                                                                  
  4. Regras como guardrails contextuais, não leis absolutas                                       
                                                                                                  
  Seus rules/ hoje são binários (NUNCA/SEMPRE). CDD sugere graduação:                             
                                                                                                  
  ## Regra: Documentação                                                                          
                                                                                                  
  ### Contexto A: Feature nova com impacto arquitetural                                           
  - ✅ Obrigatório: architecture.md, tech-spec.md, ARD                                            
  - ✅ Obrigatório: aprovação antes de código                                                     
                                                                                                  
  ### Contexto B: Bug fix isolado                                                                 
  - ⚠️ Opcional: apenas comentário no PR explicando root cause                                    
  - ❌ Desnecessário: architecture.md                                                             
                                                                                                  
  ### Contexto C: Hotfix de produção                                                              
  - ❌ Skip total: documentar DEPOIS do deploy                                                    
                                                                                                  
  5. Agents com consciência contextual                                                            
                                                                                                  
  Seus agents hoje são personas fixas. Com CDD, eles se calibram:                                 
                                                                                                  
  ## Calibração do Agent                                                                          
  Ao iniciar, avalie:                                                                             
  - Se o dev pediu "rápido" ou "urgente" → reduzir cerimônia                                      
  - Se existem testes no projeto → exigir testes                                                  
  - Se NÃO existem testes → sugerir, mas não bloquear                                             
  - Se o projeto usa TypeScript strict → impor tipagem                                            
  - Se o projeto usa JS vanilla → não forçar tipos                                                
                                                                                                  
  6. Meta-princípio: o prompt deve perguntar, não assumir                                         
                                                                                                  
  O anti-padrão mais comum em prompts é assumir contexto que não existe. CDD resolve com:         
                                                                                                  
  - Perguntas de calibração no início do workflow                                                 
  - Defaults inteligentes baseados no ENV.md                                                      
  - Escape hatches — sempre permitir que o dev override o fluxo                                   
                                                                                                  
  ---                                                                                             
  Resumo prático                                                                                  
  ┌───────────────────────────────┬──────────────────────────────────────────┐                    
  │         Princípio CDD         │           Aplicação em Prompts           │                    
  ├───────────────────────────────┼──────────────────────────────────────────┤                    
  │ Contexto > Processo           │ ENV.md + detecção automática de contexto │                    
  ├───────────────────────────────┼──────────────────────────────────────────┤                    
  │ Sem "best practice" universal │ Fluxos adaptativos por tipo de tarefa    │                    
  ├───────────────────────────────┼──────────────────────────────────────────┤                    
  │ Pessoas > Regras              │ Calibração por POSITION e preferências   │                    
  ├───────────────────────────────┼──────────────────────────────────────────┤                    
  │ Pensamento crítico            │ Fase 0 de análise antes de execução      │                    
  ├───────────────────────────────┼──────────────────────────────────────────┤                    
  │ Adaptação contínua            │ Regras graduais ao invés de binárias     │                    
  └───────────────────────────────┴──────────────────────────────────────────┘                    
  O Framework Jarvis já tem a infraestrutura pra CDD (ENV, agents, rules separados). O próximo   
  passo seria tornar os prompts conscientes do contexto ao invés de apenas configurados por       
  contexto.                                                                                       
                                                                                                  
  ---

## ✅ Implementações Realizadas

As seguintes mudanças foram aplicadas para tornar o framework aware:

### 1. Workflows com Fase 0 de Análise de Contexto

| Workflow | Mudança |
|----------|---------|
| `eng.start.md` | Nova Fase 0 que classifica tarefa (hotfix/bugfix/feature/refactor), calibra por POSITION e MAX_AI_EXECUTION_PERCENTAGE, define CONTEXT_PROFILE |
| `eng.plan.md` | Fase 0 que herda contexto e ajusta granularidade do plano por tipo de tarefa |
| `eng.work.md` | Fase 0 que herda CONTEXT_PROFILE e calibra testes/validações automaticamente |

### 2. Rules Graduais por Contexto

Em `eng-rules.md`, nova seção "Regras Graduais por Contexto (CDD)" com tabelas para:
- Documentação obrigatória/opcional/desnecessária por tipo de tarefa
- Rigor de testes por contexto do projeto (cobertura existente)
- Code review por tamanho de PR
- Autonomia da AI por POSITION

### 3. Agents com Calibração Contextual

| Agent | Mudança |
|-------|---------|
| `eng.agent.md` | Seção "Calibração Contextual (CDD)" com detecção automática de projeto (testes, TypeScript strict, CI/CD), detecção de urgência por palavras-chave, ajuste silencioso de comportamento |
| `eng.qa.testing-engineer.md` | Calibração por cobertura existente, tipo de tarefa, POSITION e urgência |

### 4. CONTEXT_PROFILE

Novo padrão que flui entre workflows:

```
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  rigor: [mínimo|padrão|alto]
  comunicacao: [didático|direto|estratégico]
  autonomia: [baixa|média|alta]
```

- Definido no `eng.start` (Fase 0)
- Herdado por `eng.plan` e `eng.work`
- Permite consistência de contexto ao longo do ciclo

### 5. Skill de Detecção de Contexto

Criado o skill `/jarvis-context-detect` em `$IDE/skills/jarvis-context-detect/SKILL.md` que:
- Centraliza toda a lógica de detecção CDD
- Detecta tipo de tarefa pela branch e jira key
- Analisa características do projeto (testes, TypeScript, CI/CD, linter)
- Lê POSITION e MAX_AI_EXECUTION_PERCENTAGE do ENV.md
- Gera arquivo `context.md` com CONTEXT_PROFILE completo
- Suporta override manual via parâmetros

**Uso:**
```
/jarvis-context-detect [jira-key]
/jarvis-context-detect --override tipo=hotfix urgencia=alta
```

**Fluxo de integração:**
```
/jarvis-context-detect → context.md
        ↓
eng.start (Fase 0) ← lê context.md
        ↓
eng.plan (Fase 0) ← herda
        ↓
eng.work (Fase 0) ← herda
```

---

## Próximos Passos Sugeridos

1. ~~**Aplicar CDD nos agents de QA restantes**~~: ✅ `eng.qa.test-architect.md`, `eng.qa.test-planner.md`
2. ~~**Criar skill de detecção de contexto**~~: ✅ Implementado em `/jarvis-context-detect`
3. ~~**Adicionar escape hatches explícitos**~~: ✅ Implementado via `--override`
4. **Integração com Jira**: Detectar tipo de tarefa automaticamente via API do Jira