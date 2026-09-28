---
name: prod.spec.frd
description: Fluxo para criação de FRD (Feature Requirements Document), que auxilia na definição detalhada dos requisitos funcionais de uma feature
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: FRDs requerem análise detalhada de requisitos funcionais, comportamento de usuário e especificações técnicas
---

# FRD - Functional Requirement Document

Este comando tem como objetivo criar, atualizar ou editar uma FRD seguindo o template especificado e as instruções.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Skills que devem ser usadas

Utilize a Skill tool para executar as skills necessárias:

- **Para gerar ou modificar especificações de produto** use a Skill tool para executar a skill `prod-specs` para gerar uma o output final de uma FRD de acordo com os padrões estabelecidos;

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
     - Passar como contexto para a skill `prod-specs`
   - Se não encontrado:
     - Perguntar ao usuário se tem PRD localmente
     - Continuar com fluxo normal

## Instruções

- Se o usuário forneceu ou está atuando em um projeto existente, priorize obter informações sobre o projeto a partir de:
  - **Central-docs** (se configurado) - busca automática do PRD correspondente
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
