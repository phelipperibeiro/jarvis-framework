# Configuração de MCPs por IDE

Este documento contém as configurações de MCPs (Model Context Protocol) necessárias para o framework JARVIS.

---

## MCPs

| MCP | Propósito | Bloqueante |
|-----|-----------|------------|
| **Context7** | Documentação atualizada de bibliotecas | **Sim** |
| **Jira / Linear / GitHub / Asana** | Task manager — só se `TASK_MANAGER` estiver no ENV.md | **Não** |
| **TestSprite** | Geração automática de testes | **Não** |
| **Sentry** | Observabilidade | **Não** |
| **Redis** | Removido do init (event bus saiu do fork) | — |

---

## Caminhos de Configuração

| IDE | Arquivo de Configuração |
|-----|-------------------------|
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` |
| **Cursor** | `~/.cursor/mcp.json` |
| **Claude** | `~/.claude/settings.json` |
| **VS Code** | Depende da extensão |

---

## Configuração Completa (Todos os MCPs)

### Windsurf

Arquivo: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-jira"],
      "env": {
        "JIRA_URL": "https://sua-org.atlassian.net",
        "JIRA_EMAIL": "seu-email@sua-empresa.com",
        "JIRA_API_TOKEN": "seu-token-aqui"
      }
    },
    "redis": {
      "command": "uvx",
      "args": [
        "--from", "redis-mcp-server@latest",
        "redis-mcp-server",
        "--url", "redis://default:SENHA@host:porta/0"
      ]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@latest"],
      "env": {
        "SENTRY_AUTH_TOKEN": "seu-token-aqui"
      }
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"]
    }
  }
}
```

### Cursor

Arquivo: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-jira"],
      "env": {
        "JIRA_URL": "https://sua-org.atlassian.net",
        "JIRA_EMAIL": "seu-email@sua-empresa.com",
        "JIRA_API_TOKEN": "seu-token-aqui"
      }
    },
    "redis": {
      "command": "uvx",
      "args": [
        "--from", "redis-mcp-server@latest",
        "redis-mcp-server",
        "--url", "redis://default:SENHA@host:porta/0"
      ]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@latest"],
      "env": {
        "SENTRY_AUTH_TOKEN": "seu-token-aqui"
      }
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"]
    }
  }
}
```

### Claude

Arquivo: `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-jira"],
      "env": {
        "JIRA_URL": "https://sua-org.atlassian.net",
        "JIRA_EMAIL": "seu-email@sua-empresa.com",
        "JIRA_API_TOKEN": "seu-token-aqui"
      }
    },
    "redis": {
      "command": "uvx",
      "args": [
        "--from", "redis-mcp-server@latest",
        "redis-mcp-server",
        "--url", "redis://default:SENHA@host:porta/0"
      ]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@latest"],
      "env": {
        "SENTRY_AUTH_TOKEN": "seu-token-aqui"
      }
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"]
    }
  }
}
```

---

## MCPs Opcionais — Code Quality

Provisionados automaticamente pelo `/init-jarvis` quando `CODE_QUALITY_TOOL` está preenchido no ENV.md.

| CODE_QUALITY_TOOL | Pacote npm | Comando |
|-------------------|-----------|---------|
| `sonarqube` | `sonarqube-mcp-server` | path absoluto via `which` |
| `codeclimate` | — | (não suportado via MCP ainda) |

> MCPs de code quality são **locais (stdio)** — requerem binário instalado globalmente,
> diferente dos MCPs cloud que usam `npx`. O init-jarvis instala automaticamente sob confirmação.

### Configuração por IDE — SonarQube

**Instalação:**
```bash
npm install -g sonarqube-mcp-server
# Verificar path absoluto:
which sonarqube-mcp-server
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "/path/absoluto/sonarqube-mcp-server",
      "args": [],
      "env": {
        "SONARQUBE_TOKEN": "$CODE_QUALITY_TOKEN",
        "SONARQUBE_URL": "$CODE_QUALITY_URL"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "/path/absoluto/sonarqube-mcp-server",
      "args": [],
      "env": {
        "SONARQUBE_TOKEN": "$CODE_QUALITY_TOKEN",
        "SONARQUBE_URL": "$CODE_QUALITY_URL"
      }
    }
  }
}
```

**Claude** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "/path/absoluto/sonarqube-mcp-server",
      "args": [],
      "env": {
        "SONARQUBE_TOKEN": "$CODE_QUALITY_TOKEN",
        "SONARQUBE_URL": "$CODE_QUALITY_URL"
      }
    }
  }
}
```

> **IMPORTANTE**: Substituir `/path/absoluto/sonarqube-mcp-server` pelo output de `which sonarqube-mcp-server`.
> Usar `npx` não funciona para este pacote — requer instalação global + path absoluto.

### Verificação — SonarQube

```javascript
// Testar se SonarQube MCP está funcionando
mcp__sonarqube__list_projects({})
```

### Troubleshooting — SonarQube

| Problema | Solução |
|----------|---------|
| `command not found` | Instalar globalmente: `npm install -g sonarqube-mcp-server` |
| `npx` não encontra o binário | Não usar `npx` — instalar globalmente e usar path absoluto |
| Token inválido | Gerar novo token em `$CODE_QUALITY_URL` > My Account > Security > Generate Tokens |
| Docker não funciona | Usar instalação via npm (mais simples e confiável) |
| MCP não responde após config | Reiniciar a IDE — MCPs são carregados no boot |

---

## Verificação de MCPs

### Context7 (OBRIGATÓRIO)

```javascript
// Testar se Context7 está funcionando — sem ele o init para
mcp__context7__resolve-library-id({
  libraryName: "react"
})
```

### Jira (opcional — só se `TASK_MANAGER=jira`)

```javascript
// Uma tentativa. Falhou? Avisar e seguir — não bloqueia o init.
mcp__claude_ai_Atlassian__getJiraIssue({
  issueKey: "PROJ-1"  // Usar qualquer issue existente para teste
})
```

### Redis

Não é mais requisito do Jarvis (event bus removido). Se o projeto alvo usar Redis, configure fora do init.

### Sentry (opcional)

```javascript
// Testar se Sentry MCP está funcionando
mcp__claude_ai_Sentry__whoami({})
```

### TestSprite

```javascript
// Testar se TestSprite está funcionando
mcp__TestSprite__testsprite_check_account_info({})
```

---

## Configuração dos Tokens

### Token Jira

1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em "Create API token"
3. Dê um nome descritivo (ex: "MCP Windsurf")
4. Copie o token gerado
5. Cole no campo `JIRA_API_TOKEN` da configuração

### Token Sentry

1. Acesse: https://sentry.io/settings/account/api/auth-tokens/
2. Clique em "Create New Token"
3. Selecione os escopos: `org:read`, `project:read`, `event:read`, `issue:read`
4. Copie o token gerado
5. Cole no campo `SENTRY_AUTH_TOKEN` da configuração

**⚠️ IMPORTANTE**:
- **NUNCA** commitar tokens ou senhas no repositório
- Os tokens são pessoais e intransferíveis
- Regenere se suspeitar de vazamento

---

## Troubleshooting

### MCP não responde

1. Verificar se IDE foi reiniciada após configurar MCPs
2. Verificar se npx/uvx está funcionando: `npx --version` / `uvx --version`
3. Verificar conexão com internet
4. Verificar se o JSON está válido (sem vírgulas extras)

### Jira retorna erro de autenticação

1. Verificar se o email está correto
2. Verificar se o token não expirou
3. Verificar se a URL do Jira está correta
4. Testar o token via curl:

```bash
curl -u "seu-email@sua-empresa.com:seu-token" \
  "https://sua-org.atlassian.net/rest/api/3/myself"
```

### Redis não conecta

1. Verificar se a URL está no formato correto
2. Verificar se a senha não tem caracteres especiais sem encode
3. Verificar se o IP está na allowlist do Redis Cloud
4. Testar conexão direta: `redis-cli -u "redis://..." ping`

### Sentry retorna erro de permissão

1. Verificar se o token tem os escopos corretos
2. Verificar se o token não expirou
3. Regenerar token em https://sentry.io/settings/account/api/auth-tokens/

### Context7 não encontra biblioteca

1. Verificar se o nome da biblioteca está correto
2. Algumas bibliotecas podem não estar indexadas
3. Tentar variações do nome (ex: "nextjs" vs "next.js")

---

## Perfil opt-in — Plugins Claude Code

> **Somente Claude Code.** Plugins de marketplace nao existem em outras IDEs (Cursor, Windsurf, Codex).
> Nao instalar por padrao — cada plugin carrega contexto extra em toda sessao.
> Oferecido como passo opcional no `/init-jarvis` quando `IDE=claude`.

| Plugin | Proposito | ROI seguranca | Custo de contexto | Recomendacao |
|---|---|---|---|---|
| **Codegraph** | Grafo AST: impact/callers/trace | Alto — taint analysis, direciona fan-out de audit | Baixo em uso (substitui grep+read) | Recomendado p/ CC |
| **Claude-Mem** | Memoria persistente entre sessoes | Medio — findings e threat-model sobrevivem entre sessoes | Injeta contexto no inicio de toda sessao | Opt-in avancado |
| **Token Optimizer** | Auditoria de contexto e token | Baixo (meta-tool) | Hooks + statusline sempre ativos | Escolha individual |

### Instalacao

Todos via Claude Code Marketplace (nao via `npx` ou npm):

1. Abrir Claude Code
2. Acessar **Extensions / Marketplace**
3. Buscar pelo nome do plugin
4. Instalar e reiniciar sessao

### Por que Codegraph e recomendado para seguranca

`codegraph_impact`, `codegraph_callers` e `codegraph_trace` respondem em sub-milissegundos queries que o grep levaria dezenas de chamadas para responder. No contexto de audit de seguranca, isso permite:
- Identificar todas as funcoes que chamam um endpoint vulneravel
- Rastrear o fluxo de dados de um input ate um sink
- Encontrar o impacto em cascata de uma mudanca de auth

Subagentes de verificacao de seguranca (multi-voto) rodam **sem** esses plugins por design — o orquestrador usa; os juizes nao.
