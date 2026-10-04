---
name: prod.spec.discovery
description: Investigação inicial de uma ideia: entrevista o usuário sobre a ideia, o problema, os requisitos iniciais e a viabilidade, sem chutar, e registra um rascunho estruturado com veredito e próximo passo sugerido.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Discovery exige conduzir uma entrevista adaptativa, julgar evidências e registrar hipóteses sem presumir dados
---

# Discovery (investigação inicial de uma ideia)

Este comando conduz uma **entrevista** para investigar uma ideia ainda crua e registrar o resultado em um **rascunho estruturado**: o problema, o que precisaria ser verdade e se parece viável.

Antes de iniciar, revise as regras invioláveis em `$PROD_RULES/**/*`.

- **Agente:** `$IDE/agents/product/prod.discovery-interviewer.md` conduz a entrevista; siga a postura dele.
- **Template:** `$PROD_TEMPLATES/prod-discovery-template.md` define a estrutura do arquivo. Siga a estrutura exata do template.
- **Guia humano (termos por extenso):** `docs/produto/prod.spec.discovery.md`.

Utilize o `$ARGUMENTS` como ponto de partida (a ideia, ou o caminho ou nome de um discovery existente para retomar):

<requirement>
#$ARGUMENTS
</requirement>

## O que este comando é e o que não é

O discovery é um **rascunho**: registra o que se sabe, o que é hipótese e o que ainda é lacuna. Nada nele é verdade absoluta.

Ele **não** gera PRD, FRD, épico, issue, tarefas, histórias, critérios de aceitação nem estimativas, e **não** escreve código. Se o usuário pedir qualquer uma dessas coisas, explique que é outra etapa e indique o comando certo (`$PROD_FLOWS/prod.spec.prd.md`, `prod.spec.frd.md`, `prod.spec.epic.md`, `prod.spec.issue.md`; para implementar, o fluxo `/eng.start`).

## Regras do framework

O comando e o agente seguem obrigatoriamente `$PROD_RULES` (`prod-rules.md`):

- Validar o `$IDE/ENV.md` antes de começar (se estiver ausente ou incompleto, aplicar o fluxo do `prod-rules.md`)
- Idioma: português do Brasil por padrão, ou o idioma da interação do usuário
- Perguntas: use o `AskUserQuestion` se estiver disponível; senão, o formato de tabela do `prod-rules.md`. **Uma pergunta por vez**
- Confirmar com o usuário o caminho e o nome antes de salvar arquivo

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Regras do framework / Passo 4 — A entrevista | `prod.discovery-interviewer` (agente) | Sempre — conduz a entrevista, e o comando segue a postura dele |
| Passo 2 — Reconhecer o projeto | `/jarvis-docs-central` | Se `CENTRAL_DOCS_REPO` estiver configurado |
| Passo 2 — Reconhecer o projeto | `/jarvis-context-detect` | Para calibrar a profundidade da entrevista |
| Passo 2 — Reconhecer o projeto | `/eng-backend-arch-c4` | Só com a confirmação do usuário; o retorno é tratado como suposição a validar |
| Passo 2 — Reconhecer o projeto | `/eng-security-cybersecurity` | Só com a confirmação do usuário; o retorno é tratado como suposição a validar |

## Passo 0 — Entender o que foi pedido

1. **Sem `$ARGUMENTS`:** pergunte qual é a ideia antes de qualquer outra coisa.
2. **Com `$ARGUMENTS` apontando um discovery existente** (caminho ou nome): vá para a **Retomada** (Passo 1).
3. **Com uma ideia em `$ARGUMENTS`:** use esse texto como ponto de partida e **não repita perguntas** cuja resposta já está nele. Antes de criar um arquivo novo, procure em `$PROD_DOCS/discoveries/` um discovery **parecido** (leia só o título e a seção Ideia). Se achar, avise e pergunte se o usuário quer retomar aquele ou começar um novo, sem sobrescrever nada em silêncio.
4. Se já existir PRD ou FRD em `$PROD_DOCS` que cubra a ideia, avise qual é e pergunte se o usuário quer seguir com o discovery (por exemplo, para reavaliar) ou ir para `$PROD_FLOWS/prod.spec.clarify.md`.

## Passo 1 — Retomada de um discovery existente

1. Leia o arquivo inteiro.
2. **Resuma onde parou:** temas cobertos, hipóteses de importância alta e certeza baixa, perguntas em aberto e o histórico das sessões.
3. Continue a entrevista pelos **temas incompletos** e pelas **perguntas em aberto**, sem repetir o que já foi respondido.
4. Acrescente uma linha ao **Histórico das sessões** e atualize `updated_at` e `last_editor`.
5. Se o discovery está `cancelled` ou com `verdict: do_not_proceed`, avise o motivo registrado e só reabra com confirmação do usuário.

## Passo 2 — Reconhecer o projeto

Antes de perguntar, consulte o que já existe:

- Documentos em `$PROD_DOCS` (PRDs, FRDs e discoveries), para não duplicar o que já está especificado
- O código e os últimos commits, quando ajudarem a embasar a viabilidade
- `jarvis-docs-central`, se `CENTRAL_DOCS_REPO` estiver configurado
- `jarvis-context-detect`, para calibrar a profundidade da entrevista
- `eng-backend-arch-c4` e `eng-security-cybersecurity` são skills de engenharia: só consulte **com a confirmação do usuário**, e trate o retorno como **suposição a validar**, não como fato

## Passo 3 — Criar o arquivo

Crie o arquivo **logo no início** da entrevista, para que uma conversa interrompida possa ser retomada:

1. **Pasta:** `$PROD_DOCS/discoveries/`. Se não existir, crie-a e comece no `001`, confirmando o caminho com o usuário.
2. **Id:** sequencial, pela listagem dos arquivos `discovery-*.md` da pasta (maior número + 1, com 3 dígitos).
3. **Nome:** `{nome}` em kebab-case, sem acentos, derivado da ideia. Proponha e peça a confirmação do usuário.
4. **Arquivo:** `$PROD_DOCS/discoveries/discovery-{id}-{nome}.md`, pelo template, com `status: in_review` e `verdict` vazio.
5. **Metadados:** `created_at`, `updated_at`, `created_by` e `last_editor` (do `ENV.md`: `USER`).

## Passo 4 — A entrevista

Conduza como o agente `prod.discovery-interviewer`:

1. Explique em poucas linhas que vai entrevistar, quais temas serão cobertos (ideia, problema, requisitos, viabilidade) e que o usuário pode responder "não sei" a qualquer momento.
2. **Uma pergunta por vez.** Se o usuário não responde ou diz "não sei", não repita a pergunta: registre "não informado" e siga.
3. Trate o roteiro abaixo como **perguntas-semente**, não como lista fixa: adapte a próxima pergunta ao que já foi respondido e priorize as de maior impacto na decisão de seguir ou não.
4. **Aprofunde** respostas rasas ("por quê?", "para quem?", "com que frequência?", "me dá um exemplo real", "o que acontece hoje?"). Diante de uma afirmação sem evidência ("todo mundo quer"), pergunte qual é a evidência e registre se é dado, observação ou suposição.
5. **Aponte contradições**, entre respostas ou com o que foi encontrado no projeto, e peça que o usuário resolva.
6. **Levante o que o usuário provavelmente não considerou**: quem mais é impactado, custo de manutenção, o que acontece se der errado, a alternativa mais simples.
7. Ao cobrir um tema, **resuma** o que entendeu e peça confirmação antes de seguir. Em seguida, **atualize o arquivo** (Passo 5).

### Temas e perguntas-semente

| Tema | Perguntas-semente |
|---|---|
| **Ideia** | O que é, em uma frase? Para quem? |
| **Problema** | Qual é o problema (sem falar de solução)? Quem sofre com ele e em que situação? Como se resolve hoje? Que evidência existe? Por que agora? Como saberemos que funcionou? |
| **Hipóteses** | O que precisaria ser verdade para isso funcionar? Quais dessas coisas você tem certeza e quais são palpite? Como confirmaríamos cada uma? |
| **Viabilidade** | Valor: alguém vai querer e usar? Usabilidade: as pessoas conseguem usar? Técnica: o que já existe no projeto ajuda ou atrapalha? Negócio: custo, prazo e risco fazem sentido? |
| **Alternativas e riscos** | E se não fizéssemos nada? Existe algo pronto que resolva? O que pode dar errado? Do que isso depende? |

## Passo 5 — Manter o arquivo

- Ao fim de **cada tema**, atualize as seções correspondentes do arquivo e o `updated_at`.
- Registre cada sessão no **Histórico das sessões** (data e o que foi coberto).
- Na tabela de **Hipóteses**, registre sempre a **origem** (dado, observação do usuário ou suposição).
- **Nunca** grave credenciais, tokens nem dados pessoais de clientes: o arquivo é versionado.
- Uma entrevista interrompida deixa o arquivo com `status: in_review` e `verdict` vazio, com os temas já cobertos.

## Passo 6 — Não chute (regra inviolável)

- Quando faltar uma informação (público, volume, custo, prazo, restrição técnica, comportamento de usuários, estado atual do código), **não presuma**: pergunte, busque no projeto ou registre como **lacuna**.
- Todo fato citado indica a origem (resposta do usuário, arquivo do projeto ou documentação consultada). O que não tem origem entra como **suposição a validar**.
- Se o usuário pedir "preencha o que faltar" ou "assuma o padrão", registre o item como **suposição explícita**, nunca como fato, e não a use para sustentar o veredito.
- Quando a viabilidade técnica depender de bibliotecas, APIs ou serviços, consulte a documentação atual (por exemplo, Context7), não a memória.
- Uma **lacuna crítica nunca** resulta em `proceed`.

## Passo 7 — Encerrar

1. Quando achar que tem informação suficiente, **proponha encerrar** e pergunte se o usuário quer acrescentar algo.
2. Complete o documento: viabilidade por lente (sinal alto, médio ou baixo, com justificativa), alternativas e riscos, perguntas em aberto e o histórico.
3. **Veredito** (em `verdict`), sempre como **recomendação**, nunca como aprovação:
   - `proceed`: vale especificar; sem lacuna crítica aberta
   - `investigate_more`: há lacuna crítica; liste o que falta
   - `do_not_proceed`: informe o motivo; mude o `status` para `cancelled`
4. **Próximo passo sugerido**, **sempre**, qualquer que seja o veredito (comando recomendado, motivo e, se houver, alternativa). É **só uma sugestão**: mostre o **comando pronto com o id deste discovery** (por exemplo `/prod.spec.prd discovery-002`) para o usuário usá-lo como insumo, **nunca execute o comando sozinho**, e deixe claro que o usuário pode escolher outro caminho ou parar ali.

### Mapa de escolha do próximo passo

| O que o discovery revelou | Próximo passo sugerido |
|---|---|
| Ideia ampla, com várias entregas | `/prod.spec.prd` e depois `/prod.spec.breakdown` |
| Funcionalidade delimitada dentro de um produto existente | `/prod.spec.frd` |
| Trabalho pequeno e já claro | `/prod.spec.issue` |
| Lacunas críticas ou veredito `investigate_more` | Retomar este discovery, com as perguntas em aberto |
| Lacuna crítica na viabilidade técnica | Investigação técnica no fluxo de engenharia (`/eng.light-arch` ou `/eng.create-rfc`), sugerida sem acioná-la |
| Veredito `do_not_proceed` | Arquivar a ideia, mantendo o registro |

## Casos extremos

| Situação | O que fazer |
|---|---|
| Ideia vaga demais ("melhorar o sistema") | Peça um recorte mínimo (quem, qual dor, em qual fluxo); se o usuário não conseguir, o veredito é `investigate_more` |
| Ideia grande demais (várias funcionalidades) | Sinalize no documento e recomende, no próximo passo, a decomposição (`/prod.spec.prd` e `/prod.spec.breakdown`) ou separar em discoveries menores, sem forçar |
| Viabilidade técnica depende de conhecimento que você não tem | Registre como lacuna nas perguntas em aberto, indicando quem pode responder, sem afirmar viabilidade |
| Pasta `discoveries/` inexistente | Crie a pasta e o arquivo `001`, confirmando o caminho |
| Ideia já coberta por PRD ou FRD existente | Avise qual documento cobre e pergunte como seguir |
| Discovery com `do_not_proceed` | Mantenha o arquivo como registro da decisão |

## Limites

- Pedido de PRD, FRD, épico ou issue: indique o comando correto, sem gerar o documento
- Pedido de tarefas, histórias, critérios de aceitação ou estimativas: recuse, por ser outra etapa
- Pedido de implementação: recuse; o discovery só investiga e não escreve código
- A entrevista é sempre com o usuário que executou o comando (não entrevista terceiros)
