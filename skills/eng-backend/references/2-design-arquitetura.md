# 2. Design e Arquitetura de Software

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer linguagem

## Objetivo
Projetar sistemas coesos e fáceis de mudar, aplicando princípios de design e padrões de arquitetura que independem de tecnologia.

## Conhecimentos Principais

### Princípios SOLID
- **S**ingle Responsibility: uma razão para mudar
- **O**pen/Closed: aberto para extensão, fechado para modificação
- **L**iskov Substitution: subtipos substituem seus tipos base
- **I**nterface Segregation: interfaces pequenas e específicas
- **D**ependency Inversion: depender de abstrações

### Princípios complementares
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)
- Separação de responsabilidades (Separation of Concerns)

### Conceitos de orientação a objetos
- Encapsulamento, abstração e polimorfismo
- Herança e seus riscos; composição como alternativa
- Coesão alta e acoplamento baixo

### Padrões de arquitetura
- Em camadas (Layered, N-tier)
- Hexagonal (Ports and Adapters): o núcleo não conhece os detalhes externos
- Clean Architecture
- Domain-Driven Design (DDD): contextos delimitados e linguagem ubíqua
- Orientada a eventos (Event-Driven)
- **Vertical Slice**: organizar cada funcionalidade como uma fatia vertical completa. Vantagens: coesão alta, menor acoplamento entre funcionalidades e entregas mais independentes. Funciona bem com contextos delimitados do DDD

## O que NÃO Inclui
- Padrões específicos de um framework
- Implementação de DDD em um framework específico
- Estrutura de diretórios de um framework

## Por quê é Universal
Princípios de bom design são atemporais e valem com qualquer tecnologia.

## Referências
- IEEE SWEBOK - Software Engineering Body of Knowledge
- ACM Computing Curricula 2023
- Martin Fowler - Patterns of Enterprise Application Architecture
