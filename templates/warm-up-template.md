---
# Apelido do aquecimento (o usuário escolhe no /warm-up). É o nome da pasta $SESSIONS_DIR/warm-ups/{apelido}/.
apelido: {apelido}

# Data em que o aquecimento foi gerado (YYYY-MM-DD).
created_at: {YYYY-MM-DD}

# Repositórios aquecidos nesta sessão (ACTIVE_REPOS), separados por vírgula.
active_repos: {repo-a, repo-b}

# Áreas confirmadas pelo usuário; as especialidades das outras ficaram de fora.
areas: {backend, frontend}
---

# Warm-up — {apelido}

> Contexto aquecido para **uma tarefa**. O `/eng.start` ou o `/prod.spec*` que usá-lo copia este conteúdo para o `context.md` da sessão e apaga a pasta (`rules-on-demand/warm-up-consume-rules.md`).

## Escopo

| Repositório | Papel | Stack | Branch alvo |
|-------------|-------|-------|-------------|
| {repo} | {papel, do CDD-MIND-MAP.md} | {linguagem / framework} | {main, dev…} |

**Especialidades carregadas:** {área: base + especializações da lista} · **Fora do escopo:** {áreas descartadas}

## Central docs

{Produto e funcionalidade escolhidos. Para cada `feature-*.md` lido: o comportamento atual em 2–3 linhas e onde está no código. Entregas (`delivery-*.md`) do recorte, uma linha cada. Sem Central docs: "não configurado".}

## Entregas recentes

| Repositório | Merge | Título | Arquivos tocados |
|-------------|-------|--------|------------------|
| {repo} | {hash curto, data} | {título do PR/merge} | {principais pastas/arquivos} |

{Padrões ou decisões recentes que valem para a tarefa, em até 3 linhas.}

## Ferramentas (context7)

| Ferramenta | Versão no projeto | Versão atual | Observação |
|------------|-------------------|--------------|------------|
| {nome} | {declarada no manifesto} | {do context7} | {mudança relevante, se houver} |

{Sem MCP context7: "não consultado".}
