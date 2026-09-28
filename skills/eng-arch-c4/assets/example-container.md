# Container - Sistema JARVIS

## Visão Geral

Diagrama de containers do JARVIS Framework, mostrando as aplicações, datastores e como eles se comunicam internamente.

## Diagrama

```plantuml
@startuml C4_Container
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_TOP_DOWN()
LAYOUT_WITH_LEGEND()

title Sistema JARVIS - Diagrama de Containers

' === PERSONAS ===
Person(dev, "Desenvolvedor", "Usa o framework via IDE")

' === SISTEMA PRINCIPAL ===
System_Boundary(jarvis, "JARVIS Framework") {

    ' === CLI/INTERFACE ===
    Container(cli, "CLI Interface", "Shell/Bash", "Comandos e workflows executáveis")
    Container(skills, "Skills Engine", "Markdown/MCP", "Processador de skills e prompts")
    
    ' === CORE ===
    Container(templates, "Template Engine", "Markdown", "Templates de documentação")
    Container(rules, "Rules Engine", "Markdown", "Regras e validações")
    Container(workflows, "Workflow Engine", "Markdown", "Fluxos de trabalho automatizados")
    
    ' === DADOS ===
    ContainerDb(sessions, "Sessions", "Filesystem", "Sessões de trabalho ativas")
    ContainerDb(docs, "Documentation", "Filesystem", "Documentação gerada")
    ContainerDb(env, "ENV Config", "Markdown", "Configurações do ambiente")
}

' === SISTEMAS EXTERNOS ===
System_Ext(ide, "IDE", "Windsurf/Cursor/Claude")
System_Ext(jira, "Jira", "Task Management")
System_Ext(gitlab, "GitLab", "Version Control")

' === RELACIONAMENTOS ENTRADA ===
Rel(dev, ide, "Usa", "GUI")
Rel(ide, cli, "Invoca comandos", "MCP/Terminal")

' === RELACIONAMENTOS INTERNOS ===
Rel(cli, skills, "Carrega", "Filesystem")
Rel(skills, templates, "Usa", "Filesystem")
Rel(skills, rules, "Valida com", "Filesystem")
Rel(skills, workflows, "Executa", "Filesystem")
Rel(skills, env, "Lê config", "Filesystem")

Rel(workflows, sessions, "Cria/Atualiza", "Filesystem")
Rel(workflows, docs, "Gera", "Filesystem")

' === RELACIONAMENTOS EXTERNOS ===
Rel(workflows, jira, "Sincroniza", "REST API")
Rel(workflows, gitlab, "Cria MR", "REST API")

@enduml
```

## Elementos

| Elemento | Tipo | Descrição | Tecnologia |
|----------|------|-----------|------------|
| CLI Interface | Container | Comandos e workflows executáveis | Shell/Bash |
| Skills Engine | Container | Processador de skills e prompts | Markdown/MCP |
| Template Engine | Container | Templates de documentação | Markdown |
| Rules Engine | Container | Regras e validações | Markdown |
| Workflow Engine | Container | Fluxos de trabalho automatizados | Markdown |
| Sessions | Datastore | Sessões de trabalho ativas | Filesystem |
| Documentation | Datastore | Documentação gerada | Filesystem |
| ENV Config | Datastore | Configurações do ambiente | Markdown |

## Relacionamentos

| De | Para | Descrição | Protocolo |
|----|------|-----------|-----------|
| IDE | CLI Interface | Invoca comandos | MCP/Terminal |
| CLI Interface | Skills Engine | Carrega | Filesystem |
| Skills Engine | Template Engine | Usa | Filesystem |
| Skills Engine | Rules Engine | Valida com | Filesystem |
| Skills Engine | Workflow Engine | Executa | Filesystem |
| Skills Engine | ENV Config | Lê config | Filesystem |
| Workflow Engine | Sessions | Cria/Atualiza | Filesystem |
| Workflow Engine | Documentation | Gera | Filesystem |
| Workflow Engine | Jira | Sincroniza | REST API |
| Workflow Engine | GitLab | Cria MR | REST API |

## ADRs Relacionados

| ADR | Título | Impacto |
|-----|--------|---------|
| ADR-001 | Uso de Markdown para documentação | Define formato de templates |
| ADR-003 | Estrutura de pastas por domínio | Define organização de containers |

## Changelog

### [2025-01-24] - v1.0
- Criação: Diagrama inicial de containers
- Motivo: Documentar arquitetura interna do JARVIS
