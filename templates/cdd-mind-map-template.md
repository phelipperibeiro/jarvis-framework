---
# Data da última atualização do mapa (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}

# Nome do workspace (WORKSPACE do ENV.md; vazio = nome da pasta que contém $IDE/).
workspace: {nome}
---

# CDD-MIND-MAP — {workspace}

> **Mapa de tecnologias do projeto:** a stack e o papel de cada repositório. No modo workspace, cobre o conjunto de repositórios do workspace; no modo projeto, é o resumo estruturado do repositório (uma linha, a raiz). Fica na raiz, ao lado do `AGENTS.md`, **fora do versionamento** (no modo projeto, no `.git/info/exclude`, gravado pelo `jarvis init`; no modo workspace, a raiz não é versionada), e é lido sob demanda pelo `/warm-up`. Guarda os dados estruturados (linguagem, framework, área, ferramentas); prosa e comandos (setup, estilo, testes) ficam no `AGENTS.md`. É definido uma vez e reaproveitado; não guarda decisões nem contexto de tarefa (isso vai para o `context.md` da sessão).

| Repositório | Papel | Linguagem | Framework | Área | Ferramentas principais | Observações |
|-------------|-------|-----------|-----------|------|------------------------|-------------|
| {pasta} | {api, gateway, front, worker, lib…} | {php, golang, node…} | {laravel, nestjs, react, quasar…} | {backend, frontend, qa, data, automation, platform} | {até 5: framework, linguagem, ORM, testes} | {o que o usuário acrescentou} |

<!--
Como preencher (o /warm-up e o /jarvis-init seguem estas instruções):
- Uma linha por repositório com .git do workspace (o /warm-up respeita WORKSPACE_REPOS, se preenchida; o /jarvis-init repos e o Upgrade usam todas as subpastas com .git); em projeto único, uma linha para a raiz.
- Linguagem e framework: pela tabela skills/jarvis-init/assets/sinais-de-stack.md (manifesto → linguagem → dependência → framework). Área: a da linha da tabela; sem sinal, pergunte.
- Papel: inferido da estrutura e do nome (ex.: rotas sem regra de negócio → gateway); é sempre hipótese até o usuário confirmar.
- Ferramentas principais: as dependências diretas mais relevantes do manifesto, com a versão declarada; no máximo 5.
- Leia só manifestos e a estrutura de pastas. Nunca leia .env*, chaves, certificados nem credenciais.
- Antes de gravar, mostre a tabela ao usuário e peça a validação (confirmar, corrigir, incluir informação).
- Mapa existente: acrescente só os repositórios que faltam; não reprocesse as linhas já validadas.
-->
