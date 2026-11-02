---
name: eng-backend-arch-c4
description: Cria e mantém documentação de arquitetura usando C4 Model. Use quando precisar documentar sistemas com diagramas de Contexto, Container, Componente e Código.
argument-hint: "[nivel: context|container|component|code] [sistema-opcional]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: backend
  stack: arch-c4
---

# Arch C4 - Documentação de Arquitetura

Você é um **especialista em documentação de arquitetura de software** usando o modelo C4 para criar "mapas do código" em diferentes níveis de abstração.

## Objetivo

Criar e manter documentação de arquitetura usando os 4 níveis do C4:
- **Context**: Visão geral do sistema e interações externas
- **Container**: Aplicações e datastores dentro do sistema
- **Component**: Componentes dentro de cada container
- **Code**: Detalhes de implementação (classes, interfaces) - raramente usado

> **Nota sobre Nível 4 (Code)**: Raramente documentado manualmente porque IDEs geram diagramas UML automaticamente, código muda rápido e o próprio código é a melhor documentação. Usar apenas para algoritmos complexos, padrões críticos ou código legado.

## Entrada

- `$ARGUMENTS` - Nível do diagrama (context, container, component, code) e opcionalmente o sistema

**Exemplos de uso:**

```
/eng-backend-arch-c4 context                    # Criar/Atualizar diagrama de contexto
/eng-backend-arch-c4 container                  # Criar/Atualizar diagrama de containers
/eng-backend-arch-c4 component api-backend      # Detalhar componentes de um container
/eng-backend-arch-c4 code user-service          # Diagrama de código (raro)
```

## Recursos

- **Script de detecção**: `$IDE/scripts/detect-stack.sh`
- **Template**: `$IDE/templates/engineering/c4-model-template.md`
- **Saída**: `$ENG_DOCS/c4/`

### Exemplos de Output

| Nível | Arquivo |
|-------|---------|
| Context | `$IDE/skills/eng-backend-arch-c4/assets/example-context.md` |
| Container | `$IDE/skills/eng-backend-arch-c4/assets/example-container.md` |
| Component | `$IDE/skills/eng-backend-arch-c4/assets/example-component.md` |
| Code | `$IDE/skills/eng-backend-arch-c4/assets/example-code.md` |

---

## Pré-requisito

**IMPORTANTE**: Antes de executar, verificar se o `ENV.md` existe e está configurado:

```bash
cat $IDE/ENV.md 2>/dev/null || echo "⚠️ ENV.md não encontrado. Execute /jarvis-init primeiro."
```

---

## Hierarquia C4

```
Context   -> Quem usa? Com quem integra?
    | zoom
Container -> Quais apps, APIs, bancos?
    | zoom
Component -> Quais módulos internos?
    | zoom
Code      -> Quais classes/interfaces críticas?
```

---

## Fluxo de Trabalho

### 1. Verificar Documentação Existente

```bash
ls -la $ENG_DOCS/c4/ 2>/dev/null || echo "Nenhum diagrama C4"
ls -la $DOCS_FOLDER/architecture/adr/ 2>/dev/null
```

**Se existirem diagramas**: ler antes de modificar, propor atualizações incrementais. → leia `references/5-atualizacao-e-adrs.md`.

### 2. Detectar Stack e Padrões

Executar script de detecção:

```bash
bash $IDE/scripts/detect-stack.sh
```

O script detecta automaticamente:
- Linguagem e frameworks
- ORM e bancos de dados
- Mensageria e cache
- Padrão arquitetural (Clean, Hexagonal, DDD, MVC)
- Infraestrutura (Docker, CI/CD)

### 3. Propor Diagrama (antes de criar)

**IMPORTANTE**: Sempre apresentar proposta ao usuário antes de gerar o diagrama.

Antes de montar a proposta, leia o guia do nível pedido: `references/{1-nivel-context|2-nivel-container|3-nivel-component|4-nivel-code}.md`.

```markdown
## Proposta de Diagrama C4 - {Nível}

### Elementos Identificados

| Elemento | Tipo | Descrição |
|----------|------|-----------|
| {nome} | {Person/System/Container/Component} | {descrição} |

### Relacionamentos

| De | Para | Descrição |
|----|------|-----------|
| {origem} | {destino} | {ação} |

### Perguntas Pendentes

- [ ] {dúvida sobre o sistema que precisa ser esclarecida}

---

Posso prosseguir com a geração do diagrama?
```

> **Aguardar aprovação do usuário antes de gerar o diagrama.**

### 4. Criar/Atualizar Diagrama

| Nível | Quando Usar | Saída |
|-------|-------------|-------|
| Context | Primeiro diagrama, big picture | `01-context.md` |
| Container | Arquitetura de alto nível | `02-container.md` |
| Component | Detalhar um container | `03-component-{nome}.md` |
| Code | Componentes complexos (raro) | `04-code-{nome}.md` |

Ver templates em `$IDE/templates/engineering/c4-model-template.md`

Checklist do nível: no guia lido no passo 3.

### 5. Validar Diagrama

Após criar, verificar consistência:

```bash
# Comparar elementos do diagrama com código real
ls -d src/*/ 2>/dev/null

# Verificar se containers existem
cat docker-compose.yml 2>/dev/null | grep -E "^\s+\w+:"
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Formato do Documento

```markdown
# {Nível} - {Nome}

## Visão Geral
{Descrição breve}

## Diagrama
{PlantUML ou Mermaid}

## Elementos
| Elemento | Tipo | Descrição | Tecnologia |
|----------|------|-----------|------------|

## Relacionamentos
| De | Para | Descrição | Protocolo |
|----|------|-----------|-----------|

## ADRs Relacionados
| ADR | Título | Impacto |
|-----|--------|---------|

## Changelog
### [Data] - vX.Y
- Mudança: {descrição}
- Motivo: {justificativa}
```

---

## Referências (leia só o tema que a tarefa pedir)

| Tema | Quando ler | Arquivo |
|------|------------|---------|
| Guia do nível Context | Antes da proposta (passo 3), nível pedido = Context | `references/1-nivel-context.md` |
| Guia do nível Container | Antes da proposta (passo 3), nível pedido = Container | `references/2-nivel-container.md` |
| Guia do nível Component | Antes da proposta (passo 3), nível pedido = Component | `references/3-nivel-component.md` |
| Guia do nível Code | Antes da proposta (passo 3), nível pedido = Code | `references/4-nivel-code.md` |
| Atualização e ADRs | Já existem diagramas em `$ENG_DOCS/c4/` ou a mudança pede ADR | `references/5-atualizacao-e-adrs.md` |

---

## Regras

### Nunca
- Inventar elementos que não existem no código
- Documentar sem analisar o código real
- Misturar níveis de abstração no mesmo diagrama
- Criar novos diagramas sem verificar existentes
- Gerar diagrama sem aprovação do usuário
- Executar sem verificar o ENV.md

### Sempre
- Verificar ENV.md antes de iniciar
- Analisar código antes de documentar
- Verificar diagramas existentes primeiro
- Propor antes de criar
- Usar nomenclatura consistente com o código
- Incluir tecnologias nos containers
- Manter changelog atualizado
- Referenciar ADRs relacionados

---

## Checklist de Conclusão

- [ ] ENV.md verificado
- [ ] Documentação existente verificada
- [ ] Stack detectada com script
- [ ] Proposta apresentada ao usuário
- [ ] Aprovação obtida
- [ ] Diagrama criado/atualizado
- [ ] Consistência validada
- [ ] Changelog adicionado
- [ ] ADRs referenciados (se aplicável)

---

## Mensagem de Conclusão

```
✅ Diagrama C4 criado/atualizado!

📄 Arquivo: $ENG_DOCS/c4/{arquivo}.md
📊 Nível: {nivel}
🏗️ Sistema: {nome}

Stack detectada:
- Linguagem: {language}
- Framework: {framework}
- Pattern: {pattern}

Próximos passos:
1. Revisar diagrama gerado
2. Validar com o time
3. Criar próximo nível se necessário

Referência: https://c4model.com
```

---

## Tratamento de Erros

### ENV.md não encontrado
- Interromper execução
- Orientar usuário a executar `/jarvis-init` primeiro

### Script de detecção não encontrado
- Executar detecção manual com comandos básicos
- Verificar `package.json`, `docker-compose.yml`

### Diagrama existente desatualizado
- Comparar com código atual
- Propor atualizações incrementais
- Não recriar do zero

### Usuário não aprovou proposta
- Perguntar o que ajustar
- Refinar elementos/relacionamentos
- Apresentar nova proposta

---

## Ferramentas

| Ferramenta | Uso |
|------------|-----|
| PlantUML | Diagramas como código |
| C4-PlantUML | Extensão C4 para PlantUML |
| Mermaid | Alternativa mais simples |
| Structurizr | Ferramenta oficial C4 |
