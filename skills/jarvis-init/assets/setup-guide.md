 Guia de Setup do Ambiente

> Este guia detalha a configuração completa do ambiente de desenvolvimento.

 Pré-requisitos

 Software Necessário

| Software | Versão Mínima | Verificar |
|----------|---------------|-----------|
| Node.js | .x | `node --version` |
| NPM | .x | `npm --version` |
| Git | .x | `git --version` |
| Docker | .x | `docker --version` |
| IDE (Windsurf/Cursor/Claude/VS Code) | Última | - |

 Instalação (macOS)

```bash
 Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

 Node.js via NVM (recomendado)
brew install nvm
nvm install 
nvm use 

 Git
brew install git

 Docker Desktop
brew install --cask docker
```

 Instalação (Linux/Ubuntu)

```bash
 Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v../install.sh | bash
nvm install 
nvm use 

 Git
sudo apt update && sudo apt install git

 Docker
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

 Configuração do Workspace

 . Clonar o workspace

O Jarvis fica na pasta **workspace**, não dentro de um repo.

```bash
mkdir -p {WORKSPACE} && cd {WORKSPACE}

# single: um único git nesta pasta
# git clone git@host:org/repo.git .

# multi: um git por subpasta
# git clone git@host:org/repo-api.git repo-api
# git clone git@host:org/repo-frontend.git repo-frontend
```

 . Instalar Dependências

```bash
npm install
```

 . Configurar Variáveis de Ambiente

```bash
 Copiar arquivo de exemplo
cp .env.example .env

 Editar com suas credenciais
code .env
```

Variáveis obrigatórias:

```env
 Banco de Dados
DATABASE_URL=mysql://user:password@localhost:/dbname

 APIs Externas
API_KEY=sua_chave_aqui

 Ambiente
NODE_ENV=development
```

 . Configurar Banco de Dados

```bash
 Subir containers (se usar Docker)
docker-compose up -d

 Rodar migrations
npm run migrate

 Seed de dados (opcional)
npm run seed
```

 . Rodar Projeto

```bash
 Desenvolvimento
npm run dev

 Testes
npm test

 Build
npm run build
```

 Configuração da IDE

 Detectar IDE em Uso

PRIMEIRO: Identifique qual IDE você está utilizando para configurar os caminhos corretos.

```bash
 Detectar IDE pela pasta existente no projeto
if [ -d ".windsurf" ]; then
  echo "IDE: Windsurf"
  echo "Pasta: .windsurf/"
  echo "MCP Config: ~/.codeium/windsurf/mcp_config.json"
elif [ -d ".cursor" ]; then
  echo "IDE: Cursor"
  echo "Pasta: .cursor/"
  echo "MCP Config: ~/.cursor/mcp.json"
elif [ -d ".claude" ]; then
  echo "IDE: Claude"
  echo "Pasta: .claude/"
  echo "MCP Config: ~/.claude/mcp_config.json"
elif [ -d ".codex" ]; then
  echo "IDE: Codex (OpenAI)"
  echo "Pasta: .codex/"
elif [ -d ".opencode" ]; then
  echo "IDE: OpenCode"
  echo "Pasta: .opencode/"
elif [ -d ".gemini" ]; then
  echo "IDE: Gemini CLI / Antigravity"
  echo "Pasta: .gemini/"
fi
```

 Tabela de Caminhos por IDE

| IDE | Pasta do Projeto | Arquivo MCP Config |
|-----|------------------|--------------------||
| Windsurf | `.windsurf/` | `~/.codeium/windsurf/mcp_config.json` |
| Claude Code | `.claude/` | `~/.claude/mcp_config.json` |
| Cursor | `.cursor/` | `~/.cursor/mcp.json` |
| Codex (OpenAI) | `.codex/` | - |
| OpenCode | `.opencode/` | - |
| Gemini CLI / Antigravity | `.gemini/` | - |

 Windsurf / Claude Code / Cursor / Codex / OpenCode / Gemini

Extensões recomendadas:

- ESLint
- Prettier
- GitLens
- Docker
- Thunder Client (API testing)

Settings recomendadas:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

 Configurar Framework JARVIS

```bash
 Inicializar framework
 No chat da sua IDE (Windsurf/Cursor/Claude), digite:
/init
```

 Configuração de MCPs (Model Context Protocol)

OBRIGATÓRIO: O framework JARVIS depende de MCPs para funcionalidades avançadas.

 Localização do Arquivo de Configuração (por IDE)

```bash
 Windsurf
cat ~/.codeium/windsurf/mcp_config.json >/dev/null || echo "Não encontrado"

 Cursor
cat ~/.cursor/mcp.json >/dev/null || echo "Não encontrado"

 Claude
cat ~/.claude/mcp_config.json >/dev/null || echo "Não encontrado"
```

| IDE | Caminho do Arquivo MCP |
|-----|------------------------|
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Claude | `~/.claude/mcp_config.json` |

 MCPs

| MCP | Propósito | Documentação |
|-----|-----------|-------------|
| Context7 | Documentação atualizada de bibliotecas (**obrigatório**) | [context7.com](https://context7.com) |
| Task manager | Só se `TASK_MANAGER` estiver no ENV (Jira/Linear/…) | conforme o vendor |
| TestSprite | Geração automática de testes (opcional) | [testsprite.com](https://testsprite.com) |

 Instalar Context

Adicionar ao arquivo MCP da sua IDE (veja tabela acima):

```json
{
  "mcpServers": {
    "context": {
      "command": "npx",
      "args": ["-y", "@upstash/context-mcp"]
    }
  }
}
```

Testar instalação (no chat da sua IDE):
```
Use Context para buscar documentação do React hooks
```

 Instalar TestSprite

Adicionar ao arquivo MCP da sua IDE:

```json
{
  "mcpServers": {
    "context": {
      "command": "npx",
      "args": ["-y", "@upstash/context-mcp"]
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"]
    }
  }
}
```

Testar instalação (no chat da sua IDE):
```
Use TestSprite para analisar cobertura de testes do projeto
```

 Após Configurar MCPs

. Salvar o arquivo de configuração MCP
. Reiniciar a IDE completamente (Cmd+Q / fechar e abrir)
. Verificar se os MCPs aparecem no painel de ferramentas

 Problemas Comuns com MCPs

MCP não aparece após reiniciar:
```bash
 Verificar se npx está funcionando
npx --version

 Limpar cache do npx
npx clear-npx-cache
```

Erro de permissão:
```bash
 Dar permissão ao diretório (ajustar caminho conforme IDE)
chmod  ~/.codeium/windsurf/    Windsurf
chmod  ~/.cursor/              Cursor
chmod  ~/.claude/              Claude
```

JSON inválido:
```bash
 Validar JSON (ajustar caminho conforme IDE)
cat ~/.codeium/windsurf/mcp_config.json | python -m json.tool   Windsurf
cat ~/.cursor/mcp.json | python -m json.tool                    Cursor
cat ~/.claude/mcp_config.json | python -m json.tool             Claude
```

 Verificação Final

Execute o checklist:

- [ ] `node --version` retorna .x+
- [ ] `npm --version` retorna .x+
- [ ] `git --version` retorna .x+
- [ ] Projeto clonado com sucesso
- [ ] `npm install` sem erros
- [ ] `.env` configurado
- [ ] `npm run dev` inicia sem erros
- [ ] `npm test` passa todos os testes
- [ ] Framework JARVIS inicializado (`/jarvis-init`)
- [ ] IDE detectada corretamente (Windsurf/Cursor/Claude/VS Code)
- [ ] MCP Context7 instalado e respondendo (**obrigatório**)
- [ ] MCP de task manager só se `TASK_MANAGER` estiver no ENV (não bloqueia)
- [ ] IDE reiniciada após configurar MCPs (se configurou)

 Problemas Comuns

 Erro de permissão no npm

```bash
sudo chown -R $(whoami) ~/.npm
```

 Porta já em uso

```bash
 Encontrar processo
lsof -i :

 Matar processo
kill - {PID}
```

 Docker não inicia

```bash
 Reiniciar Docker
sudo systemctl restart docker

 Verificar status
docker ps
```

 Próximos Passos

Após setup completo:

. Ler o `README.md` para entender o projeto
. Ler o `AGENTS.md` para instruções de agentes de IA
. Verificar acessos em `CONTACTS.md` (raiz do projeto)
. Pegar primeira tarefa (task manager ou controle próprio se freelance)
. Usar `/eng.start {TASK_MANAGER_KEY}` para começar

> Fonte da verdade: README.md e AGENTS.md na raiz do projeto contêm a visão geral da arquitetura.
