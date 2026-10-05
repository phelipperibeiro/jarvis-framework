# 13. Design System e Tokens

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer framework ou biblioteca de estilos

## Objetivo
Traduzir decisões de design em código reutilizável — tokens e componentes primitivos — sem lógica de negócio, versionados de forma que consumidores não quebrem sem aviso.

## Conhecimentos Principais

### O que é (e o que não é) um design system
- É: componentes primitivos reutilizáveis, tokens de cor/tipografia/espaçamento, padrões de acessibilidade, contrato público de props, documentação viva
- Não é: lógica de negócio, chamadas de API, estado global da aplicação, componente de feature específica, implementação de tela completa

### Hierarquia de tokens
- Primitivo: o valor bruto (ex: a cor azul #1a73e8, espaçamento base de 4px)
- Semântico: o nome que traduz intenção (ex: `color.action.primary`, `space.card.padding`) — aponta para um primitivo
- Aplicações consomem **semânticos**, nunca primitivos diretamente — permite trocar o valor sem tocar quem usa
- Tokens de tema (claro/escuro, marca) são uma camada de semânticos, não primitivos novos

### Componentes primitivos
- Contrato público de props estável — mudar a assinatura é breaking change
- Variantes (tamanho, tonalidade, estado) descritas declarativamente, não por composição de classes soltas
- Acessibilidade (semântica, ARIA, foco, contraste) resolvida uma vez no primitivo, herdada por quem consome
- `forwardRef`/equivalente para componentes que envolvem um elemento nativo — quem consome pode precisar da referência

### Documentação como contrato vivo
- Cada componente público tem exemplo executável de cada variante e estado (catálogo vivo, não só texto)
- A documentação é testada: se a variante documentada não compila/renderiza, o catálogo quebra o build
- Acessibilidade verificada automaticamente no catálogo antes de publicar

### Versionamento e breaking changes
- Semver: patch (correção visual sem mudar contrato), minor (nova variante/prop opcional), major (contrato muda ou quebra)
- Breaking change vem com aviso de depreciação antes da remoção, não só no changelog
- Auditoria periódica: tokens hardcoded fora do sistema e componentes fora do catálogo são dívida, não exceção

## O que NÃO Inclui
- Sintaxe de uma ferramenta de variantes específica (ex: CVA, Stitches)
- Configuração de uma ferramenta de catálogo específica (ex: Storybook, Ladle)
- Framework de componentização (React, Vue, Web Components) — os princípios valem para qualquer um

## Por quê é Universal
Token semântico, contrato de props estável e versionamento por semver continuam válidos trocando o framework, a biblioteca de estilos ou a ferramenta de catálogo — só a sintaxe muda.

## Referências
- Frost, *Atomic Design*
- Material Design — Design Tokens
- W3C Design Tokens Community Group
