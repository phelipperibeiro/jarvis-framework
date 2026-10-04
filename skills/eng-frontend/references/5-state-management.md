# 5. Estado e Arquitetura de Componentes

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer framework

## Objetivo
Organizar o estado da interface e dividir a tela em componentes reutilizáveis, com um fluxo de dados previsível.

## Conhecimentos Principais

### Conceitos de estado
- O que é estado
- Estado local versus global
- Mutação versus imutabilidade
- Estado derivado
- Quando usar estado (e quando não)

### Padrões de gerenciamento de estado
- Fluxo de dados unidirecional
- Fonte única da verdade
- Estado, ações e redutores (reducers) como padrão
- Padrão Observer
- Padrão Publish-Subscribe

### Arquitetura de componentes
- Componentes reutilizáveis
- Passagem de dados por propriedades (props)
- Elevar o estado (lifting state up)
- Composição versus herança
- Componentes de contêiner versus de apresentação

### Efeitos colaterais
- O que são efeitos colaterais
- Quando e como tratá-los
- Busca de dados
- Temporizadores e limpeza
- Listeners de eventos e limpeza

### Fluxo de dados
- De cima para baixo (propriedades)
- De baixo para cima (eventos e callbacks)
- Vinculação bidirecional e por que evitá-la
- Delegação de eventos

## O que NÃO Inclui
- Bibliotecas específicas de gerenciamento de estado
- Uma implementação particular de gerenciamento de estado

## Por quê é Universal
Os padrões de estado e de componentes são independentes da biblioteca ou do framework usado.

## Referências
- W3C - World Wide Web Consortium
- MDN Web Docs
- Martin Fowler - Presentation Model e padrões de interface
