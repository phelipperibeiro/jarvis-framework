---
name: prod.spec.prd
description: Alterar ou criar um especificação de produto PRD - Product Requirement Document seguindo o template especificado, regras invioláveis, possibilitando a utilização por agentes de IA e humanos.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: PRDs requerem análise profunda de requisitos, estruturação de documentos complexos e compreensão de contexto de negócio
---

# PRD - Product Requirement Document

Este comando tem como objetivo criar, atualizar ou editar uma PRD seguindo o template especificado e as instruções.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Quando usar
- Ao iniciar uma nova especificação de PRD (Product Requirment Document)
- Precisar modificar um PRD existente
- Quando documentação abrangente é necessária
- Como fonte única de verdade para o desenvolvimento do produto e base para derivar histórias e tarefas

## Princípios Fundamentais
1. **Sempre use o template** `$PROD_TEMPLATES/prod-prd-template.md` para o output final
2. **Nunca crie o arquivo final com suposições não validadas** — sempre confirme sugestões primeiro
3. **Seja inteligente, não robótico** — analise o contexto e proponha sugestões inteligentes, não faça perguntas vazias

---

## Busca no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` definido no ENV.md:

1. **Para iteração de PRD existente:**
   - Executar busca automática no central-docs:
     ```bash
     jarvis docs sync --silent
     ```
   - Buscar PRD relacionado usando:
     - Nome/contexto do PRD fornecido pelo usuário
     - Jira ID (se disponível)
     - Tags semânticas
   - Se PRD encontrado no central-docs:
     - Carregar automaticamente como base para iteração
     - Informar ao usuário: "✅ PRD encontrado no central-docs: [nome]"
     - Usar como contexto para o Gate 1 (Fluxo de Trabalho, abaixo)
   - Se não encontrado:
     - Perguntar ao usuário se tem PRD localmente
     - Continuar com fluxo normal

2. **Para PRD novo:**
   - Pular busca no central-docs
   - Continuar com criação normal

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
- Somente após os Gates 1–3 aprovados, gere o output final usando o template localizado em `$PROD_TEMPLATES/prod-prd-template.md`
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

---

## Instruções

- Se o usuário forneceu ou está atuando em um projeto existente, priorize obter informações sobre o projeto a partir de:
  - **Central-docs** (se configurado) - busca automática de PRDs existentes
  - Documentação existente (README, docs/, PRDs, FRDs, ARDs, etc.)
  - Commits recentes para entender o que está sendo desenvolvido
  - Arquivos de AI como CLAUDE.md e AGENTS.md para obter informações estruturadas sobre o contexto do projeto/produto.
- Para fazer perguntas para o usuário, tente usar o tool `AskUserQuestion` se ele estiver disponível no seu ambiente
- Conduza o **Fluxo de Trabalho** acima (Gates 1 a 4), usando as informações que encontrou como contexto, e gere o output final pelo template `$PROD_TEMPLATES/prod-prd-template.md`
- Quando o Gate 4 gerar o documento, mostre para o usuário o resultado final para a aprovação e validação.
- Quando confirmado e validado pelo usuário:
  - Se o usuário estiver modificando ou atualizando uma spec existente, salve o arquivo modificado
  - Se for uma spec nova:
    - Salve na pasta `$PROD_DOCS` seguindo todos os padrões de nomenclatura e estrutura de pastas já estabelecidos em `$PROD_RULES/**/*`

## Publicação no Central Docs (condicional)

Após salvar o PRD localmente e obter aprovação do usuário:

1. Se `CENTRAL_DOCS_REPO` definido no ENV.md:
   - Perguntar ao usuário:
     ```
     Deseja publicar este PRD no repositório central de documentação?
     - ( ) Sim, publicar agora
     - ( ) Não, vou publicar depois manualmente
     ```

2. Se **Sim**:
   - Extrair o slug do nome do arquivo (ex: `prd-wallet.md` → `wallet`)
   - Executar:
     ```bash
     jarvis docs publish \
       --file {caminho_do_prd} \
       --tipo prd \
       --feature {slug}
     ```

3. Informar resultado:
   - ✅ Sucesso: "PRD publicado no central-docs. MR criado: [URL]"
   - ❌ Erro: Exibir mensagem de erro e orientar troubleshooting

4. Se **Não**:
   - Informar: "Para publicar depois, execute: `jarvis docs publish --file {caminho} --tipo prd --feature {slug}`"

5. Se `CENTRAL_DOCS_REPO` não estiver definido:
   - Informar: "Para habilitar publicação automática, configure `CENTRAL_DOCS_REPO` no ENV.md"

> **Nota**: A publicação cria um Merge Request no GitLab. O PRD só será visível no central-docs após aprovação e merge do MR.

