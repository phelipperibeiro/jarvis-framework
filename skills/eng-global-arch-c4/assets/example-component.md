# Component - Skills Engine

## Visão Geral

Diagrama de componentes do Skills Engine, detalhando os módulos internos responsáveis por processar e executar skills do JARVIS Framework.

## Diagrama

```plantuml
@startuml C4_Component
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

LAYOUT_WITH_LEGEND()

title Skills Engine - Componentes

Container_Boundary(skills, "Skills Engine") {

    ' === ENTRADA ===
    Component(parser, "Skill Parser", "Markdown Parser", "Interpreta frontmatter e conteúdo do skill")
    Component(validator, "Skill Validator", "TypeScript", "Valida estrutura e campos obrigatórios")
    Component(loader, "Skill Loader", "Filesystem", "Carrega skills do diretório")
    
    ' === PROCESSAMENTO ===
    Component(resolver, "Variable Resolver", "TypeScript", "Resolve variáveis como $IDE, $DOCS_FOLDER")
    Component(executor, "Skill Executor", "MCP/Shell", "Executa comandos e ferramentas permitidas")
    Component(context, "Context Manager", "TypeScript", "Gerencia contexto da sessão")
    
    ' === SAÍDA ===
    Component(formatter, "Output Formatter", "Markdown", "Formata saída para o usuário")
    Component(logger, "Activity Logger", "Filesystem", "Registra atividades e erros")
}

' === EXTERNOS ===
Container(cli, "CLI Interface", "Shell")
Container(templates, "Template Engine", "Markdown")
Container(rules, "Rules Engine", "Markdown")
ContainerDb(env, "ENV Config", "Markdown")
ContainerDb(sessions, "Sessions", "Filesystem")

' === FLUXO DE ENTRADA ===
Rel(cli, loader, "Solicita skill")
Rel(loader, parser, "Envia conteúdo")
Rel(parser, validator, "Valida estrutura")

' === FLUXO DE PROCESSAMENTO ===
Rel(validator, resolver, "Skill válido")
Rel(resolver, env, "Lê variáveis")
Rel(resolver, executor, "Skill resolvido")
Rel(executor, context, "Atualiza contexto")
Rel(executor, templates, "Usa templates")
Rel(executor, rules, "Aplica regras")

' === FLUXO DE SAÍDA ===
Rel(executor, formatter, "Resultado")
Rel(formatter, cli, "Resposta formatada")
Rel(executor, logger, "Registra atividade")
Rel(context, sessions, "Persiste sessão")

@enduml
```

## Elementos

| Elemento | Tipo | Descrição | Tecnologia |
|----------|------|-----------|------------|
| Skill Parser | Componente | Interpreta frontmatter e conteúdo do skill | Markdown Parser |
| Skill Validator | Componente | Valida estrutura e campos obrigatórios | TypeScript |
| Skill Loader | Componente | Carrega skills do diretório | Filesystem |
| Variable Resolver | Componente | Resolve variáveis como $IDE, $DOCS_FOLDER | TypeScript |
| Skill Executor | Componente | Executa comandos e ferramentas permitidas | MCP/Shell |
| Context Manager | Componente | Gerencia contexto da sessão | TypeScript |
| Output Formatter | Componente | Formata saída para o usuário | Markdown |
| Activity Logger | Componente | Registra atividades e erros | Filesystem |

## Relacionamentos

| De | Para | Descrição | Protocolo |
|----|------|-----------|-----------|
| CLI Interface | Skill Loader | Solicita skill | Função |
| Skill Loader | Skill Parser | Envia conteúdo | Interno |
| Skill Parser | Skill Validator | Valida estrutura | Interno |
| Skill Validator | Variable Resolver | Skill válido | Interno |
| Variable Resolver | ENV Config | Lê variáveis | Filesystem |
| Variable Resolver | Skill Executor | Skill resolvido | Interno |
| Skill Executor | Context Manager | Atualiza contexto | Interno |
| Skill Executor | Template Engine | Usa templates | Filesystem |
| Skill Executor | Rules Engine | Aplica regras | Filesystem |
| Skill Executor | Output Formatter | Resultado | Interno |
| Output Formatter | CLI Interface | Resposta formatada | Função |
| Skill Executor | Activity Logger | Registra atividade | Filesystem |
| Context Manager | Sessions | Persiste sessão | Filesystem |

## ADRs Relacionados

| ADR | Título | Impacto |
|-----|--------|---------|
| ADR-002 | Integração via MCP | Define protocolo do executor |
| ADR-004 | Variáveis de ambiente | Define comportamento do resolver |

## Changelog

### [2025-01-24] - v1.0
- Criação: Diagrama de componentes do Skills Engine
- Motivo: Documentar arquitetura interna do processador de skills
