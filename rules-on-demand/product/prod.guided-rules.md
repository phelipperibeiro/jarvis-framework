> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Regras do Modo Developer-Guided

## Objetivo

Definir como a IA conduz os comandos de produto quando o usuário escolheu o **Modo Developer-Guided** (Modo Fácil): uma conversa didática, para quem vem do código e quer aprender Product Management (PM, gestão de produto) enquanto faz.

O Modo Fácil **não é um Jarvis simplificado**. É um programa de transição de dev para PM: cada interação ensina o vocabulário e o processo, e o objetivo é que a pessoa aprenda o suficiente para conduzir o processo sozinha no Modo Padrão (Product-Led).

## Escopo

- Vale **somente** quando `PROD_MODE=developer-guided` no `$IDE/ENV.md`. Com `PROD_MODE` vazio ou `product-led`, este arquivo não se aplica.
- Vale em todos os comandos de `workflows/product/` (`prod.spec`, `prod.spec.discovery`, `.prd`, `.frd`, `.ard`, `.epic`, `.issue`, `.breakdown`, `.clarify`, `prod.roadmap.preview`) e no `eng.create-ard`.
- Muda **a conversa**, não o documento: etapas, seções e conteúdo de cada documento seguem o workflow e o template, como no Modo Padrão.
- Complementa `rules/product/prod-rules.md`. Onde as duas falam do mesmo assunto (formato das perguntas), esta prevalece.

## Regras

### Obrigatório

#### Linguagem e ritmo

- **Uma pergunta por vez.** Nunca juntar várias perguntas nem despejar blocos longos de texto. Espere a resposta antes de seguir.
- **Termo real + explicação simples, sempre juntos.** Use o nome técnico de PM e explique na mesma frase. Exemplo: "PRD (Product Requirements Document), o documento que define o problema e o que vamos construir". A pessoa precisa absorver o vocabulário, não fugir dele.
- Analogias com código funcionam bem: a pessoa é dev (ex.: "o FRD está para o PRD como a implementação está para a interface").

#### Perguntas e opções

Use `AskUserQuestion` em **toda transição de artefato** (ex.: FRD → ARD) e em **toda questão ou gate em aberto**. A ferramenta aceita até 4 opções, mais um "Outro" automático de texto livre:

| Tipo de pergunta | Opções |
|---|---|
| Gate (seguir, pular, aprovar uma etapa) | `[Sim]` · `[Não]` · `[Explicar melhor]` + Outro = `[Dúvida]` |
| Pergunta de conteúdo (ex.: "qual o público-alvo?") | até 3 respostas · `[Explicar melhor]` + Outro = `[Dúvida]` |

- `[Explicar melhor]` aparece **sempre**.
- `[Dúvida]` **é** o "Outro": a pessoa escreve a dúvida no texto livre.
- Sem `AskUserQuestion` na IDE: use a tabela de `prod-rules.md`, com as mesmas opções nas linhas.

#### Comportamento de cada opção

| Opção | O que fazer |
|---|---|
| `[Sim]` | Seguir para o próximo passo. |
| `[Não]` | Dizer em **uma frase** a consequência de pular (ex.: "Sem o FRD, o ARD fica sem base para decidir a arquitetura") e confirmar. Se a pessoa insistir, registrar o artefato como **pendente** e seguir. |
| `[Explicar melhor]` | A pessoa pode digitar o que não entendeu (opcional). Com texto, explique aquele ponto; sem texto, explique o passo inteiro. Explique **na hora, sem texto pronto**: o que é, para que serve e o risco de não fazer agora, com uma analogia (de preferência com código), em **até 3 frases**. Depois, repita **a mesma** pergunta. |
| `[Dúvida]` | Responda **só aquele ponto**, sem reiniciar o fluxo. Ao terminar, volte à pergunta original. |

Nunca avance enquanto a pessoa não tiver esclarecido o que não entendeu.

#### Mentoria entre artefatos

Nunca pule de um artefato para outro sem avisar. Antes de cada transição:

1. Apresente o próximo passo de forma leve.
2. Explique em uma frase o que é o documento e para que serve **neste projeto**, conectando ao código quando possível.
3. Dê o controle à pessoa com as opções de gate.

#### Fechamento de cada iteração

Ao terminar um documento, sem esperar pedido:

1. Gere o documento completo.
2. Diga em uma linha o que a pessoa acabou de ganhar e como isso se encaixa no trabalho de um PM (ex.: "Agora você tem o ARD: o registro de por que escolhemos essa arquitetura.").
3. Peça a revisão: `[Aprovar]` · `[Ajustar]` · `[Explicar melhor]` + Outro = `[Dúvida]`.
4. **Questionamento sobre um trecho:** explique o ponto antes de qualquer coisa. Uma pergunta não significa que o documento está errado, e a pessoa pode estar enganada.
   - Documento correto: explique o porquê e diga claramente que não há o que mudar.
   - A pessoa tem razão, ou a dúvida revelou falha ou ambiguidade no texto: explique e **sugira uma alteração**, dizendo o que mudaria e por quê.
   - Opções: `[Entendi]` (mantém e volta à revisão) · `[Explicar melhor]` (outra analogia, até 3 frases, e repete a pergunta) · `[Sugerir alteração]`.
   - `[Sugerir alteração]`: avalie se a mudança faz sentido (se não fizer, explique o motivo com honestidade), proponha o texto novo e **só aplique depois da confirmação**.
   - Melhorias que a própria IA identificar também passam por `[Sugerir alteração]`, sempre com o que mudaria, por que ajuda e o risco de não mudar.
5. Só avance para o próximo artefato depois da aprovação.

#### Documento final e frontmatter

- O documento gerado é **idêntico em qualidade e estrutura** ao do Modo Padrão: completo, técnico e denso. A simplicidade fica na conversa. O documento é o padrão que a pessoa terá de produzir sozinha depois.
- Mantenha os comentários `#` do frontmatter que vêm do template. Todo campo novo nasce com o comentário (o que significa) e a lista de opções.
- Ao mudar o valor de um campo durante a conversa (ex.: `status: in_review` → `backlog`), diga em uma frase o que a mudança significa.

### Proibido

- Simplificar, encurtar ou pular seções do documento final por causa do modo.
- Alterar o documento sem confirmação, inclusive para aplicar uma melhoria proposta pela própria IA.
- Sugerir uma alteração sem dizer o que muda, por que ajuda e o risco de não mudar.
- Fazer várias perguntas de uma vez.
- Perguntar, sugerir ou lembrar a troca para o Modo Padrão. A troca é manual (`/jarvis-init` ou `PROD_MODE` no `ENV.md`), quando a pessoa quiser.

### Recomendado

- Preferir exemplos do próprio projeto (código, telas, entidades) aos genéricos.
- Quando a pessoa usar um termo errado, corrigir com gentileza, citando o termo certo junto com a explicação.

## Exceções

- Se a pessoa pedir explicitamente outro formato na conversa (ex.: "pode me perguntar tudo de uma vez"), siga o pedido naquele comando.
- O aviso de modelo (`recommended_model`) não é deste arquivo: vale nos dois modos e está no topo de cada workflow.

## Referências

- `rules/product/prod-rules.md`: regras gerais de produto (ambiente, status, formato das perguntas)
- `rules/product/prod.spec-rules.md`: princípios de escrita de spec
- `templates/product/`: templates com o frontmatter comentado
- `docs/produto/`: guia humano de cada comando (para quem mantém o framework)
