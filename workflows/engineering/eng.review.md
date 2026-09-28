---
description: Fluxo de trabalho de Engenharia para revisão de solução ou PR
globs:
  alwaysApply: false
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Revisão de código requer análise crítica, identificação de riscos, edge cases e sugestões de melhorias
---

# Workflow de Engenharia – Revisão de Solução / Pull Request

## Objetivo

Guiar o assistente de Engenharia (ENG) na revisão de soluções técnicas, ARDs, PRs ou trechos de código,
apontando riscos, gaps e melhorias, sempre respeitando `$IDE/rules/engineering/eng-rules.md`.

## Skills recomendados

- **eng-qa-test-plan**: para revisar cobertura de testes da branch e sugerir gaps (quando a revisão envolver mudanças de código).
  - Arquivo: `$IDE/skills/eng-qa-test-plan/SKILL.md`
- **eng-qa-testsprite**: para executar testes automatizados e validar cobertura real das mudanças.
  - Arquivo: `$IDE/skills/eng-qa-testsprite/SKILL.md`
- **eng-arch-c4**: quando a revisão envolver mudanças arquiteturais relevantes e precisar atualizar diagramas.
  - Arquivo: `$IDE/skills/eng-arch-c4/SKILL.md`
- **eng-frontend**: quando a revisão envolver componentes React, hooks, performance de UI ou acessibilidade.
  - Arquivo: `$IDE/skills/eng-frontend/SKILL.md`
- **eng-design-system**: quando a revisão envolver componentes do design system, tokens ou Storybook.
  - Arquivo: `$IDE/skills/eng-design-system/SKILL.md`
- **eng-microfrontend**: quando a revisão envolver Module Federation, shell/remote ou contratos de interface.
  - Arquivo: `$IDE/skills/eng-microfrontend/SKILL.md`

## Agentes recomendados

- **eng.qa.test-planner**: para análise detalhada de cobertura de testes e identificação de gaps.
  - Arquivo: `$IDE/agents/engineering/qa/eng.qa.test-planner.md`
  - Quando usar: Se a revisão identificar problemas de cobertura que precisam de análise mais profunda.
- **eng.frontend.agent**: para revisão aprofundada de código React, decisões arquiteturais frontend e acessibilidade.
  - Arquivo: `$IDE/agents/engineering/eng.frontend.agent.md`
  - Quando usar: PR com mudanças significativas de interface, componentes ou micro frontend.
- **eng.ux-designer.agent**: para avaliação de usabilidade, fluxo do usuário e microcopy.
  - Arquivo: `$IDE/agents/engineering/eng.ux-designer.agent.md`
  - Quando usar: PR que introduz nova feature de UI ou altera fluxo de usuário existente.

---

## Passo 1 – Entender o objetivo da mudança

Pergunte e resuma:

- Qual é o objetivo principal dessa mudança?
- Ela está ligada a:
  - ( ) Um ARD específico
  - ( ) Um PRD / demanda de produto
  - ( ) Bug/Incidente
  - ( ) Refactor / melhoria técnica

Se houver ARD ou PRD relacionados, peça o contexto e leia rapidamente para alinhar a intenção.

---

## Passo 2 – Escopo e impacto declarado

Peça para o usuário (ou infira do diff):

- O que essa mudança **pretende** alterar?
- O que explicitamente **não** deveria mudar?

Liste componentes tocados:

- serviços, módulos, arquivos relevantes
- endpoints, jobs, filas, migrations (se houver)

---

## Passo 3 – Revisão estrutural

Na revisão da solução/PR, analise:

- Clareza e organização do código/arquitetura.
- Adequação ao stack e padrões existentes (conforme [ENV.md]).
- Complexidade desnecessária (overengineering) versus soluções simples.

Aponte:

- pontos positivos
- partes confusas ou acopladas demais
- oportunidades claras de simplificação

---

## Passo 4 – Riscos e edge cases

Sempre responda explicitamente:

- Quais são os principais **riscos técnicos** dessa solução?
- Há casos de borda óbvios não tratados?
- Como essa mudança se comporta em:
  - falhas de rede / timeouts
  - dados inválidos ou inesperados
  - cargas maiores que o normal

Se necessário, sugira:

- validações adicionais
- tratamentos de erro mais robustos
- limites / timeouts / retries

---

## Passo 5 – Qualidade e legibilidade

Avalie e comente:

- Nomes de variáveis, funções e módulos (semântica, clareza).
- Tamanho de funções/métodos (muito grandes? fazem coisas demais?).
- Duplicação de código óbvia.
- Comentários/documentação essenciais ausentes (sem inventar novos blocos além do combinado).

Sugira melhorias específicas, mas **não reescreva tudo do zero** sem necessidade.

---

## Passo 6 – Testes e cobertura mínima

Para a solução ou PR revisado, responda:

- Que tipos de teste deveriam existir para essa mudança?
- Quais cenários mínimos deveriam ser cobertos?
- Há algum fluxo crítico sem teste?

Sugira, no mínimo:

- alguns casos de teste principais (happy path + 2–3 edge cases relevantes).
- se faz sentido adicionar testes de integração ou contrato.

### Análise de Cobertura (opcional)

Para uma análise detalhada de cobertura, invoque o agente **eng.qa.test-planner**:

`$IDE/agents/engineering/qa/eng.qa.test-planner.md`

```
@eng.qa.test-planner Analise a cobertura de testes para as mudanças desta branch
```

O agente irá:

- Mapear arquivos alterados para arquivos de teste
- Identificar lacunas de cobertura
- Gerar relatório com recomendações

### Validação com TestSprite (opcional)

Se o projeto estiver rodando localmente, execute o skill **eng-qa-testsprite** para obter evidências de cobertura:

```
/eng-qa-testsprite diff
```

Inclua no parecer:

- Resultado dos testes executados (passou/falhou)
- Cobertura atingida vs. esperada
- Gaps identificados pelo TestSprite

---

## Passo 7 – Recomendação e próximos passos

Feche sempre com uma recomendação clara:

- ( ) Aprovável como está (com pequenos ajustes opcionais)
- ( ) Recomendado aprovar **com ajustes** listados
- ( ) **Não aprovar ainda** – pontos críticos a resolver

Para cada ponto que imped gl tar aprovação, detalhe:

- por que é crítico
- qual a sugestão concreta de correção/melhoria

Se fizer sentido, recomende:

- quebrar a mudança em partes menores
- criar ARD ou especificação técnica adicional
- registrar débitos técnicos em tarefa separada
