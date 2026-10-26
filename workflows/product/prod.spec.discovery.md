---
name: prod.spec.discovery
description: Investigação inicial de uma ideia: mostra primeiro o que entendeu, faz poucas perguntas de alto impacto (com recomendação), propõe abordagens e registra um rascunho com scorecard, veredito e próximo passo sugerido, sem chutar.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: opus
model_tier: high
model_justification: Discovery exige separar fatos de suposições, escolher as perguntas de maior impacto e julgar evidências sem presumir dados
---

# Discovery (investigação inicial de uma ideia)

> 🎓 **Modo de condução**: leia `PROD_MODE` no `$IDE/ENV.md`. Se for `developer-guided`, **antes de começar leia `$IDE/rules-on-demand/product/prod.guided-rules.md` e siga-o** em toda a conversa. `[Explicar melhor]` e `[Dúvida]` **não contam** no orçamento de perguntas. Vazio ou `product-led`: siga este fluxo como está.
>
> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se o documento for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.

> 🔥 **Warm-up**: se `$SESSIONS_DIR/warm-ups/` tiver aquecimentos, leia `$IDE/rules-on-demand/warm-up-consume-rules.md` e siga-o antes de começar (grava em `$SESSIONS_DIR/prod/{id do documento}/context.md`).
>
> 🔗 **Links**: antes de escrever o discovery, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link.

Investiga uma ideia crua com **poucas perguntas certas** e grava um **rascunho** em `$DISCOVERIES_DOCS/discovery-{id}-{nome}.md`, pelo template `$PROD_TEMPLATES/prod-discovery-template.md`. Postura: agente `$IDE/agents/product/prod.discovery-interviewer.md`. Guia humano: `docs/produto/prod.spec.discovery.md`. Siga `$PROD_RULES` (ENV, idioma, `AskUserQuestion` uma pergunta por vez).

<requirement>
#$ARGUMENTS
</requirement>

**Não é** PRD, FRD, épico, issue, histórias, critérios de aceitação, estimativa nem código. Pedido disso: diga que é outra etapa e indique o comando (`/prod.spec.prd`, `frd`, `epic`, `issue`; para implementar, `/eng.start`).

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 1 — Ler em silêncio | `prod.discovery-interviewer` (agente) | Sempre — a postura da entrevista |
| Passo 1 — Ler em silêncio | `/jarvis-docs-central` | Se `CENTRAL_DOCS_STORAGE` estiver configurado (o que já foi implementado) |
| Passo 1 — Ler em silêncio | `/eng-backend-arch-c4` | Só com a confirmação do usuário; o retorno é suposição a validar |
| Passo 1 — Ler em silêncio | `/eng-platform` + `PLATFORM_SPECIALIZATIONS` | Só com a confirmação do usuário; o retorno é suposição a validar |

## Passo 0 — Entrada

Sem ideia: pergunte qual é, antes de tudo. Caminho, nome ou id de um discovery existente: vá para a **Retomada**. Uma ideia: siga para o Passo 1.

## Passo 1 — Ler em silêncio

Antes de perguntar qualquer coisa, leia: o `$ARGUMENTS`; em `$PROD_DOCS`, os PRD/FRD que já cobrem a ideia; em `$DISCOVERIES_DOCS`, os discoveries parecidos (só título e Entendimento/Ideia); o código e os commits, se ajudarem a viabilidade; o Central docs, se configurado. Não repita perguntas cuja resposta já está em algum desses.

## Passo 2 — Entendimento (uma confirmação)

Mostre **"O que entendi"** e peça **uma** confirmação:

- **Dito por você** | **Suposição minha** (com a origem) | **Lacuna** (marque as críticas: mudam o veredito)
- **Tamanho** e orçamento de perguntas:

  | `size` | Quando | Perguntas | Próximo passo típico |
  |---|---|---|---|
  | `small` | Trabalho pequeno e já claro | 0–2 | `/prod.spec.issue` |
  | `bounded` | Funcionalidade delimitada num produto existente | até 5 | `/prod.spec.frd` |
  | `broad` | Ideia ampla, com várias entregas | até 8 | `/prod.spec.prd` e depois `/prod.spec.breakdown` |

- **Arquivo:** `discovery-{id}-{nome}.md` (id = maior número da pasta + 1, 3 dígitos; nome em kebab-case, sem acentos). Pasta inexistente: crie e comece no `001`.
- **Avisos:** PRD/FRD que já cobre a ideia (sugira `/prod.spec.clarify`); discovery parecido.

`AskUserQuestion`: **Confirmar (Recomendada)** | **Corrigir** | **Retomar o parecido** (só se houver). Ao confirmar, crie o arquivo pelo template (`status: in_review`, `verdict` vazio, `size`, datas, `created_by`/`last_editor` = `USER`) com o Entendimento e o Problema já preenchidos.

## Passo 3 — Perguntas de alto impacto

- Pergunte **só lacunas que mudam o veredito**, da mais para a menos impactante. Nada de roteiro fixo.
- Cada pergunta, com `AskUserQuestion`: **"Pergunta N de até M"**, **Por que importa** (uma frase), opções com a **(Recomendada)** primeiro e o motivo da recomendação.
- **"Não sei"**: registre como lacuna e siga, sem repetir.
- **Default razoável** (formato, padrão de mercado, comportamento comum): não pergunte; registre como **suposição explícita**.
- Peça evidência ou aponte contradição **só** quando a resposta mudar o veredito.
- **Teto atingido:** `AskUserQuestion` **Encerrar (Recomendada)** | **Mais perguntas**.
- Atualize o arquivo ao fim do bloco (Entendimento, Problema, `updated_at`).

## Passo 4 — Abordagens

Proponha **2–3** abordagens, sempre com **a menor coisa que funciona** e **não fazer / usar algo existente**, com prós, contras, riscos e dependências. Indique a **recomendada** e peça a confirmação numa pergunta (Concordo (Recomendada) | Prefiro outra | Ajustar).

## Passo 5 — Scorecard, veredito e próximo passo

1. **Scorecard:** Valor, Usabilidade, Técnica e Negócio → `forte`, `adequado`, `fraco` ou `desconhecido`, com uma linha de justificativa.
2. **Veredito** (recomendação, não aprovação): `proceed` (sem lacuna crítica) · `investigate_more` (lacuna crítica aberta ou lente crítica `desconhecido`) · `do_not_proceed` (motivo; `status: cancelled`).
3. **Próximo passo**, sempre, com o **comando pronto com o id** (ex.: `/prod.spec.frd discovery-002`). **Nunca** o execute: o usuário pode escolher outro caminho ou parar. Pelo tamanho (tabela do Passo 2); `investigate_more` → retomar este discovery pelas lacunas; lacuna crítica técnica → `/eng.light-arch` ou `/eng.create-rfc` (só sugerir); `do_not_proceed` → arquivar, mantendo o registro.

4. Linha no **Histórico** (data, "N de até M" perguntas, lacunas pendentes).

## Retomada

1. Leia o arquivo **inteiro** e resuma onde parou: lacunas abertas, perguntas já usadas, veredito.
2. `cancelled` ou `do_not_proceed`: mostre o motivo e só reabra com confirmação.
3. **Formato antigo** (tem as seções "Hipóteses" ou "Perguntas em aberto"): converta para o template novo **no mesmo caminho** (mesmo id e nome, para os `related_discovery` continuarem válidos) e avise em uma linha. Mapeamento: Ideia → Entendimento (frase); Hipóteses → suposições (com a origem); Perguntas em aberto → lacunas; Alternativas e riscos → Abordagens; Viabilidade → Scorecard (alto/médio/baixo → forte/adequado/fraco); Histórico das sessões → Histórico. Defina o `size` no Entendimento.
4. Siga pelo Passo 3 com o orçamento restante, depois os Passos 4 e 5.

## Não chute (regra inviolável)

- Faltou informação (público, volume, custo, prazo, restrição técnica, estado do código): pergunte, busque no projeto ou registre como **lacuna**. Nunca complete com "o que costuma ser".
- Todo fato tem origem (usuário, arquivo do projeto ou documentação). Sem origem, é **suposição**.
- "Preencha o que faltar" ou "assuma o padrão": registre como **suposição explícita**; ela nunca sustenta o veredito.
- Bibliotecas, APIs e serviços: consulte a documentação atual (`context7`, se o MCP estiver disponível), não a memória.
- **Lacuna crítica nunca dá `proceed`.** Nunca grave credenciais, tokens nem dados pessoais de clientes.

## Casos extremos

| Situação | O que fazer |
|---|---|
| Ideia vaga ("melhorar o sistema") | Peça um recorte mínimo (quem, qual dor, em qual fluxo); sem recorte, `investigate_more` |
| Ideia grande demais | `size: broad`; sugira `/prod.spec.prd` + `/prod.spec.breakdown` ou discoveries menores |
| Viabilidade técnica fora do seu conhecimento | Lacuna crítica, com quem pode responder; não afirme viabilidade |
| Entrevista interrompida | O arquivo fica `in_review`, `verdict` vazio; a Retomada continua dali. A entrevista é só com quem executou o comando |
