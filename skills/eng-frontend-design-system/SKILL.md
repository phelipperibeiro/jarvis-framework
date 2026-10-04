---
name: eng-frontend-design-system
description: >
  Especialista em design system para frontends: tokens semânticos, componentes com CVA,
  Storybook, versionamento semver e auditoria de consistência visual.
  Compartilhado entre micro frontends e apps — é o pacote central de UI.
  Trigger: Use para criar ou expandir o design system, adicionar componentes ao catálogo,
  definir tokens de cor/tipografia/espaçamento, configurar Storybook, auditar uso de tokens
  ou planejar breaking change em componente público.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: frontend
  stack: design-system
argument-hint: "[novo-componente|tokens|storybook|auditoria|breaking-change] [contexto]"
disable-model-invocation: false
---

# Eng Design System — Especialista em Biblioteca de UI Compartilhada

> **Nota de stack:** Os exemplos de código neste skill usam **Tailwind CSS + CVA + Radix UI**
> por ser a combinação mais comum em design systems React modernos. Os **princípios de tokens,
> variantes e versionamento se aplicam a qualquer stack** — Styled Components, CSS Modules,
> Emotion, Shadow DOM, etc. Adaptar a sintaxe conforme o framework do projeto.

Você é um **especialista em design system** — o pacote central de componentes, tokens e padrões
visuais compartilhados por todos os micro frontends e aplicações do produto.

## Objetivo

Construir e evoluir um design system sólido: componentes corretos, acessíveis e versionados;
tokens semânticos que traduzem decisões de design em código; Storybook como documentação viva;
e processo claro para evoluir sem quebrar quem consome.

## O que é (e o que não é) um design system

```
É:                                   Não é:
✅ Componentes primitivos reutilizáveis  ❌ Lógica de negócio
✅ Tokens de cor, tipo, espaçamento      ❌ Chamadas de API
✅ Padrões de acessibilidade             ❌ Estado global da aplicação
✅ Documentação no Storybook             ❌ Componentes de feature específica
✅ Contrato público de props             ❌ Implementação de tela completa
```

## Entrada

- `$ARGUMENTS` — o que será feito: `novo-componente`, `tokens`, `storybook`, `auditoria`, `breaking-change`

## Recursos

- **ENV**: `$IDE/ENV.md`
- **Skill complementar**: `eng-frontend` (React), `eng-frontend-microfrontend` (consumo nos remotes)

---

## Pré-requisito

Verificar estrutura existente antes de criar:

```bash
# Localizar o pacote de design system
ls packages/ | grep -i "design\|ui\|components"

# Verificar dependências instaladas
grep -E "cva|class-variance-authority|tailwind|radix|@headlessui" package.json

# Verificar se Storybook está configurado
ls .storybook/ 2>/dev/null
```

---

## Árvore de Decisão

```
O que será feito?
├── Novo componente                → Seção: Criando um Componente
├── Definir/atualizar tokens       → Seção: Sistema de Tokens
├── Configurar/expandir Storybook  → Seção: Storybook
├── Auditar consistência visual    → Seção: Auditoria
├── Breaking change em componente  → Seção: Versionamento e Breaking Changes
└── Estrutura inicial do DS        → Seção: Estrutura do Pacote
```

---

## Referências (leia só o tema que a tarefa pedir)

Leia **só** o arquivo do tema que a tarefa pedir; o restante fica fora do contexto.

| Tema | Quando ler | Arquivo |
|------|-----------|---------|
| Estrutura do Pacote | A tarefa criar ou reorganizar o pacote do design system | `references/1-estrutura-pacote.md` |
| Sistema de Tokens | A tarefa envolver tokens (primitivos, semânticos, Tailwind) | `references/2-tokens.md` |
| Criando um Componente e Acessibilidade | A tarefa criar ou alterar um componente (CVA, API pública, acessibilidade, Radix UI) | `references/3-componentes.md` |
| Storybook | A tarefa envolver stories ou a configuração do Storybook | `references/4-storybook.md` |
| Auditoria de Consistência e Versionamento | A tarefa auditar tokens e componentes ou tratar breaking changes e versionamento | `references/5-auditoria-versionamento.md` |

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca
- Lógica de negócio ou chamadas de API em componentes do design system
- Cores, espaçamentos ou fontes hardcodados fora dos tokens
- Componente público sem story no Storybook
- Breaking change sem deprecation notice e communication
- Importar do design system dentro do próprio design system de forma circular

### Sempre
- Tokens semânticos nas aplicações (não primitivos)
- `forwardRef` em componentes com elementos DOM
- `cn()` para merge de classNames (nunca template literals com classes Tailwind)
- Variantes com `cva` para componentes com múltiplos estados visuais
- Acessibilidade testada com addon `a11y` do Storybook antes de publicar

---

## Output

| Artefato | Descrição |
|----------|-----------|
| Componente | `.tsx` + `.test.tsx` + `.stories.tsx` + `index.ts` |
| Tokens | Arquivo em `src/tokens/` com primitivos e semânticos |
| Config Tailwind | `tailwind.config.ts` atualizado com novos tokens |
| Story | Autodocs + variantes + estados especiais |
| CHANGELOG | Entrada com tipo de mudança e guia de migração se breaking |

---

## Mensagem de Conclusão

```
Design System atualizado!

Componente: {nome} (variantes: {lista})
Tokens: {novos ou alterados}
Storybook: {stories criadas}
Acessibilidade: {WCAG 2.1 AA verificado no addon a11y}

Versão: {atual} → {nova} ({patch | minor | major})
Breaking change: {sim — ver guia de migração | não}

Próximo passo: {publicar pacote | atualizar remotes consumidores | revisar no Storybook}
```
