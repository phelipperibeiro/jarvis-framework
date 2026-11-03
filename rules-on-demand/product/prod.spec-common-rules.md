> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Regras Comuns dos Comandos `prod.spec.*`

## Objetivo

Princípios, busca de contexto e lugar dos documentos que valem para todos os comandos `prod.spec.*` que escrevem um documento. Ficam fora de `rules/` para chegar a qualquer AREA (inclusive quem é de engenharia e usa o modo developer-guided) sem pesar no início da sessão.

## Escopo

Lida pelo próprio comando, antes de começar: `prod.spec.prd`, `prod.spec.frd`, `prod.spec.epic`, `prod.spec.issue` e `prod.spec.breakdown`.

## Regras

### Princípios dos comandos `prod.spec.*`

Valem para os comandos que escrevem um documento (PRD, FRD, épico, issue, breakdown):

1. **Sempre use o template** do documento, em `$PROD_TEMPLATES`, para o output final.
2. **Nunca crie o arquivo final com suposições não validadas**: confirme as sugestões primeiro.
3. **Seja inteligente, não robótico**: analise o contexto e proponha sugestões inteligentes, sem perguntas vazias.

### Busca de contexto (`$PROD_DOCS` sempre; Central docs se configurado)

Antes de começar o documento:

1. A busca em `$PROD_DOCS` é sempre feita: procure o documento de trabalho (PRD, FRD, épico) pelo nome ou contexto informado, pelo Jira ID ou `TASK_MANAGER_KEY` e por tags semânticas. O Central docs não guarda esses documentos.
2. Se `CENTRAL_DOCS_STORAGE` estiver definido no `ENV.md`, rode também `jarvis docs sync --silent` e consulte no Central docs as funcionalidades já implementadas relacionadas (o que existe hoje). Vazio, pule só o `jarvis docs sync`.
3. Se encontrar, informe ("✅ {tipo} encontrado: [caminho]") e use-o como base ou contexto.
4. O que cada comando busca, quando e o que faz ao não encontrar (perguntar ou seguir) está no próprio workflow.

### Central docs

Os documentos destes comandos são **documentos de trabalho**: ficam em `$PROD_DOCS`/`$ENG_DOCS` (`docs/jarvis/`) e **não** são publicados no Central docs. O Central docs registra só o que foi implementado, e quem o atualiza é o `/eng.spec-consolidate`, depois do PR da entrega.

## Referências

- `rules/product/prod.spec-rules.md`: princípios de escrita de spec (critérios de aceitação, contexto completo, terminologia, discovery)
- `rules/product/prod-rules.md`: regras gerais de produto
