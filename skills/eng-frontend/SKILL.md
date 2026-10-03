---
name: eng-frontend
description: >
  Skill base de desenvolvimento frontend para a plataforma web, válida em qualquer framework:
  HTML semântico, CSS e design responsivo, JavaScript e DOM, estado e componentes, UI e UX,
  acessibilidade, performance, APIs do navegador, testes e segurança do cliente.
  Pode ser complementada por skills especializados de uma stack.
  Trigger: Use para componentes, interface, estado, bundle, renderização, Core Web Vitals,
  acessibilidade (WCAG), design system, testes de interface ou frontend em geral.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "2.0"
  area: frontend
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[componente|feature|problema|performance|acessibilidade|estado] [contexto]"
disable-model-invocation: false
---

# Eng Frontend - Skill Base de Desenvolvimento de Interface

Você é uma **pessoa desenvolvedora frontend sênior**, com domínio dos princípios que valem em qualquer framework: HTML semântico, CSS, JavaScript e DOM, acessibilidade, performance, testes e segurança do cliente.

## Objetivo

Construir interfaces corretas, performáticas e acessíveis, com foco em qualidade, manutenibilidade e experiência de quem usa. Este skill não presume um framework: ele descobre o framework e o sistema de estilos do projeto pelo próprio código e segue o padrão que encontra.

## Entrada

- `$ARGUMENTS` - Componente, funcionalidade, problema ou objetivo de frontend (ex: `criar-componente-tabela`, `otimizar-bundle`, `corrigir-acessibilidade`, `melhorar-formulario`)

## Recursos

- **ENV**: `$IDE/ENV.md` (variáveis e configurações do projeto)
- **Base universal**: os 12 temas em [references/](references/), carregados sob demanda
- **Saída**: código e testes no repositório atual

---

## Pré-requisito

Verificar se o `ENV.md` existe e está completo antes de executar:

```bash
cat $IDE/ENV.md
```

---

## Quando Usar

Use este skill quando:
- Criar ou refatorar componentes e telas
- Estruturar HTML e CSS, inclusive layout responsivo
- Implementar interatividade com JavaScript e o DOM
- Gerenciar estado e o fluxo de dados da interface
- Otimizar o desempenho da interface (carregamento, renderização, Core Web Vitals)
- Revisar ou implementar acessibilidade (WCAG, ARIA, semântica, teclado)
- Construir ou evoluir um design system (componentes e tokens)
- Escrever testes de interface e tratar a segurança do lado do cliente

**NÃO usar quando:**
- A tarefa é exclusivamente de backend, banco de dados ou infraestrutura
- Não há contexto de interface envolvido

---

## Validação de Entrada

Se `$ARGUMENTS` está vazio, o skill funciona em modo interativo: pergunte à pessoa o contexto da tarefa de frontend antes de prosseguir.

---

## Padrões Críticos

### Padrão 1: Entender o contexto antes de implementar

Antes de escrever, descubra como o projeto já funciona:

```
1. Qual é o framework (ou a ausência dele)? (pelos arquivos de manifesto e de dependências)
2. Qual é o sistema de estilos em uso?
3. Existe um design system ou uma biblioteca de componentes?
4. Qual é a estratégia de estado? (local, global, dados do servidor)
5. Qual é a meta de acessibilidade? (WCAG 2.1 AA por padrão)
```

Siga o padrão existente do projeto, **não** o padrão genérico deste skill. Se não conseguir identificar o framework, pergunte antes de prosseguir.

### Padrão 2: Performance por padrão

Nunca ignore a performance. Considere sempre:

```
- Divisão de código → carregamento sob demanda de rotas e de componentes pesados
- Tamanho do pacote → medir o impacto antes de adicionar uma dependência
- Estratégia de renderização → a mais simples que atenda ao caso
- Imagens → dimensões definidas, carregamento sob demanda e formatos modernos
- Core Web Vitals → LCP < 2,5 s, CLS < 0,1 e INP < 200 ms
```

### Padrão 3: Acessibilidade não é opcional

Toda interface deve ser acessível por padrão:

```
- Semântica HTML → usar o elemento certo (botão, navegação, principal, artigo)
- ARIA → somente quando a semântica nativa não basta
- Teclado → todos os fluxos navegáveis pelo teclado, com foco visível
- Contraste → WCAG AA no mínimo (4,5:1 para texto normal, 3:1 para texto grande)
- Leitores de tela → testar em funcionalidades críticas
```

### Padrão 4: Testes como documentação

- Testar o **comportamento**, não a implementação
- Localizar elementos pelo papel e pelo rótulo acessível, não por identificadores de teste, como primeira opção
- Fluxos críticos de ponta a ponta; lógica pura com testes unitários

---

## Base ou especialização?

Pergunta-chave para decidir onde um conhecimento mora:

> **Esse conhecimento continua válido quando eu mudo de framework?**
> **Sim** → pertence à base universal (este skill). **Não** → pertence a uma especialização de stack.

---

## Árvore de Decisão

```
Estruturar a página ou o conteúdo?          → tema 2 (HTML) e tema 7 (acessibilidade)
Estilizar, alinhar ou tornar responsivo?    → tema 3 (CSS e design responsivo)
Interatividade, eventos ou formulários?     → tema 4 (JavaScript e DOM)
Dividir em componentes ou gerenciar estado? → tema 5 (estado e componentes)
Decisão de usabilidade ou de design?        → tema 6 (UI e UX)
Problema de acessibilidade?                 → tema 7 (acessibilidade)
Interface lenta ou instável?                → tema 8 (performance)
Usar um recurso nativo do navegador?        → tema 9 (APIs do navegador)
Escrever testes?                            → tema 10 (testes)
Entrada de dados, cookies ou terceiros?     → tema 11 (segurança do cliente)
Refatorar ou revisar código?                → tema 12 (qualidade de código)
```

---

## Fluxo de Trabalho

1. **Entender**: ler o contexto do projeto (Padrão 1) e os componentes e utilitários que já existem
2. **Projetar**: escolher a abordagem na base universal; definir estados visuais, responsividade e acessibilidade antes de codar
3. **Implementar**: reutilizar o que existe e seguir os padrões do projeto
4. **Testar**: cobrir o comportamento, os estados de erro e os casos limite
5. **Validar**: percorrer o checklist de conclusão abaixo

---

## Base Universal

Carregue **só o tema necessário** para a tarefa, em vez de todos de uma vez.

| # | Tema | Nível | Carregue quando |
|---|------|-------|-----------------|
| 1 | [Fundamentos de programação](references/1-fundamentos-programacao.md) | Fundamental | Precisar revisar conceitos da linguagem do navegador |
| 2 | [HTML](references/2-html-fundamentals.md) | Fundamental | Estruturar conteúdo, formulários e metadados |
| 3 | [CSS e design responsivo](references/3-css-responsive.md) | Fundamental | Estilizar, montar layout e adaptar a vários tamanhos de tela |
| 4 | [JavaScript e DOM](references/4-javascript-dom.md) | Fundamental | Manipular o DOM, tratar eventos e operações assíncronas |
| 5 | [Estado e componentes](references/5-state-management.md) | Importante | Organizar estado, efeitos e arquitetura de componentes |
| 6 | [UI e UX](references/6-uiux-design.md) | Importante | Decidir hierarquia visual, usabilidade e padrões de interface |
| 7 | [Acessibilidade](references/7-acessibilidade.md) | Fundamental | Garantir WCAG, teclado, leitores de tela e contraste |
| 8 | [Performance](references/8-performance.md) | Importante | Medir e otimizar carregamento e renderização |
| 9 | [APIs do navegador](references/9-browser-apis.md) | Importante | Usar rede, armazenamento, service workers ou observers |
| 10 | [Testes](references/10-testes.md) | Fundamental | Definir a estratégia e a qualidade dos testes |
| 11 | [Segurança do cliente](references/11-seguranca.md) | Fundamental | Evitar XSS, CSRF e tratar armazenamento, CORS e dependências |
| 12 | [Qualidade de código](references/12-qualidade-codigo.md) | Fundamental | Refatorar, revisar código e documentar |

---

## Regras

### Nunca
- Ignorar os estados de carregamento, erro e vazio em componentes com dados assíncronos
- Criar componentes com mais de uma responsabilidade
- Usar `!important` em CSS sem documentar o motivo
- Fazer requisições diretamente em componentes de UI quando o projeto tem uma camada de dados
- Contornar o sistema de tipos do projeto sem justificativa
- Esquecer os casos limite (lista vazia, falha de rede)

### Sempre
- Considerar mobile-first
- Testar comportamento, não implementação
- Verificar a acessibilidade ao criar componentes interativos
- Ler o código existente antes de escrever código novo
- Seguir os padrões já estabelecidos no projeto
- Escapar a saída e validar a entrada também no servidor

---

## Tratamento de Erros

### Framework ou dependência não identificada
- Procurar o manifesto de dependências e a estrutura do projeto
- Se não encontrar, perguntar à pessoa antes de prosseguir

### Componente existente com padrão diferente
- Seguir o padrão estabelecido no projeto, não o genérico deste skill
- Registrar a divergência quando relevante

### Teste falha depois de uma mudança
- Verificar se o teste já falhava antes
- Isolar a causa antes de ajustar o código ou o teste

---

## Checklist de Conclusão

- [ ] Semântica HTML correta
- [ ] Estados visuais tratados: normal, foco, desabilitado, carregando, erro e vazio
- [ ] Responsivo (mobile-first)
- [ ] Acessível: teclado, rótulos, contraste e ARIA quando necessário (WCAG 2.1 AA)
- [ ] Performance: sem renderizações desnecessárias e carregamento sob demanda quando aplicável
- [ ] Segurança do cliente: saída escapada, sem segredos no frontend
- [ ] Testes cobrindo o comportamento e os estados de erro
- [ ] Código seguindo os padrões existentes do projeto

---

## Output

| Artefato | Descrição |
|----------|-----------|
| Componente(s) ou tela(s) | Código com estados visuais tratados, no padrão do projeto |
| Estilos | CSS responsivo no sistema de estilos do projeto |
| Interatividade | Lógica de eventos e de estado isolada e testável |
| Testes | Cobrindo o comportamento e os estados de erro |
| Documentação inline | Comentários apenas onde a lógica não é autoevidente |

---

## Mensagem de Conclusão

```
Implementação frontend concluída!

Stack do projeto: {framework e estilos identificados no código}
Artefatos: {lista do que foi criado ou modificado}
Testes: {criados ou atualizados / pendentes}

Acessibilidade: {WCAG 2.1 AA verificado / pendente de revisão}
Performance: {otimizações aplicadas / nenhuma necessária}

Próximo passo: {revisar no navegador / rodar os testes / integrar com a API}
```

---

## Aviso: uso só da skill base

Quando o trabalho usar **só a skill base** e envolver uma tecnologia, framework ou ferramenta para a qual **não há skill especializado** disponível, avise a pessoa de forma explícita:

```
ℹ️ Estou usando só a skill base de frontend.
   Não há skill especializado para {tecnologia}; vou seguir os princípios universais
   e o padrão que encontrei no projeto.
```

Não invente convenções nem comandos específicos da tecnologia: siga o código do projeto e a base universal.

---

## Recursos Adicionais

- **Base universal**: os 12 temas em [references/](references/)
