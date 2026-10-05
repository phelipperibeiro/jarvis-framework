---
name: eng.frontend-rules
description: >
  Padrões obrigatórios para devs com HUB: FRONTEND, neutros de stack — componentes,
  tipagem, acessibilidade, performance, testes, arquiteturas distribuídas e tokens de design.
  O que depende da stack vem das especializações registradas em FRONTEND_SPECIALIZATIONS.
author: jarvis-team
version: "1.1"
---

> **Applies to:** HUB: FRONTEND | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras de Engenharia Frontend

> **Neutras de stack.** Estas regras valem para qualquer framework ou linguagem de frontend. Onde uma regra depende da stack (como se busca dados, como se organiza um módulo, qual ferramenta de teste usar), siga a **especialização registrada** em `FRONTEND_SPECIALIZATIONS` no `ENV.md` e o código existente do projeto. Sem especialização registrada, **pergunte** em vez de presumir uma stack. Ver `eng.specializations-rules.md`.

---

## 1. Componentes

### Estrutura obrigatória
- Toda entrada de um componente (props, parâmetros ou atributos) é **tipada ou documentada**; tipo genérico solto (`any` ou equivalente) é proibido sem justificativa documentada
- Entradas obrigatórias são declaradas como obrigatórias; opcionais têm valor default explícito
- Componentes com mais de uma responsabilidade devem ser divididos (Single Responsibility)
- Lógica de negócio não pertence ao componente de UI — usar a camada de lógica ou de serviço que o projeto adota

### Nomenclatura
- Seguir a convenção de nomes **do projeto** (e da especialização registrada) para componentes, funções de lógica reutilizável e arquivos
- Manter o padrão consistente: um mesmo tipo de arquivo, um mesmo estilo de nome

### Checklist mínimo por componente
- [ ] Entradas tipadas ou documentadas
- [ ] Estados visuais: normal, hover, focus, disabled, loading, erro, vazio
- [ ] Semântica HTML correta (não usar um contêiner genérico para botões, links ou listas)
- [ ] Responsivo (mobile-first, nos tamanhos de tela do projeto)
- [ ] Testável sem depender de um navegador real (lógica isolada da apresentação)

---

## 2. Tipagem e contratos

Aplica-se quando a linguagem do projeto tem tipagem estática ou contratos explícitos.

- O **modo estrito** de verificação do projeto fica ligado e não é relaxado
- Proibido: tipo genérico solto, supressão de verificação de tipos sem comentário explicativo e asserção de "não nulo" sem verificação prévia
- Modelar objetos de domínio de forma explícita e unir ou derivar tipos com os recursos da linguagem
- Exportar o contrato público dos componentes, quando a linguagem permite

---

## 3. Acessibilidade (WCAG 2.1 AA — obrigatório)

- Semântica HTML nativa antes de ARIA (`<button>`, `<nav>`, `<main>`, `<article>`)
- Todos os elementos interativos são navegáveis por teclado
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande e elementos de interface
- Imagens informativas têm texto alternativo descritivo; decorativas têm texto alternativo vazio
- Modais usam `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e prendem o foco
- Formulários: todo campo tem rótulo associado
- Erros de formulário: exibidos com `role="alert"` ou `aria-live="polite"`
- Leitor de tela: testar com VoiceOver (Mac) ou NVDA (Windows) em features críticas

---

## 4. Performance

### Core Web Vitals — targets obrigatórios
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- INP (Interaction to Next Paint): < 200ms

### Práticas obrigatórias
- Imagens sempre com largura e altura definidas, para evitar CLS
- Carregamento tardio de componentes pesados, com o recurso que a stack oferece, e um substituto visual com o mesmo tamanho enquanto carrega
- Dependências novas: avaliar o impacto no tamanho do pacote final antes de instalar
- Busca de dados pela camada que o projeto adota para isso (conforme a especialização), e não por efeitos soltos no componente de apresentação
- Otimização de renderização apenas quando necessária e **comprovada com medição** (não otimização prematura)

---

## 5. Testes

- **Consultas por acessibilidade primeiro** (por papel e por rótulo): focar no que o usuário vê e faz, não em detalhes de implementação
- **Proibido** usar identificador de teste como primeira opção (só quando não houver alternativa acessível)
- **Cobertura mínima:** fluxos críticos de usuário (caminho feliz e estado de erro)
- **Testes unitários** para lógica pura e utilitários, com a ferramenta que o projeto já usa
- **Testes de ponta a ponta** para fluxos completos de usuário (login, checkout etc.), com a ferramenta que o projeto já usa
- Substitutos de módulos externos ficam num lugar previsível do projeto (por exemplo, uma pasta de mocks)

### Ferramentas disponíveis no framework

- **TestSprite** (`/eng-qa-testsprite`): se estiver instalado no projeto, usá-lo para gerar e executar testes de componente e de ponta a ponta — ele gera planos de teste e código automaticamente.
  Verificar: `ls node_modules/@testsprite 2>/dev/null || cat package.json | grep testsprite`
- **Stagehand** (`/eng-automation-robot-builder`, `/eng-qa-e2e`): para testes de ponta a ponta em linguagem natural ou automação de fluxos complexos, descrevendo o fluxo em português.
  Verificar: `cat package.json | grep stagehand`

> Quando qualquer dessas ferramentas estiver disponível no projeto, **preferir sobre a implementação manual** — reduz o custo de manutenção e aumenta a cobertura mais rápido.

---

## 6. Arquiteturas distribuídas (se o projeto divide o frontend em partes)

Aplica-se somente se o projeto divide o frontend em partes carregadas separadamente (por exemplo, uma aplicação principal que carrega módulos independentes). O detalhe da arquitetura em uso vem da especialização registrada. Princípios que valem em qualquer variante:

- Cada módulo é **versionado e publicado** com uma alternativa definida quando não carrega
- Os contratos de interface entre a aplicação principal e os módulos são declarados de forma explícita e compartilhada
- Nenhum módulo depende diretamente de outro: a comunicação passa pela aplicação principal ou por um barramento de eventos
- Dependências compartilhadas são declaradas explicitamente, para não serem carregadas em duplicidade
- Cada módulo deve funcionar de forma isolada, para desenvolvimento local
- Testes de integração entre a aplicação principal e cada módulo são obrigatórios em cada ponto de montagem
- Mudança que quebra o contrato de um módulo exige aumento de versão **major**

---

## 7. Tokens de design e componentes compartilhados

- Cores, tipografia, espaçamentos e tamanhos de tela vêm **exclusivamente** dos tokens de design do projeto (quando o projeto tem)
- Proibido fixar valores de cor, fonte ou espaçamento fora dos tokens
- Novos componentes reutilizáveis nascem na biblioteca de componentes compartilhados do projeto (se existir) antes de serem usados nos módulos
- Variantes de componente seguem o padrão que o projeto já usa
- Componentes públicos da biblioteca compartilhada têm documentação visual antes de serem liberados, quando o projeto usa um catálogo de componentes
- Alterações na interface pública de um componente seguem o versionamento semântico

---

## 8. Code Review (Checklist do Reviewer)

Ao revisar PR de frontend, verificar:

- [ ] Tipagem sem tipo genérico solto nem supressões injustificadas (quando a linguagem tem tipagem)
- [ ] Nenhuma lógica de negócio em componente de UI
- [ ] Acessibilidade: semântica HTML, ARIA correto, navegação por teclado
- [ ] Performance: sem renderizações desnecessárias comprovadas, carregamento tardio aplicado quando cabível
- [ ] Tokens de design do projeto usados (sem valores fixos)
- [ ] Testes cobrem o caminho feliz e o estado de erro
- [ ] Responsividade verificada em celular e desktop
- [ ] Se arquitetura distribuída: contrato de interface atualizado e módulo funciona de forma isolada
- [ ] Itens exigidos pelas especializações registradas atendidos

---

## 9. Proibições Absolutas

- Manipulação direta do DOM fora do mecanismo que o framework do projeto prevê para isso
- `!important` em CSS sem comentário explicativo
- Busca de dados direto no componente de apresentação (usar a camada que o projeto adota)
- Importar diretamente de outro módulo de uma arquitetura distribuída (rompe o isolamento)
- Fixar tokens de design (cores, espaçamentos, fontes) fora do sistema de tokens
- Log de depuração (`console.log` ou equivalente) em código commitado (usar logger estruturado ou remover)
