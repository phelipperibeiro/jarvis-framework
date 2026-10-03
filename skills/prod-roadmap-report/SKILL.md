---
name: prod-roadmap-report
description: Cria e atualiza relatórios estruturados de roadmap de produto a partir de reuniões, mensagens, documentos ou notas. Use quando usuários precisam extrair atualizações de roadmap em relatórios markdown com seções de resumo, problemas, riscos e ações, consolidar múltiplos relatórios de times, atualizar relatórios existentes mantendo ordem cronológica reversa, salvar/modificar relatórios no Obsidian vault, ou mencionar termos como "relatório de roadmap", "atualização de produto", "sync", "war room", "relatório do time" ou "atualização semanal".
allowed-tools: conversation_search, google_drive_search, google_drive_fetch
metadata:
  author: jarvis-team
  version: "1.0.0"
  area: product
---

# Relatório de Status do Projeto

## Visão Geral
Extraia informações de status do projeto de diversas fontes (reuniões, mensagens, e-mails, documentos) e gere relatórios de status estruturados seguindo templates padronizados em markdown.

**Tipos de arquivos de relatório:**
- Relatório do dia mais recente de um único time com todos os seus projetos (usado para criar outros arquivos compilados)
- Relatório compilado de um único time com todos os seus projetos e informações de relatórios em seções por data
- Documento consolidado agrupando múltiplos relatórios de times
- Lista consolidada de projetos

Por favor, siga o `rules/status-report-rules.md` para obter orientações corretas e conhecer as regras principais desta skill.

## Instruções
Sempre interaja com o usuário no mesmo idioma que ele estiver usando.

### Roadmap Preview:
- Quando o usuário perguntar sobre roadmap, status, sprint, atualizações, etc., execute as instruções de `commands/status-roadmap-preview`
- Use o `$ARGUMENTS` do usuário para obter a resposta correta.


### Geral:
- Use as informações, transcrições e documentos fornecidos pelo usuário para criar os relatórios
- Aprenda com as notas para entender as relações entre relatórios e notas
- Se for atualizar um arquivo existente, leia e entenda o arquivo antes de atualizá-lo com novas informações
- Encontre o produto/projeto/iniciativa nas notas existentes e atualize o bloco correto
- Siga as instruções do template completamente
- Se não tiver certeza de onde inserir informações, pergunte ao usuário
- Os arquivos de saída finais precisam ter o yaml preenchido corretamente
- Para projetos/tópicos com status resolvido e concluído, mova para a seção correta indicada nos templates
- Esteja preparado para atualizar as notas na seção de tópico correta quando o usuário fornecer informações atualizadas sobre um tópico individual

### Relatório de time único:
- Geralmente é usado para obter o relatório de status mais recente dos projetos até aquele dia.
- É usado para estruturar informações e relatório de status de um único time e seus projetos.
- Use `templates/template-single-team-status.md`
- Agrupe múltiplos projetos sob o cabeçalho de UM ÚNICO time
- Antes de criar o arquivo, peça confirmação ao usuário com uma lista de projetos e iniciativas que o relatório final terá. O usuário pode pedir para mesclar alguns tópicos ou renomeá-los

### Relatório compilado do time (grupo bem estruturado e formatado de muitos arquivos de relatório de time único):
- Usado para agrupar em um arquivo todos os relatórios de time único de um time específico e os relatórios de status dos seus projetos de múltiplos dias
- Para criar ou atualizar este relatório, use os relatórios de time único já criados pelo usuário e as informações fornecidas pelo usuário
- Quando o usuário pedir um relatório atualizado de todos os projetos de um time específico
    - Use as informações fornecidas ou, se o Obsidian for usado, procure pelas notas históricas relacionadas e novas notas relacionadas para atualizar este relatório
    - Procure por arquivos que tenham o mesmo nome e padrões de conteúdo criados por esta skill ou por padrões que os usuários já pediram no passado
- O arquivo de saída precisa seguir as instruções e estrutura do template `templates/template-single-team-compiled-status.md`
- Mantendo a estrutura das notas de relatório de time único, mas seguindo a estrutura e organização do template fornecido
- Não altere informações ou datas ao agrupar essas notas
- Peça esclarecimentos se as notas individuais não existirem
- Agrupe múltiplos projetos sob o cabeçalho de UM ÚNICO time

### Relatórios de múltiplos times (múltiplos times, com múltiplos projetos, múltiplos dias):
- Usado para agrupar em um arquivo todos os relatórios individuais de todos os times com relatórios de status de muitos projetos de múltiplos times
- O arquivo de saída precisa seguir as instruções e estrutura do template `templates/template-multiple-teams-compiled-status.md`
- Mantendo a estrutura das notas de relatório de time único, mas seguindo a estrutura e organização do template fornecido
- Não altere informações ou datas ao agrupar essas notas
- Peça esclarecimentos se as notas individuais não existirem

### Fornecendo lista atualizada de projetos
- Se o usuário quiser uma lista atualizada de projetos nas notas, use o arquivo `templates/template-projects-list.md` para dar a resposta.

## Regra Crítica de Estrutura

**CORRETO - Cabeçalho de time único com todos os projetos:**
```markdown
## Nome do Time

### Primeiro Projeto
#### DD-MM-AAAA
{conteúdo}

#### DD-MM-AAAA
{conteúdo}

#### DD-MM-AAAA
{conteúdo}

### Segundo Projeto
#### DD-MM-AAAA
{conteúdo}

#### DD-MM-AAAA
{conteúdo}
```

Na seção do projeto, as seções de datas devem ser organizadas do mais recente para o mais antigo.

**ERRADO - Cabeçalhos de time repetidos:**
```markdown
## Nome do Time
### Primeiro Projeto
...

## Nome do Time
### Segundo Projeto
...
```

O nome do time (`## Nome do Time`) deve aparecer UMA VEZ com todos os projetos aninhados sob ele.

### O que Evitar

- Não atualize datas ou projetos errados
- Não crie blocos extras (Notas de Reunião, Aprendizados, etc.) - siga os templates exatamente
- Não assuma - peça esclarecimentos quando tiver dúvida

## Quando o usuário usa Obsidian
Verifique se o usuário usa Obsidian. Se sim, verifique se você tem acesso para usar skills ou MCP disponível para manipular notas no Obsidian Vault.

- Se o usuário quiser salvar os arquivos no Obsidian vault, peça o caminho do vault
- Se o usuário quiser atualizar ou modificar uma nota existente no Obsidian vault, peça o caminho do arquivo no vault
- Procure no vault para

## Fluxo de Processamento

### 1. Receber e Analisar
- Detectar o idioma do usuário
- Verificar contexto histórico (relatórios anteriores)
- Aceitar entrada em qualquer formato
- Escanear em busca de: nomes de times, projetos, status, problemas, riscos, ações, datas

### 2. Extrair Informações
Para cada projeto:
- Nome do time (explícito ou contextual)
- Nome do projeto/iniciativa
- Conteúdo do resumo
- Itens no prazo (progresso positivo)
- Problemas (bloqueadores atuais)
- Riscos e preocupações (problemas potenciais)
- Ações (próximos passos específicos)

### 3. Lidar com Informações Ausentes
**Quando perguntar:**
- Informação crítica ausente (nome do time não pode ser inferido)
- Existe informação contraditória
- Informação vaga demais para preencher as seções

**Quando NÃO perguntar:**
- Detalhes menores ausentes mas o núcleo está claro
- Apenas 1-2 seções esparsas (marcar como vazio)
- Nomes de time/projeto razoavelmente inferíveis

### 4. Gerar Saída
- Arquivo markdown único com todos os projetos (padrão)
- Seguir estrutura do template
- Usar data atual seguindo o formato correto indicado pelos templates
- Corresponder ao idioma do usuário
- Inserir novas atualizações ANTES do conteúdo antigo (cronologia reversa)

## Regras Críticas

### NUNCA:
❌ Inventar datas, prazos ou cronogramas
❌ Criar itens de ação que não foram declarados
❌ Inferir problemas/riscos de declarações neutras
❌ Adicionar membros de time/stakeholders não mencionados
❌ Inventar métricas ou dados quantitativos
❌ Fabricar detalhes técnicos
❌ Assumir status do projeto sem indicação

### SEMPRE:
✅ Usar apenas informações explicitamente declaradas
✅ Marcar seções como vazias se não houver informação relevante
✅ Preservar a terminologia original
✅ Usar datas exatas quando mencionadas
✅ Citar problemas/riscos específicos conforme declarado
✅ Listar apenas ações explicitamente discutidas
✅ Pedir esclarecimentos quando necessário
✅ Verificar se está atualizando um relatório existente
✅ Preservar a estrutura exata ao atualizar
✅ Agrupar projetos sob o cabeçalho de UM ÚNICO time
✅ Inserir novo conteúdo ANTES do antigo (cronologia reversa)

## Checklist de Qualidade

Antes de entregar:
- [ ] Todas as datas da fonte ou data atual seguindo o formato correto indicado pelos templates
- [ ] Nenhum item de ação ou problema inventado
- [ ] Nomes de time/projeto precisos ou marcados como incertos
- [ ] Todas as seções presentes (mesmo que vazias)
- [ ] Resumo factual sem especulações
- [ ] Formato corresponde exatamente ao template
- [ ] Conteúdo verificável a partir das fontes
- [ ] Nenhum detalhe alucinado
- [ ] Se atualizando: estrutura exata preservada
- [ ] Contexto histórico apenas para terminologia, não para invenção de dados
- [ ] Cada cabeçalho de time aparece apenas UMA VEZ
- [ ] Novo conteúdo inserido ANTES do conteúdo antigo
- [ ] Tópicos Concluídos/Resolvidos inseridos na seção correta
