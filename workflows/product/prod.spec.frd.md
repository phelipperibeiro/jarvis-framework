---
name: prod.spec.frd
description: Fluxo para criação de FRD (Functional Requirements Document), que auxilia na definição detalhada dos requisitos funcionais de uma feature
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: FRDs requerem análise detalhada de requisitos funcionais, comportamento de usuário e especificações técnicas
---

# FRD - Functional Requirements Document

Este comando tem como objetivo criar, atualizar ou editar uma FRD seguindo o template especificado e as instruções.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Quando usar
- Quando é necessário documentar requisitos funcionais detalhados para uma feature
- Antes do desenvolvimento para garantir clareza sobre o que deve ser construído
- Para alinhar equipes técnicas e de produto sobre os requisitos esperados
- Para documentar critérios de aceitação claros e testáveis
- Para descrever o funcionamento detalhado da feature a partir do comportamento do usuário, de especificações de produto e de design

## Princípios Fundamentais
1. **Sempre use o template** `$PROD_TEMPLATES/prod-frd-template.md` para o output final
2. **Nunca crie o arquivo final com suposições não validadas** — sempre confirme sugestões primeiro
3. **Seja inteligente, não robótico** — analise o contexto e proponha sugestões inteligentes, não faça perguntas vazias

---

## Sobre a atuação e função de uma FRD

A FRD não é um épico, história ou task: ela serve como documento de detalhamento que descreve profundamente os requisitos funcionais e não funcionais de uma solução de produto, atuando como ponte entre a especificação de produto e o código. Ela unifica requisitos e critérios da funcionalidade do ponto de vista de produto, usuário, design e técnico.

- A partir de FRDs é possível criar épicos, histórias e tasks
- FRDs são relacionadas a PRDs e também a ARDs
- FRDs são formadas por features, ações e jornadas que o usuário executa na plataforma
- FRD não é um produto, mas uma solução dentro de um produto
- Dentro das FRDs devem ter as descrições micro de ações e sub-funcionalidades
- Uma FRD descreve a solução nível médio, que faz parte de um produto ou solução maior descrita no PRD
- A FRD precisa descrever o comportamento do usuário e do sistema de forma detalhada, agrupando micro-ações e jobs to be done do usuário

---

## Busca no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` definido no ENV.md:

1. **Buscar PRD correspondente:**
   - Executar busca automática no central-docs:
     ```bash
     jarvis docs sync --silent
     ```
   - Buscar PRD relacionado usando:
     - Nome/contexto fornecido pelo usuário
     - Jira ID (se disponível)
     - Tags semânticas
   - Se PRD encontrado no central-docs:
     - Carregar automaticamente como base para o FRD
     - Informar ao usuário: "✅ PRD encontrado no central-docs: [nome]"
     - Passar como contexto para o Gate 1 (Fluxo de Trabalho, abaixo)
   - Se não encontrado:
     - Perguntar ao usuário se tem PRD localmente
     - Continuar com fluxo normal

## Fluxo de Trabalho

O fluxo é dividido em checkpoints obrigatórios (gates). Você NÃO DEVE avançar para o próximo gate até que o usuário aprove explicitamente o atual. NUNCA gere o arquivo final até que TODOS os gates sejam aprovados.

Não busque validação de tudo de uma vez; valide os gates de forma incremental.

### Gate 1: Reconhecer e contextualizar

- **Discovery (opcional).** Se o usuário apontar um discovery (por exemplo `discovery-002`), siga o princípio "Discovery como insumo" de `$PROD_RULES/prod.spec-rules.md`: leia-o como contexto e repasse tudo com o usuário antes de avançar. Sem discovery apontado, siga este fluxo normalmente, sem procurar na pasta `discoveries/`.
- Reconheça o que o usuário forneceu (liste o que foi recebido) 
- Utilize o contexto fornecido pelo usuário ou pelo agente para criar o output final
- Se houverem PRDs, liste-as para que o usuário possa escolher qual é o PRD de origem desta FRD. Se não houver PRD, pergunte se o usuário quer criar uma antes ou continuar sem PRD relacionada
- Faça 2–3 perguntas estratégicas sobre: escopo da feature, usuário impactado, restrições técnicas ou de design conhecidas
- **PARE e aguarde a resposta do usuário antes de prosseguir**

### Gate 2: Lista de Features e Jornada do Usuário

- Pergunte para o usuário se ele já tem informações de features relacionadas a essa FRD
- Proponha a lista de features que compõem este FRD — cada feature deve ser uma funcionalidade específica e implementável, e não uma tarefa técnica ou história de usuário
- Utilize as informações do usuário para escrever uma descrição de até 350 caracteres de cada feature, sintetizando o que aquela feature deve fazer e o seu resultado
- Formato: "Para a feature [Nome], sugiro: [descrição]. Justificativa: [por quê].
- Apresente um rascunho da jornada do usuário com base no que foi fornecido. Pergunte se o usuário tem artefatos de design (layouts, imagens, diagramas, links de Figma ou similares) que possam enriquecer a jornada
- **PARE e aguarde confirmação do usuário antes de prosseguir**

### Gate 3: Sugerir conteúdo para seções ausentes

- Para CADA seção do template que o usuário NÃO forneceu conteúdo explicitamente, apresente suas sugestões com justificativa. Se o usuário pular, não inclua o bloco no output final 
- Agrupe sugestões relacionadas (ex.: todos os requisitos juntos, todas as dependências juntas)
- Formato: "Para [Nome da Seção], sugiro: [conteúdo]. Justificativa: [por quê]. Devo incluir, modificar ou remover?"
- Seções que DEVEM ser validadas se não fornecidas: TL;DR, Introdução e contexto, Requisitos e critérios, Dependências, O que essa solução não é
- Se você identificar que está em uma pasta que contém o código do projeto/produto, procure entender o contexto. Mostre uma sugestão para o usuário de critérios técnicos do que você encontrou (endpoints, tabelas, tecnologias), e pergunte se ele quer confirmar, validar ou deixar para depois. Se depois, preencha apenas com comportamentos de produto e do usuário
- **PARE e aguarde o usuário aprovar, modificar ou rejeitar CADA grupo de sugestões antes de prosseguir**

### Gate 4: Gerar output final

- Se está modificando uma FRD existente, atualize apenas as seções alteradas ou especificadas pelo usuário. Não modifique o arquivo sem pedido explícito
- Somente após os Gates 1–3 aprovados, gere o output final usando o template em `$PROD_TEMPLATES/prod-frd-template.md`
- O output deve conter APENAS: conteúdo fornecido pelo usuário + sugestões aprovadas, seguindo o template
- Se uma seção não tiver conteúdo fornecido ou aprovado, deixe em branco com marcador TODO e informe o usuário

---

## Abordagens por Contexto

**Contexto rico** (documento, PRD ou requisitos detalhados fornecidos):
- Analise o que está completo vs. o que está faltando
- Sugira complementos com raciocínio: "Com base em X, sugiro Y porque Z. Está correto?"
- Agrupe sugestões relacionadas

**Contexto mínimo** (apenas uma ideia ou nome de feature):
- Faça perguntas direcionadas para o TL;DR (O QUÊ / POR QUÊ / COMO)
- Infira contexto adicional e valide: "A partir das suas respostas, infiro X. Devo incluir isso?"

**Feature de projeto existente**:
- Leia o código-fonte, documentos e FRDs existentes primeiro
- Sugira a jornada e as features com base na análise para confirmação

**Design disponível**:
- Use os artefatos de design (Figma, imagens) como fonte primária para a jornada
- Derive os requisitos a partir dos fluxos de tela, não ao contrário

---

## Padrões de Qualidade

✅ **Boa sugestão**: Contextual, específica, orientada ao comportamento do usuário
```
Com base no fluxo de cadastro de oficinas, sugiro como requisito:
"Quando o usuário clica em 'Salvar', o sistema valida os campos obrigatórios
em tempo real e exibe mensagens de erro inline abaixo de cada campo inválido."

Isso cobre o comportamento esperado e o estado de erro. Posso usá-lo?
```

❌ **Má sugestão**: Genérica, sem comportamento definido
```
O sistema deve validar os dados do formulário.
```

---

## Evite
- Perguntas vazias sem sugestões quando há contexto disponível
- Perguntar sobre cada pequeno detalhe separadamente
- Misturar requisitos funcionais com não funcionais no mesmo item
- Requisitos vagos ou não testáveis ("o sistema deve ser rápido")
- Combinar múltiplos comportamentos em um único requisito
- Inventar jornadas, fluxos ou restrições técnicas sem base no input do usuário
- Criar o documento final antes de o usuário validar as suposições
- Superengenheirar — foque nas necessidades principais, não em casos extremos desnecessários

---

## Instruções

- Se o usuário forneceu ou está atuando em um projeto existente, priorize obter informações sobre o projeto a partir de:
  - **Central-docs** (se configurado) - busca automática do PRD correspondente
  - Documentação existente (README, docs/, PRDs, FRDs, ARDs, etc.)
  - Commits recentes para entender o que está sendo desenvolvido
  - Arquivos de AI como CLAUDE.md e AGENTS.md para obter informações estruturadas sobre o contexto do projeto/produto.
- Para fazer perguntas para o usuário, tente usar o tool `AskUserQuestion` se ele estiver disponível no seu ambiente
- Conduza o **Fluxo de Trabalho** acima (Gates 1 a 4), usando as informações que encontrou como contexto, e gere o output final pelo template `$PROD_TEMPLATES/prod-frd-template.md`
- Quando o Gate 4 gerar o documento, mostre para o usuário o resultado final para a aprovação e validação.
- Quando confirmado e validado pelo usuário:
  - Se o usuário estiver modificando ou atualizando uma spec existente, salve o arquivo modificado
  - Se for uma spec nova:
    - Salve na pasta `$PROD_DOCS` seguindo todos os padrões de nomenclatura e estrutura de pastas já estabelecidos em `$PROD_RULES/**/*`

## Publicação no Central Docs (condicional)

Após salvar o FRD localmente e obter aprovação do usuário:

1. Se `CENTRAL_DOCS_REPO` definido no ENV.md:
   - Perguntar ao usuário:
     ```
     Deseja publicar este FRD no repositório central de documentação?
     - ( ) Sim, publicar agora
     - ( ) Não, vou publicar depois manualmente
     ```

2. Se **Sim**:
   - Extrair o slug do nome do arquivo (ex: `frd-wallet-saque.md` → `wallet-saque`)
   - Executar:
     ```bash
     jarvis docs publish \
       --file {caminho_do_frd} \
       --tipo frd \
       --feature {slug}
     ```

3. Informar resultado:
   - ✅ Sucesso: "FRD publicado no central-docs. MR criado: [URL]"
   - ❌ Erro: Exibir mensagem de erro e orientar troubleshooting

4. Se **Não**:
   - Informar: "Para publicar depois, execute: `jarvis docs publish --file {caminho} --tipo frd --feature {slug}`"

5. Se `CENTRAL_DOCS_REPO` não estiver definido:
   - Informar: "Para habilitar publicação automática, configure `CENTRAL_DOCS_REPO` no ENV.md"

> **Nota**: A publicação cria um Merge Request no GitLab. O FRD só será visível no central-docs após aprovação e merge do MR.
