---
name: prod.spec.prd
description: Alterar ou criar um especificação de produto PRD - Product Requirement Document seguindo o template especificado, regras invioláveis, possibilitando a utilização por agentes de IA e humanos.
auto_execution_mode: 3
env_file: "@/ENV.md"
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

## Skills que devem ser usadas

Utilize a Skill tool para executar as skills necessárias:

- **Para gerar ou modificar especificações de produto** use a Skill tool para executar a skill `prod-specs` para gerar o output final de acordo com os padrões estabelecidos;

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
     - Usar como contexto para a skill `prod-specs`
   - Se não encontrado:
     - Perguntar ao usuário se tem PRD localmente
     - Continuar com fluxo normal

2. **Para PRD novo:**
   - Pular busca no central-docs
   - Continuar com criação normal

## Instruções

- Se o usuário forneceu ou está atuando em um projeto existente, priorize obter informações sobre o projeto a partir de:
  - **Central-docs** (se configurado) - busca automática de PRDs existentes
  - Documentação existente (README, docs/, PRDs, FRDs, ARDs, etc.)
  - Commits recentes para entender o que está sendo desenvolvido
  - Arquivos de AI como CLAUDE.md e AGENTS.md para obter informações estruturadas sobre o contexto do projeto/produto.
- Para fazer perguntas para o usuário, tente usar o tool `AskUserQuestion` se ele estiver disponível no seu ambiente
- Use a Skill tool para executar a skill `prod-specs` para gerar o output final de acordo com os padrões estabelecidos, enviando as informações que encontrou como contexto
- Quando receber output disponibilizado pela skill, mostre para o usuário o resultado final para a aprovação e validação.
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

