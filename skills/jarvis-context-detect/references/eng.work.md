# Calibração do `eng.work` pelo CONTEXT_PROFILE

> Parte do skill `jarvis-context-detect`. Lido pela Fase 0 do `/eng.work`, depois de ler o `CONTEXT_PROFILE` do `context.md`.

| Tipo | Impacto na Implementação |
|------|--------------------------|
| `hotfix` | Foco cirúrgico, skip testes extensivos, validação mínima |
| `bugfix` | Implementar fix + teste que reproduz o bug |
| `feature` | Fluxo completo com testes e validações |
| `refactor` | Testes obrigatórios antes E depois, garantir comportamento idêntico |

Use as características do projeto detectadas:

| projeto.testes | Comportamento |
|----------------|---------------|
| `existentes` | Exigir testes para código novo, seguir padrões |
| `ausentes` | Sugerir testes, mas não bloquear |

| projeto.cicd | Comportamento |
|--------------|---------------|
| `configurado` | Executar validações locais antes de finalizar |
| `ausente` | Alertar sobre ausência de validação automática |

| autonomia | Comportamento na Implementação |
|-----------|--------------------------------|
| `alta` | Implementar fase completa, pausar apenas entre fases |
| `média` | Implementar, pausar em decisões de design |
| `baixa` | Apresentar cada arquivo antes de criar, aguardar aprovação |
