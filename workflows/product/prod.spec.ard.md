---
name: prod.spec.ard
description: Ponto de entrada de produto para o ARD (Architecture Requirements Document): levanta com o PM os requisitos arquiteturais em termos de produto e conduz o ARD pelo fluxo de engenharia.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: gpt-4o
model_tier: medium
model_justification: Levantamento estruturado de requisitos arquiteturais a partir de PRD e FRD, seguido da condução do fluxo de engenharia existente
---

# ARD a partir do produto (Architecture Requirements Document)

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Este fluxo é a **porta de entrada de produto** para o ARD. Ele levanta com o PM, em linguagem de produto, o que a arquitetura precisa atender (restrições, requisitos não funcionais, integrações, volumes e riscos) e, com isso, **conduz o ARD pelo fluxo de engenharia** (`eng.create-ard`), sem duplicá-lo.

> ⚠️ **O ARD é um documento de engenharia.** O arquivo resultante fica em `$DOCS_FOLDER/engineering/ARD/` (como no `eng.create-ard`), e as decisões de arquitetura pertencem à engenharia. Este comando só levanta os requisitos e abre o fluxo. Diga isso ao usuário no início.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Quando usar
- Depois de um PRD ou FRD aprovado, quando falta registrar os requisitos arquiteturais da iniciativa
- Quando o PM precisa deixar claro para a engenharia o que a arquitetura precisa atender (volumes, prazos, integrações, regras de negócio com impacto técnico)
- Para iniciar um ARD novo a partir de uma especificação de produto já existente

## Quando **não** usar
- Para iterar ou editar um ARD que já existe → use `eng.create-ard` (modo `edit`)
- Para extrair o ARD do código existente → use `eng.create-ard-from-code`
- Para decidir tecnologia, desenho de componentes ou contratos → isso é da engenharia, dentro do ARD
- Quando ainda não há PRD nem FRD e a ideia está crua → comece por `prod.spec.discovery` ou `prod.spec.prd`

## Pré-requisitos e opcionais
- **PRD ou FRD de origem (recomendado).** Procure em `$PROD_DOCS` e pergunte qual é a origem. Sem nenhum, avise que o ARD fica sem rastreabilidade e pergunte se o usuário quer seguir assim ou criar antes o PRD (`prod.spec.prd`) ou o FRD (`prod.spec.frd`).
- **Discovery (opcional).** Se o usuário apontar um discovery (por exemplo `discovery-002`), siga o princípio "Discovery como insumo" de `$PROD_RULES/prod.spec-rules.md`: leia-o como contexto e repasse tudo com o usuário antes de usar. Sem discovery apontado, não procure nem pergunte.
- Nome do ARD (título e slug em kebab-case): pergunte se não vier em `$ARGUMENTS`.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Gate 1: Reconhecer o contexto | `/jarvis-docs-central` (via `jarvis docs sync --silent`) | Se `CENTRAL_DOCS_REPO` estiver definido no ENV.md e for preciso buscar o PRD ou FRD relacionado |
| Gate 4: Conduzir o ARD | `/eng.create-ard` | Sempre, depois de os requisitos serem confirmados: modo `new`, com `--prd` quando houver PRD (workflow de engenharia; o aviso de transição de domínio é dado antes) |

## Resultado final
- Um **resumo dos requisitos arquiteturais** confirmado pelo usuário (Gate 3), entregue como insumo ao `eng.create-ard`
- O **ARD** gerado pelo `eng.create-ard` (numeração `ARD-###`, versão `1.0.0`, template `$IDE/templates/engineering/ARD-template.md` e caminho `$DOCS_FOLDER/engineering/ARD/{ARD-ID}-{slug}.md`)
- Rascunhos WIP, se houver, em `$SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/`; o documento canônico é o ARD
- O arquivo final no mesmo idioma da interação do usuário

## Princípios
- **Não invente.** O que o PM não souber fica registrado como "a validar pela engenharia", e não como fato.
- **Termos de produto, não de tecnologia.** Pergunte pelo que a solução precisa atender (por exemplo, "quantos usuários simultâneos no pico?"), e não por qual banco ou framework usar.
- **Uma pergunta por vez.** Siga o formato de perguntas de `prod-rules.md` (`AskUserQuestion` quando existir; tabela com alternativas quando não).
- **Terminologia consistente** com a do PRD e do FRD de origem (ver `$PROD_RULES/prod.spec-rules.md`).

## Etapas de execução

### Gate 1: Reconhecer o contexto
1. Valide o `ENV.md` (regra geral de produto) e avise que o ARD é um documento de engenharia.
2. Identifique o PRD ou FRD de origem em `$PROD_DOCS` (ou o caminho que o usuário informar) e leia-o. Se `CENTRAL_DOCS_REPO` estiver definido, busque no central docs o PRD ou FRD relacionado.
3. Resuma em poucas linhas o que a especificação pede e confirme com o usuário que é essa a origem. Se `AREA` do usuário não for `ENGINEERING`, avise que o ARD seguirá o fluxo de engenharia e deve ser revisado por alguém da engenharia.

### Gate 2: Levantar os requisitos arquiteturais em termos de produto
Pergunte, **uma por vez**, só o que a especificação não responde (pule o que o PRD ou FRD já traz, confirmando):
- **Volume e uso:** quantidade de usuários, picos, crescimento esperado, janelas de uso
- **Requisitos não funcionais:** disponibilidade, tempo de resposta aceitável, retenção e auditoria de dados
- **Integrações:** sistemas, parceiros ou serviços externos com que a solução precisa falar
- **Regras de negócio com impacto técnico:** limites, prazos legais, compliance (LGPD e afins), dados sensíveis
- **Restrições:** prazo, orçamento, equipe, tecnologias que **já são obrigatórias** na organização
- **Riscos conhecidos** e dependências de outras iniciativas

### Gate 3: Resumir e confirmar
Apresente o **resumo dos requisitos arquiteturais** (por tópico do Gate 2, marcando o que ficou "a validar pela engenharia") e peça confirmação. Itere até a aprovação explícita. Não avance sem ela.

### Gate 4: Conduzir o ARD
1. Avise, antes de seguir, que a próxima etapa é o fluxo de engenharia e que as decisões de arquitetura passam a ser da engenharia.
2. Execute o workflow `eng.create-ard` no modo `new`, com o nome do ARD e `--prd <caminho>` quando houver PRD de origem, entregando o resumo do Gate 3 como insumo do documento (seções de premissas, restrições, integrações, segurança, escalabilidade e riscos do template).
3. O `eng.create-ard` cuida de numeração, versão, preenchimento do template, análise de impacto, estratégia de testes, guard rails e publicação no central docs. Siga as instruções dele a partir daí.

### Gate 5: Fechar
1. Informe o caminho do ARD criado e o que ficou "a validar pela engenharia".
2. Sugira o próximo passo: revisão do ARD pela engenharia e, depois, `/eng.start` para a implementação. Não execute o próximo passo.
3. Se a informação do ARD divergir do PRD ou FRD de origem, avise o usuário e sugira atualizar a especificação de produto (o PRD e o FRD são a fonte da verdade do produto).

## Do
- Confirmar a origem (PRD ou FRD) antes de perguntar
- Registrar tudo o que o PM não souber como "a validar pela engenharia"
- Deixar claro, no início e antes do Gate 4, que o ARD é um documento de engenharia

## Don't
- Escolher tecnologia, desenhar componentes ou definir contratos aqui (isso é do ARD, pela engenharia)
- Duplicar o `eng.create-ard`: numeração, template e publicação são dele
- Criar o ARD sem o resumo confirmado no Gate 3
- Alterar o PRD ou o FRD de origem sem o usuário pedir
