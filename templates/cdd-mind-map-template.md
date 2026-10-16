---
# Data da última atualização do mapa (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}

# Nome do workspace (WORKSPACE do ENV.md; vazio = nome da pasta que contém $IDE/).
workspace: {nome}
---

# CDD-MIND-MAP — {workspace}

> **Contexto de workspace:** o mapa de tecnologias e o papel de cada repositório deste workspace. Fica na raiz, ao lado do `AGENTS.md`, **fora do versionamento** (`.gitignore`), e é lido sob demanda pelo `/warm-up`. É definido uma vez e reaproveitado; não guarda decisões nem contexto de tarefa (isso vai para o `context.md` da sessão).

| Repositório | Papel | Linguagem | Framework | Área | Ferramentas principais | Observações |
|-------------|-------|-----------|-----------|------|------------------------|-------------|
| {pasta} | {api, gateway, front, worker, lib…} | {php, golang, node…} | {laravel, nestjs, react, quasar…} | {backend, frontend, qa, data, automation, platform} | {até 5: framework, linguagem, ORM, testes} | {o que o usuário acrescentou} |

<!--
Como preencher (o /warm-up e o /jarvis-init seguem estas instruções):
- Uma linha por repositório com .git do workspace (respeitando WORKSPACE_REPOS, se preenchida); em projeto único, uma linha para a raiz.
- Linguagem e framework: pela tabela skills/jarvis-init/assets/sinais-de-stack.md (manifesto → linguagem → dependência → framework). Área: a da linha da tabela; sem sinal, pergunte.
- Papel: inferido da estrutura e do nome (ex.: rotas sem regra de negócio → gateway); é sempre hipótese até o usuário confirmar.
- Ferramentas principais: as dependências diretas mais relevantes do manifesto, com a versão declarada; no máximo 5.
- Leia só manifestos e a estrutura de pastas. Nunca leia .env*, chaves, certificados nem credenciais.
- Antes de gravar, mostre a tabela ao usuário e peça a validação (confirmar, corrigir, incluir informação).
- Mapa existente: acrescente só os repositórios que faltam; não reprocesse as linhas já validadas.
-->
