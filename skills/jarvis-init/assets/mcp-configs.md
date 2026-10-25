# Configuração de MCPs por IDE

Este documento contém as configurações de MCPs (Model Context Protocol) necessárias para o framework JARVIS.

---

## MCPs

| MCP | Propósito | Bloqueante |
|-----|-----------|------------|
| **Context7** | Documentação atualizada de bibliotecas | **Sim** |
| **TestSprite** | Geração automática de testes | **Não** |
| **Sentry** | Observabilidade | **Não** |
| **Redis** | Removido do init (event bus saiu do fork) | — |

---

> Board de cards e git **não usam MCP**: o Jarvis usa a CLI oficial (`gh`, `glab`, `acli`), com o login dela. Ver o Passo 4 do `SKILL.md` e `bin/lib/integrations/vendors.json`.

## Caminhos de Configuração

Cada IDE lê o MCP de um arquivo próprio, com formato próprio. O `jarvis init` (instalação e `--upgrade`) grava o **Context7** no arquivo de projeto da IDE escolhida: cria o arquivo se não existir e, se existir, só acrescenta o `context7` quando falta, sem tocar nos outros servidores. JSON inválido não é alterado (o init avisa). Fonte: documentação oficial de cada IDE (conferida em 2026-10); a tabela no código fica em `bin/lib/config/ide-config.js` (`mcp`).

| IDE | Arquivo de projeto (gravado pelo `jarvis init`) | Global | Chave e formato | Para ativar |
|-----|-----------------------------------------------|--------|-----------------|-------------|
| **Claude Code** | `.mcp.json` (ou `claude mcp add --scope project`) | `~/.claude.json` (`claude mcp add --scope user`) | JSON `mcpServers` | Reiniciar e aprovar o servidor do `.mcp.json` |
| **Cursor** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | JSON `mcpServers` | Recarregar; conferir em Settings → MCP |
| **Windsurf** | — (só global) | `~/.config/devin/mcp_config.json` (versões antigas: `~/.codeium/windsurf/mcp_config.json`) | JSON `mcpServers` | Incluir à mão e ativar no painel MCP do Cascade |
| **Codex** | `.codex/config.toml` (só em projeto confiável) | `~/.codex/config.toml` | TOML `[mcp_servers.context7]` | Confiar no projeto e reiniciar |
| **OpenCode** | `opencode.json` | `~/.config/opencode/opencode.json` | JSON `mcp` (`type: "local"`, `command` em array) | Reiniciar |
| **Gemini CLI** | `.gemini/settings.json` | `~/.gemini/settings.json` | JSON `mcpServers` | `gemini trust` na pasta e reiniciar |
| **Antigravity** | `.agents/mcp_config.json` | `~/.gemini/config/mcp_config.json` | JSON `mcpServers` | Refresh em Customizations (ou `/mcp` no CLI) |
| **Kiro** | `.kiro/settings/mcp.json` | `~/.kiro/settings/mcp.json` | JSON `mcpServers` | Reconecta ao salvar |

Na IDE `gemini` (Gemini CLI / Antigravity) o `jarvis init` grava os dois arquivos de projeto. Na Windsurf, que só tem config global, ele não grava fora do workspace: mostra o trecho para colar.

Quando um arquivo de MCP existe mas não dá para alterar com segurança (JSON com comentários ou inválido, raiz ou `mcpServers` que não é objeto, TOML que não parseia ou em que o bloco `[mcp_servers.context7]` não cabe, como uma tabela inline `mcp_servers = { … }` já existente, ou um `context7` que existe mas não parece um servidor, sem `command` nem URL preenchidos), o `jarvis init` **não mexe nele**: mostra o motivo e o trecho para colar à mão. Isso é só um aviso e não muda o código de saída, nem na instalação nem no `--upgrade`.

Um `context7` conta como já configurado quando tem `command` (texto; em lista, só no OpenCode, que usa esse formato) ou uma URL (`url`, `httpUrl` no Gemini CLI, `serverUrl` no Antigravity). Se ele estiver desligado (`enabled = false` ou `disabled: true`), continua contando como configurado: o init não liga um servidor que a pessoa desligou.

O `.codex/config.toml` é lido com um parser TOML (`smol-toml`) só para saber se o `context7` já existe; o arquivo nunca é reescrito, e o bloco é acrescentado no fim.

### Context7 nos formatos que fogem do `mcpServers`

**Codex** (`.codex/config.toml`):

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

**OpenCode** (`opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": { "type": "local", "command": ["npx", "-y", "@upstash/context7-mcp"], "enabled": true }
  }
}
```

---

## Configuração Completa (Todos os MCPs)

### Windsurf

Arquivo (global): `~/.config/devin/mcp_config.json` (versões antigas: `~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
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

Arquivo: `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
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

### Claude Code

Arquivo: `.mcp.json` na raiz do workspace (projeto). Para o escopo de usuário, use `claude mcp add --scope user …` (grava em `~/.claude.json`). O `~/.claude/settings.json` **não** é lido para MCP.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
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

Provisionados automaticamente pelo `/jarvis-init` quando `CODE_QUALITY_TOOL` está preenchido no ENV.md.

| CODE_QUALITY_TOOL | Pacote npm | Comando |
|-------------------|-----------|---------|
| `sonarqube` | `sonarqube-mcp-server` | path absoluto via `which` |
| `codeclimate` | — | (não suportado via MCP ainda) |

> MCPs de code quality são **locais (stdio)** — requerem binário instalado globalmente,
> diferente dos MCPs cloud que usam `npx`. O jarvis-init instala automaticamente sob confirmação.

### Configuração por IDE — SonarQube

**Instalação:**
```bash
npm install -g sonarqube-mcp-server
# Verificar path absoluto:
which sonarqube-mcp-server
```

**Windsurf** (`~/.config/devin/mcp_config.json`; versões antigas: `~/.codeium/windsurf/mcp_config.json`):
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

**Cursor** (`.cursor/mcp.json` ou `~/.cursor/mcp.json`):
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

**Claude Code** (`.mcp.json`):
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
// Testar se o Context7 responde. Sem resposta, com o arquivo de MCP certo: pendente de
// ativação (reiniciar/aprovar), o init segue. Só para com o arquivo ausente ou inválido.
mcp__context7__resolve-library-id({
  libraryName: "react"
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

1. Verificar se a IDE foi reiniciada (e o servidor aprovado, quando a IDE pede) após configurar MCPs
2. Conferir se o arquivo está no caminho que a IDE lê (tabela "Caminhos de Configuração")
3. Verificar se npx/uvx está funcionando: `npx --version` / `uvx --version`
4. Verificar conexão com internet
5. Verificar se o JSON está válido (sem vírgulas extras)

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
> Oferecido como passo opcional no `/jarvis-init` quando `IDE=claude`.

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
