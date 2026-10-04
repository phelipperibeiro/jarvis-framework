# 12. Qualidade de Código

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer framework

## Objetivo
Escrever código de interface legível, organizado e fácil de evoluir.

## Conhecimentos Principais

### Clean Code
- Nomes significativos para variáveis, funções e componentes
- Funções pequenas e bem definidas
- DRY (Don't Repeat Yourself)
- Comentários úteis, não o óbvio
- Formatação consistente
- Tratamento de erros

### Organização do código
- Separação de responsabilidades
- Single Responsibility Principle (do SOLID)
- Padrão de módulos
- Evitar o escopo global

### Refatoração
- Code smells no frontend: funções longas, código duplicado, componentes grandes, feature envy e data clumps
- Extrair componente e extrair função
- Renomear para dar clareza

### Code review
- Revisar a qualidade do código, não a pessoa
- Dar feedback construtivo
- Automatização com linters, formatadores e verificadores de tipos (em conceito)

### Documentação
- Documentação é comunicação
- Arquivos README
- Comentários justos no código
- Documentação de componentes
- Architecture Decision Records (ADRs)

## O que NÃO Inclui
- Configuração específica de linters
- Configuração específica de formatadores

## Por quê é Universal
Os padrões de qualidade de código independem da linguagem e do framework.

## Referências
- Robert C. Martin - Clean Code
- Martin Fowler - Refactoring
