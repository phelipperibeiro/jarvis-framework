# `/eng.light-arch` — desenho arquitetural leve

Workflow: `workflows/engineering/eng.light-arch.md`

## Em uma frase

Entende o que precisa ser construído, tira as dúvidas com você e propõe uma estrutura arquitetural enxuta para a feature, sem a cerimônia de um ARD completo.

## O que é

É a forma rápida de desenhar a arquitetura de uma feature. Em vez de produzir um documento longo, o comando conduz uma conversa em duas etapas (entender, depois desenhar) e salva o resultado como **comentário no card** da tarefa.

## Quando usar

- Feature de tamanho pequeno ou médio que precisa de um desenho, mas não de um ARD formal
- Quando você quer alinhar a abordagem com o time antes de codar
- Para ter um desenho direcional a partir de cards pai e filhos

## Quando **não** usar

- Decisão de arquitetura relevante, com trade-offs e vários serviços → [`eng.create-ard`](./eng.create-ard.md)
- Decisão que precisa de discussão aberta e governança → [`eng.create-rfc`](./eng.create-rfc.md)
- Você quer o fluxo completo de planejamento da tarefa (branch, sessão, `architecture.md`) → [`eng.start`](./eng.start.md)

## Como funciona

**1. Exame** (entender o que será construído)

- Lê o card, os pais e os filhos, e monta o entendimento inicial: por quê, resultado esperado, abordagem direcional, APIs ou ferramentas novas, como testar, dependências e restrições
- Levanta os **3 a 5 esclarecimentos** mais importantes e pergunta a você, junto com o entendimento e sugestões. Pausa e espera
- Repete se precisar e depois devolve o entendimento para você revisar. Só avança com aprovação explícita

**2. Arquitetura** (desenhar)

- Lê o código relevante e os docs técnicos do projeto
- Monta a proposta: visão geral antes e depois, componentes afetados e dependências, padrões mantidos ou introduzidos, dependências externas, restrições e suposições, trade-offs e alternativas, consequências negativas e lista dos principais arquivos a editar ou criar. Pode incluir um diagrama Mermaid
- Mostra como artefato, itera até você aprovar e salva o resultado como comentário no card

## Regras que importam

- **Não chuta**: se não tem certeza de como uma biblioteca funciona, consulta a documentação em vez de adivinhar
- Não avança de etapa sem o sinal verde explícito
- Se algo discutido afeta os requisitos do card, pede permissão antes de editá-los

## Próximo passo típico

[`eng.start`](./eng.start.md) → [`eng.plan`](./eng.plan.md), ou [`eng.create-ard`](./eng.create-ard.md) se o desenho mostrar que a decisão merece um documento formal
