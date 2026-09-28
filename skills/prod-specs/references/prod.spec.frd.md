---
name: prod.spec.frd
description: Fluxo para criação de FRD (Feature Requirements Document), que auxilia na definição detalhada dos requisitos funcionais de uma feature
auto_execution_mode: 3
env_file: "@/ENV.md"
allowed-tools: Read, Grep
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: FRDs requerem análise detalhada de requisitos funcionais, comportamento de usuário e especificações técnicas
---

# FRD - Feature Requirements Document

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
1. **Sempre use o template** localizado em  `$SKILL_TEMPLATE_FOLDER/prod-frd-template.md`
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

## Fluxo de Trabalho

O fluxo é dividido em checkpoints obrigatórios (gates). Você NÃO DEVE avançar para o próximo gate até que o usuário aprove explicitamente o atual. NUNCA gere o arquivo final até que TODOS os gates sejam aprovados.

Não busque validação de tudo de uma vez; valide os gates de forma incremental.

### Gate 1: Reconhecer e contextualizar

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
- Somente após os Gates 1–3 aprovados, gere o output final usando o template em `$SKILL_TEMPLATE_FOLDER/prod-frd-template.md`
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