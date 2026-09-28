---
description: Documentação (engenharia)
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Documentação técnica requer clareza e precisão, mas é menos complexa que implementação de código
---

# eng.docs

Use este workflow quando você quiser ajuda de engenharia para **atualizar/criar documentação**.

## Skills recomendados

Quando a solicitação for diretamente sobre escrita/atualização de documentação, use o skill `$IDE/skills/eng-docs-write/SKILL.md` como referência operacional.

Quando a solicitação for sobre organização/índice de documentação, use o skill `$IDE/skills/docs-index/SKILL.md`.

O assistente deve:

1. Ativar o contexto de Engenharia:
   - $IDE/agents/engineering/eng.agent.md
   - $IDE/rules/engineering/eng-rules.md
   - $IDE/rules/engineering/eng.bump-rules.md
   - $IDE/ENV.md

2. Ativar o agente de documentação:
   - $IDE/agents/engineering/eng.docs-writer.md

3. Coletar contexto mínimo antes de escrever:
   - Qual o objetivo da mudança?
   - Quais arquivos precisam ser atualizados/criados?
   - Há links obrigatórios (PRD/FRD/ARD/RFC) que precisam ser referenciados?
   - Existe um padrão de pasta/nomenclatura para este repositório?

4. Produzir a saída:
   - Propor mudanças objetivas nos arquivos de documentação alvo
   - Destacar riscos (ex.: inconsistência com PRD/ADR, quebra de links, informações incorretas)
   - Sugerir validação mínima (ex.: leitura rápida, links funcionando)
