---
name: prod.spec.prd
description: Instruções para alterar ou criar um especificação de produto PRD - Product Requirement Document seguindo o template e as melhores prática de mercado, de forma que possa ser utilizado e expandido por agentes de IA e humanos.
auto_execution_mode: 3
env_file: "@/ENV.md"
allowed-tools: Read, Grep
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: PRDs requerem análise profunda de requisitos, estruturação de documentos complexos e compreensão de contexto de negócio
---

# PRD - Product Requirement Document

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

# Quando usar
- Ao iniciar uma nova especificação de PRD (Product Requirment Document)
- Precisar modificar um PRD existente
- Quando documentação abrangente é necessária
- Como fonte única de verdade para o desenvolvimento do produto e base para derivar histórias e tarefas

## Princípios Fundamentais
1. **Sempre use o template** desta skill localizado em `$SKILL_TEMPLATE_FOLDER/prod-prd-template.md` dessa skill para o output final
2. **Nunca crie o arquivo final com suposições não validadas** — sempre confirme sugestões primeiro
3. **Seja inteligente, não robótico** — analise o contexto e proponha sugestões inteligentes, não faça perguntas vazias

---

## Fluxo de Trabalho

O fluxo é dividido em checkpoints obrigatórios (gates). Você NÃO DEVE avançar para o próximo gate até que o usuário aprove explicitamente o atual. NUNCA gere o arquivo final até que TODOS os gates sejam aprovados.

Não busque validação de tudo de uma vez; valide os gates de forma incremental.

### Gate 1: Reconhecer e esclarecer
- Reconheça o que o usuário forneceu (liste o que foi recebido).
- Identifique o que foi fornecido explicitamente vs. o que está faltando
- Evite fazer novas buscas ou leitura de arquivos se você já recebeu informações suficientes para prosseguir. Caso contrário, peça mais informações para o usuário. Diga exatamente o que você precisa para preencher o template completamente.
- Faça 2–3 perguntas estratégicas sobre: clareza do problema, limites de escopo, restrições técnicas
- **PARE e aguarde a resposta do usuário antes de prosseguir**

### Gate 2: Sugerir conteúdo para seções ausentes
- Para CADA seção do template que o usuário NÃO forneceu conteúdo explicitamente, apresente suas sugestões com justificativa. Se o usuário pular, não coloque o bloco no output final.
- Agrupe sugestões relacionadas (ex.: todos os indicadores de sucesso juntos, todas as evoluções futuras juntas)
- Formato: "Para [Nome da Seção], sugiro: [conteúdo]. Justificativa: [por quê]. Devo incluir, modificar ou remover?"
- Seções que DEVEM ser validadas se não fornecidas pelo usuário: TL;DR, Contexto, Definição do Problema, Indicadores de Sucesso, O que esta Iniciativa Não É, Evoluções Futuras, Fora do Escopo
- **PARE e aguarde o usuário aprovar, modificar ou rejeitar CADA grupo de sugestões antes de prosseguir**

### Gate 3: Confirmar lista de FRDs
O FRD representa funcionalidades e características do produto/solução. Não são tarefas, histórias ou micro ações dentro da funcionalidade. O FRD decompõe o PRD em soluções de médio porte que, juntas, formam a solução final.

- Utilize primariamente a lista de FRDs que o usuário deve ter fornecido. 
- Se usuário não forneceu qualquer tipo de FRD, apresente uma lista sugestiva a partir das informações do projeto que você tem até agora e use práticas e seu conhecimento de mercado para sugerir uma lista completa de FRDs que podem ser concluídos, com ID, nome e uma descrição em uma linha
- Separe claramente: FRDs baseados no input do usuário vs. FRDs que você está sugerindo
- **PARE e aguarde a confirmação do usuário antes de prosseguir**

### Gate 4: Gerar output final
- Se está modificando um PRD existente, apenas atualize as seções que foram alteradas ou adicionadas ou especificadas pelo usuário. Não modifique o arquivo sem pedido explicito do usuário.
- Somente após os Gates 1–3 aprovados, gere o output final usando o template localizado em `$SKILL_TEMPLATE_FOLDER/prod-prd-template.md`
- O output final deve conter APENAS: conteúdo fornecido pelo usuário + sugestões aprovadas pelo usuário, seguindo o template
- Se uma seção não tiver conteúdo fornecido ou aprovado, deixe em branco com um marcador TODO e informe o usuário
- Antes de disponibilizar o output final, valide se está seguindo todos os padrões estabelecidos no template
- Disponibilize o output final como artefato para o usuário ou para o Agente AI utilizado, conforme a necessidade

---

## Abordagens por Contexto

**Contexto rico** (documento/requisitos detalhados fornecidos):
- Analise o que está completo vs. o que está faltando
- Sugira complementos com raciocínio: "Com base em X, sugiro Y porque Z. Está correto?"
- Agrupe sugestões relacionadas (ex.: todos os indicadores de sucesso juntos)

**Contexto mínimo** (apenas uma ideia):
- Faça perguntas direcionadas para o TL;DR (O QUÊ / POR QUÊ / COMO)
- Infira contexto adicional e valide: "A partir das suas respostas, infiro X. Devo incluir isso?"

**Projeto existente**:
- Leia o código-fonte, documentos e commits recentes primeiro
- Sugira o TL;DR com base na análise para confirmação

**Funcionalidades mencionadas**:
- Sugira a lista de FRDs e confirme antes de incluir

---

## Padrões de Qualidade

✅ **Boa sugestão**: Contextual, específica, demonstra entendimento do domínio
```
Com base em ser um plugin de sincronização para criadores, sugiro:
- Confiabilidade de Sincronização: taxa de sucesso de 99,5%
- Tempo Economizado: redução de 15 min/publicação
- Adoção: 70% usando 3+ vezes/semana após 30 dias

Esses indicadores estão alinhados com "eliminar o atrito da sincronização manual." Posso usá-los?
```

❌ **Má sugestão**: Genérica, sem raciocínio
```
Quais métricas? A) Engajamento B) Receita C) Outro
```

---

## Evite
- Perguntas vazias sem sugestões quando há contexto disponível
- Perguntar sobre cada pequeno detalhe separadamente
- Sugestões genéricas que se aplicam a qualquer produto
- Inventar pesquisas de usuário, dados de concorrentes ou restrições técnicas
- Criar o documento final antes de o usuário validar as suposições
- Usar frases e termos como:
  - "Vamos construir uma solução", "Vamos criar", "Vamos planejar"
  - Os PRDs descrevem o produto como se ele já existisse, não como se fosse ser construído no futuro
  - Em vez disso, use: "Esta é uma solução", "Nossa solução", "Nossa abordagem", "Este produto", "Esta funcionalidade"