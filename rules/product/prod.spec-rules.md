> **Applies to:** HUB: all | POSITION: all | AREA: PRODUCT | SQUAD: all

# Regras de Escrita de Especificação de Produto

## Objetivo

Definir os princípios que todo documento de especificação de produto (PRD, FRD, épico, história, tarefa e bug) deve seguir: o nível certo de critérios de aceitação em cada tipo de documento, contexto completo, terminologia consistente e o uso opcional de um discovery como insumo.

## Escopo

Aplica-se a todos os comandos `prod.spec.*` que escrevem ou alteram um documento. Complementa o `prod-rules.md` (variáveis de ambiente, comandos, nomes de arquivos, status e perguntas ao usuário), que continua sendo a regra geral de produto.

## Regras

### Princípio: Critérios de aceitação e requisitos

#### Critérios de aceitação específicos do documento

##### Para PRDs (nível macro)
Concentre-se no "o quê" e no "porquê":
- Definir capacidades gerais do produto
- Definir regras e restrições de negócios
- Estabelecer métricas de sucesso
- Descrições sempre levando em consideração as soluções macro do Projeto, baseando-se nas FRDs

##### Para FRDs (nível médio)
Retrata as soluções macro do produto. É ponte entre estratégia e implementação:
- Definir requisitos de nível de recurso
- Definir limites para histórias relacionadas
- Incluir pontos de integração
- Definir requisitos não funcionais

#### Para histórias (detalhadas, funcionais)

Concentre-se em comportamentos específicos e testáveis com base em designs:

```
### Fluxo de autenticação
- Quando o usuário clica no botão "Login" na página inicial, o sistema exibe o modal de login
- Quando o usuário insere o email no campo email, o sistema valida o formato em tempo real
- Quando o usuário insere um formato de e-mail inválido, o sistema exibe o erro "Insira um e-mail válido" abaixo do campo
- Quando o usuário insere a senha e clica em "Enviar", o sistema tenta a autenticação
- Quando a autenticação é bem-sucedida, o sistema fecha o modal e redireciona para o painel
- Quando a autenticação falha, o sistema exibe o erro "Credenciais inválidas" acima do formulário
- Quando o usuário clica no link "Esqueci minha senha", o sistema exibe o modo de redefinição de senha

### Fluxo de redefinição de senha
- Quando o usuário insere o e-mail no formulário de redefinição e clica em "Enviar link de redefinição", o sistema envia o e-mail de redefinição
- Quando o sistema envia um e-mail, o sistema exibe a confirmação "Verifique seu e-mail para obter o link de redefinição"
- Quando o usuário não recebe o e-mail em 1 minuto, o sistema mostra o botão "Reenviar e-mail"
```

**Observe a diferença:**
- PRD/Epics: "O sistema deve suportar autenticação" (o quê, por que)
- Histórias/Tasks: "Quando o usuário clica no botão 'Login'..." (específicas, testáveis, baseadas em design)

**Detalhamento Progressivo**:
1. **PRD (Porquê)**: "O sistema deve suportar autenticação do usuário para proteger os dados do usuário"
2. **Épico (O que)**: "Implementar sistema de autenticação com e-mail/senha e login social"
3. **Issues (Como)**: "Como usuário, posso fazer login com meu e-mail e senha para poder acessar minha conta"

**Principais diferenças**:
- **PRD**: objetivos de negócios e requisitos de alto nível
- **Épico**: escopo em nível de recurso e abordagem técnica
- **Issues (História/Tarefa)**: detalhes específicos de implementação e comportamento da UI

### Princípio: Contexto completo

**Princípio**: Cada documento deve ser compreensível por si só, sem exigir conhecimento tribal.

**O que isso significa**:
- Incluir todos os antecedentes necessários
- Definir abreviações e jargões na primeira utilização
- Link para documentos relacionados utilizando formato markdown
- Explique “por que” as decisões foram tomadas
- Documentar suposições
- Não presuma que todos estavam na reunião

**Por que é importante**:
As pessoas juntam-se em equipas, o contexto perde-se, as memórias desaparecem. Documentos independentes garantem que todos possam contribuir, independentemente de quando aderiram.

**Perguntas de validação**:
- Um novo membro da equipe poderia entender isso?
- Todas as abreviaturas estão definidas?
- O “porquê” está explicado?
- Os documentos relacionados estão vinculados?
- Isso faria sentido em 6 meses?

**Exemplos**:

✅ **Bom**:
- "Estamos criando notificações por e-mail porque 73% dos usuários relataram a falta de atualizações importantes (consulte o documento de pesquisa do usuário). Este recurso abordará a reclamação número 1 dos usuários nas pesquisas do terceiro trimestre."
- "A latência da API (Interface de Programação de Aplicativo) deve ser <200 ms porque nosso SLA (Acordo de Nível de Serviço) se compromete com tempos de resposta inferiores a um segundo."

❌ **Ruim**:
- "Pela reunião, estamos fazendo notificações"
- "Porque Bob disse isso"
- "Todo mundo sabe porque isso é importante"
- Referências a discussões sem links ou resumos
- Decisões técnicas inexplicáveis

**Aplicação a Fluxos de Trabalho**:
- **PRDs**: inclua o contexto do problema, por que agora, iniciativas relacionadas
- **Planos**: consulte o PRD, explique as decisões de faseamento
- **Histórias**: Inclui plano de fundo, ajuste-se ao contexto épico
- **Histórias rápidas**: forneça contexto suficiente para executar sem fazer perguntas
- **Bugs rápidos**: ambiente do documento, etapas, comportamento esperado
- **Tarefas rápidas**: explique por que esse trabalho é importante

### Princípio: Terminologia Consistente

**Princípio**: Use os mesmos termos para os mesmos conceitos em toda a documentação.

**O que isso significa**:
- Escolha um termo e cumpra-o
- Crie um glossário para os principais conceitos
- Não use sinônimos para entidades principais
- Alinhe a terminologia entre PRD → Plano → Histórias
- Use termos padrão do setor quando aplicável

**Por que é importante**:
A terminologia inconsistente cria confusão. "Cliente" vs "Usuário" vs "Cliente" - são iguais? Diferente? Ninguém sabe, então todo mundo perde tempo esclarecendo.

**Perguntas de validação**:
- Estamos usando o mesmo termo que usamos no PRD?
- Temos vários termos para a mesma coisa?
- Um novo membro da equipe ficaria confuso?
- Existe um glossário se os termos forem complexos?

**Exemplos**:

✅ **Bom**:
- **Consistente**: Sempre use "espaço de trabalho" (às vezes não "espaço", "área", "sala")
- **Glossário**: "Espaço de trabalho: uma área colaborativa onde os membros da equipe compartilham documentos"
- **Termos padrão**: use termos do setor como "API", "SaaS", "MRR"

❌ **Ruim**:
- **Inconsistente**: “espaço de trabalho” no PRD, “espaço” no Plano, “sala” nas histórias
- **Termos inventados**: "doohickey" em vez do "widget" padrão
- **Jargão indefinido**: uso de abreviações específicas da empresa sem definição

**Aplicação a Fluxos de Trabalho**:
- **PRDs**: definir termos-chave no glossário
- **Planos**: use os termos exatos do PRD
- **Histórias**: Combine a terminologia do PRD e do Plano
- **Questões rápidas**: use terminologia estabelecida ou defina novos termos

### Princípio: Discovery como insumo

**Princípio**: O discovery (`$PROD_DOCS/discoveries/discovery-{id}-{nome}.md`) é um rascunho de suposições. Ele pode servir de contexto para um PRD, FRD, épico ou issue, mas nunca é obrigatório e nunca é tratado como verdade.

**O discovery é opcional**:
- Sem discovery apontado, siga o fluxo do comando normalmente, sem procurar na pasta `discoveries/` e sem perguntar nada sobre discovery. Ter arquivos nessa pasta não tem relação com o comando.
- Exemplos: `/prod.spec.prd já sei o que quero` segue o fluxo de sempre; `/prod.spec.prd discovery-002` carrega o discovery.

**Como apontar e achar o discovery**:
- O usuário aponta por caminho, nome ou id (como `discovery-002`); procure em `$PROD_DOCS/discoveries/`.
- Se o arquivo não existir: informe, liste os discoveries da pasta e pergunte qual usar, ou se o usuário prefere seguir sem discovery.
- Se a pasta `discoveries/` não existir: siga sem discovery e não crie a pasta.
- Se mais de um arquivo casar com o que o usuário apontou: pergunte qual usar, sem escolher sozinho.

**Como usar o discovery**:
- Leia o discovery como **contexto, não como resposta**: é um rascunho e pode estar defasado.
- **Questione e repasse tudo com o usuário**, seção por seção: mostre o que está registrado e pergunte se ainda vale ou se mudou.
- Hipóteses e perguntas em aberto do discovery são perguntadas como tais; o que o comando exige e o discovery não cobre é perguntado normalmente.
- Nada do discovery entra no documento novo como fato sem o usuário ter passado por aquilo. O que ficar sem validação continua marcado como suposição.

**Avisos conforme a situação do discovery**:
- `verdict: do_not_proceed` (ou `status: cancelled`): avise que a recomendação foi não seguir, mostre o motivo registrado e só continue com confirmação explícita do usuário.
- `verdict: investigate_more`, `verdict` vazio ou `status: in_review` (discovery ainda em entrevista): avise que há lacunas críticas, liste as perguntas em aberto e pergunte se o usuário quer retomar o discovery antes ou seguir assumindo o risco.
- `verdict: proceed`: siga normalmente.

**O documento novo é o oficial**:
- O PRD, FRD, épico ou issue é a fonte da verdade. O discovery **nunca é alterado** por estes comandos: ele permanece como o registro do momento da investigação.
- O documento novo referencia o discovery de origem no campo `related_discovery` do frontmatter.
- Quando a informação do documento novo divergir do discovery, **avise o usuário na conversa** e crie no documento novo a seção **"Divergências"** (somente quando houver), com o que mudou e por quê, em poucas linhas.

### Princípios dos comandos `prod.spec.*`

Valem para os comandos que escrevem um documento (PRD, FRD, épico, issue, breakdown):

1. **Sempre use o template** do documento, em `$PROD_TEMPLATES`, para o output final.
2. **Nunca crie o arquivo final com suposições não validadas**: confirme as sugestões primeiro.
3. **Seja inteligente, não robótico**: analise o contexto e proponha sugestões inteligentes, sem perguntas vazias.

### Busca no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` estiver definido no `ENV.md`, antes de começar o documento:

1. Rode `jarvis docs sync --silent` (comandos e detalhes em `skills/jarvis-docs-central/SKILL.md`).
2. Procure o documento pelo nome ou contexto informado, pelo Jira ID ou `TASK_MANAGER_KEY` e por tags semânticas.
3. Se encontrar, informe ("✅ {tipo} encontrado no central-docs: [nome]") e use-o como base ou contexto.
4. O que cada comando busca, quando e o que faz ao não encontrar (perguntar ou seguir) está no próprio workflow.

Sem `CENTRAL_DOCS_REPO`, pule esta etapa silenciosamente.

### Publicação no Central Docs (condicional)

Após salvar o documento localmente e obter a aprovação do usuário:

1. Se `CENTRAL_DOCS_REPO` estiver definido, pergunte: "Deseja publicar este documento no repositório central de documentação?" (Sim, publicar agora / Não, vou publicar depois manualmente).
2. Se **Sim**: extraia o slug do nome do arquivo (ex.: `prd-wallet.md` → `wallet`) e rode `jarvis docs publish --file {caminho} --tipo {tipo} --feature {slug}`. O `{tipo}` vem do workflow.
3. Informe o resultado: ✅ sucesso ("{Documento} publicado no central-docs. MR criado: [URL]") ou ❌ erro (exiba a mensagem e oriente o troubleshooting).
4. Se **Não**: informe "Para publicar depois, execute: `jarvis docs publish --file {caminho} --tipo {tipo} --feature {slug}`".
5. Se `CENTRAL_DOCS_REPO` não estiver definido: informe "Para habilitar publicação automática, configure `CENTRAL_DOCS_REPO` no ENV.md".

> **Nota**: A publicação cria um Merge Request no GitLab. O documento só será visível no central-docs após aprovação e merge do MR.

## Exceções

Quando o usuário pedir explicitamente outro formato ou nível de detalhe para um documento, registre a decisão no próprio documento e siga o pedido.

## Referências

- `prod-rules.md`: regras gerais de produto (ambiente, comandos, nomes de arquivos, status e perguntas ao usuário)
- `../../templates/product/`: templates dos documentos
- `../../workflows/product/`: os comandos `prod.spec.*`
- `prod.spec.discovery.md` (workflow) e `prod-discovery-template.md`: o comando e o formato do discovery, o rascunho que os comandos acima podem usar como insumo
