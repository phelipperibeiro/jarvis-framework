# Context - Sistema JARVIS

## Visão Geral

O JARVIS é um framework de produtividade para agentes de IA que auxilia equipes de engenharia e produto na criação de documentação, especificações técnicas e workflows automatizados.

## Diagrama

```plantuml
@startuml C4_Context
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_TOP_DOWN()
LAYOUT_WITH_LEGEND()

title Sistema JARVIS - Diagrama de Contexto

' === PERSONAS ===
Person(dev, "Desenvolvedor", "Engenheiro de software que implementa features")
Person(tech_lead, "Tech Lead", "Lidera decisões técnicas e arquiteturais")
Person(pm, "Product Manager", "Define requisitos e prioridades de produto")

' === SISTEMA PRINCIPAL ===
System(jarvis, "JARVIS Framework", "Framework de produtividade para agentes de IA que automatiza documentação, especificações e workflows")

' === SISTEMAS EXTERNOS ===
System_Ext(jira, "Jira", "Gerenciamento de tarefas e histórias")
System_Ext(gitlab, "GitLab", "Controle de versão e CI/CD")
System_Ext(slack, "Slack", "Comunicação do time")
System_Ext(ide, "IDE (Windsurf/Cursor)", "Ambiente de desenvolvimento")

' === RELACIONAMENTOS ===
Rel(dev, jarvis, "Usa para criar specs e código", "CLI/IDE")
Rel(tech_lead, jarvis, "Usa para documentar arquitetura", "CLI/IDE")
Rel(pm, jarvis, "Usa para criar PRDs e histórias", "CLI/IDE")

Rel(jarvis, jira, "Sincroniza tarefas", "REST API")
Rel(jarvis, gitlab, "Cria branches e MRs", "REST API")
Rel(jarvis, slack, "Envia notificações", "Webhook")
Rel_L(ide, jarvis, "Integra via extensões", "MCP")

@enduml
```

## Elementos

| Elemento | Tipo | Descrição | Tecnologia |
|----------|------|-----------|------------|
| JARVIS Framework | Sistema | Framework de produtividade para agentes de IA | Markdown, Shell, MCP |
| Desenvolvedor | Pessoa | Engenheiro que implementa features | - |
| Tech Lead | Pessoa | Lidera decisões técnicas | - |
| Product Manager | Pessoa | Define requisitos de produto | - |
| Jira | Sistema Externo | Gerenciamento de tarefas | REST API |
| GitLab | Sistema Externo | Controle de versão | REST API |
| Slack | Sistema Externo | Comunicação | Webhook |
| IDE | Sistema Externo | Ambiente de desenvolvimento | MCP |

## Relacionamentos

| De | Para | Descrição | Protocolo |
|----|------|-----------|-----------|
| Desenvolvedor | JARVIS | Usa para criar specs e código | CLI/IDE |
| Tech Lead | JARVIS | Usa para documentar arquitetura | CLI/IDE |
| Product Manager | JARVIS | Usa para criar PRDs e histórias | CLI/IDE |
| JARVIS | Jira | Sincroniza tarefas | REST API |
| JARVIS | GitLab | Cria branches e MRs | REST API |
| JARVIS | Slack | Envia notificações | Webhook |
| IDE | JARVIS | Integra via extensões | MCP |

## ADRs Relacionados

| ADR | Título | Impacto |
|-----|--------|---------|
| ADR-001 | Uso de Markdown para documentação | Define formato padrão |
| ADR-002 | Integração via MCP | Define protocolo de comunicação |

## Changelog

### [2025-01-24] - v1.0
- Criação: Diagrama inicial de contexto
- Motivo: Documentar visão geral do sistema JARVIS
