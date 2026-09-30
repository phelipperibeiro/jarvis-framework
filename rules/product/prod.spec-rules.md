---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: PRODUCT | SQUAD: all

# Regras de Escrita de Especificação de Produto

## Objetivo

Definir os princípios que todo documento de especificação de produto (PRD, FRD, épico, história, tarefa e bug) deve seguir: o nível certo de critérios de aceitação em cada tipo de documento, contexto completo e terminologia consistente.

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

## Exceções

Quando o usuário pedir explicitamente outro formato ou nível de detalhe para um documento, registre a decisão no próprio documento e siga o pedido.

## Referências

- `prod-rules.md`: regras gerais de produto (ambiente, comandos, nomes de arquivos, status e perguntas ao usuário)
- `../../templates/product/`: templates dos documentos
- `../../workflows/product/`: os comandos `prod.spec.*`
