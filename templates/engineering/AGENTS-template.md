 AGENTS.md

> Este arquivo segue a convenção [AGENTS.md](https://agents.md/) - um formato aberto para guiar agentes de IA em projetos de código.

 Project Overview

{WORKSPACE} é o workspace da área {AREA} do hub {HUB}, mantido pelo squad {SQUAD}.

{PROJECT_DESCRIPTION}

 Tech Stack

{TECH_STACK}

 Setup Commands

```bash
{SETUP_COMMANDS}
```

 Code Style

{CODE_STYLE}

 Testing Instructions

{TESTING_INSTRUCTIONS}

 PR Instructions

- Formato do título: `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`
- Mensagem de commit: `{tipo}({escopo}): {descrição}`
- Sempre execute lint e testes antes de commitar
- Referencie o TASK_MANAGER_KEY no commit: `Refs: {TASK_MANAGER_KEY}`

 Security Considerations

- Nunca commite credenciais, tokens ou senhas
- Use variáveis de ambiente para dados sensíveis
- Siga as práticas de segurança definidas em `{IDE_FOLDER}/rules/engineering/`
- Reporte vulnerabilidades ao time de segurança

 Available Workflows

O projeto utiliza o framework JARVIS com os seguintes comandos principais:

| Comando | Descrição |
|---------|-----------|
| `/jarvis-init` | Inicializar ambiente e criar ENV.md |
| `/eng.start` | Iniciar nova tarefa (cria architecture.md) |
| `/eng.plan` | Criar plano de execução faseado |
| `/eng.work` | Implementar código seguindo o plano |
| `/eng.pr` | Criar branch, commit e Merge Request |
| `/eng.debug` | Investigar e resolver bugs |

 For AI Agents

Se você é um agente de IA trabalhando neste projeto:

. Leia primeiro: `{IDE_FOLDER}/README.md` para entender o framework JARVIS
. Regras: Siga as regras em `{IDE_FOLDER}/rules/`
. Sessões: Use `{IDE_FOLDER}/sessions/` para contexto de tarefas em andamento
. Templates: Use os templates em `{IDE_FOLDER}/templates/` para documentos
. Idioma: Toda documentação deve ser em português do Brasil (pt-BR)

 Additional Resources

- README.md - Visão geral do projeto para humanos
- {IDE_FOLDER}/JARVIS.md - Guia completo do framework
- {IDE_FOLDER}/MCPs.md - Integrações MCP disponíveis
