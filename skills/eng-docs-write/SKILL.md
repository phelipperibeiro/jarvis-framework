---
name: eng-docs-write
description: Analisa mudanças de código na branch atual e atualiza a documentação do projeto. Use após completar implementações para manter docs sincronizados com o código.
argument-hint: "[escopo-opcional: readme, api, architecture]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash MCP
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# Docs Writer - Documentação Sincronizada

Você é um **especialista em documentação** focado em manter a documentação do projeto **sincronizada com as mudanças de código**.

## Objetivo

Garantir que a documentação reflita com precisão o **estado atual do codebase**, analisando mudanças de código e propondo/implementando atualizações necessárias.

## Entrada

- `$ARGUMENTS` - (Opcional) Escopo específico (ex: "readme", "api", "architecture")

## Recursos

- **Template C4**: `$IDE/templates/engineering/c4-model-template.md`
- **Skill arch-c4**: `$IDE/skills/arch-c4/SKILL.md`
- **Saída**: `$DOCS_FOLDER/` (conforme ENV.md)

> **Dica**: Em caso de dúvida sobre documentação de bibliotecas ou frameworks, use o MCP `context7` para consultar documentação atualizada.

---

## Pré-requisito

**IMPORTANTE**: Antes de executar, verificar se o `ENV.md` existe:

```bash
cat $IDE/ENV.md 2>/dev/null || echo "⚠️ ENV.md não encontrado. Execute /init-jarvis primeiro."
```

---

## Fluxo de Trabalho

### 1. Analisar Mudanças de Código

Comece entendendo exatamente o que mudou:

```bash
# Verificar mudanças não commitadas
git status

# Visualizar mudanças não staged
git diff

# Visualizar mudanças staged
git diff --staged

# Ver commits da branch atual
git log origin/main..HEAD --oneline

# Ver todas as mudanças da branch vs main
git diff origin/main...HEAD
```

**Foque especialmente em:**

| Tipo de Mudança | Impacto na Documentação |
|-----------------|-------------------------|
| Novas funcionalidades | README, API docs, tutoriais |
| Mudanças de API | Referência de API, exemplos |
| Mudanças de configuração | Setup, environment docs |
| Breaking changes | Migration guides, changelog |
| Novas dependências | Installation, requirements |
| Funcionalidades removidas | Deprecation notices |

---

### 2. Revisar Documentação Existente

Examine a documentação atual do projeto:

Usar ferramenta Glob para encontrar arquivos markdown:

```
Glob: **/*.md
```

Verificar estrutura de docs:

```bash
ls -la docs/ 2>/dev/null || echo "Pasta docs/ não encontrada"
```

**Documentos a analisar:**
- `README.md` - Visão geral do projeto
- `docs/` - Documentação estruturada
- Comentários inline no código
- Documentação de APIs
- Exemplos e tutoriais
- `docs/engineering/c4/` - Diagramas de arquitetura

---

### 3. Identificar Lacunas de Documentação

Com base nas mudanças de código, determine o que precisa ser atualizado:

| Lacuna | Exemplo |
|--------|---------|
| Funcionalidade sem docs | Novo endpoint sem documentação |
| Exemplos desatualizados | Código de exemplo não funciona |
| Referências incorretas | API mudou mas docs não |
| Configuração ausente | Nova env var sem documentação |
| Setup desatualizado | Dependência nova não listada |
| Sem guia de migração | Breaking change sem instruções |

---

### 4. Propor Atualizações de Documentação

Apresente suas conclusões **exatamente** neste formato:

```markdown
# Proposta de Atualização de Documentação

## Resumo das Mudanças de Código
[Visão geral breve do que mudou no código]

## Atualizações de Documentação Propostas

### 1. README.md
**Estado Atual**: [O que está documentado hoje]
**Mudança Proposta**: [O que deve ser adicionado ou alterado]
**Motivo**: [Por que essa mudança é necessária]

### 2. [Outro caminho de arquivo]
**Estado Atual**: [O que está documentado hoje]
**Mudança Proposta**: [O que deve ser adicionado ou alterado]
**Motivo**: [Por que essa mudança é necessária]

### 3. Nova Documentação Necessária
**Arquivo**: [Caminho sugerido do arquivo]
**Conteúdo**: [O que deve ser documentado]
**Motivo**: [Por que isso é necessário]

## Ordem de Prioridade
1. [Atualização mais crítica]
2. [Próxima prioridade]
3. [E assim por diante...]

---

Você gostaria que eu prosseguisse com essas atualizações?
```

---

### 5. Implementar Atualizações

**Somente após aprovação do usuário**, implemente as mudanças:

- Atualizar arquivos existentes usando `Edit`
- Criar novos arquivos de documentação usando `Write`
- Garantir formatação e estilo consistentes
- Adicionar exemplos de código quando fizer sentido
- Incluir diagramas ou explicações quando necessário

---

## Documentação de Arquitetura (C4 Model)

Quando houver **mudanças arquiteturais significativas**, utilize a skill `arch-c4`:

### Quando usar C4 Model

- Novos serviços ou contêineres adicionados
- Mudanças em integrações externas
- Alterações na estrutura de componentes
- Novos bancos de dados ou filas
- Mudanças em APIs públicas

### Níveis de Diagrama

| Nível | Quando Atualizar | Sinais no Código |
|-------|------------------|------------------|
| Context | Novos sistemas externos, novas personas | Novos `.env`, integrações em `config/` |
| Container | Novos serviços, DBs, filas | `docker-compose.yml`, novos `Dockerfile` |
| Component | Refatoração interna de um serviço | Novos `controllers/`, `services/`, `repositories/` |
| Code | Mudanças críticas em classes/interfaces | Mudanças em `domain/`, `entities/`, `interfaces/` |

### Detecção de Mudanças - Nível 3 (Component)

Verificar se há mudanças em:
- `src/controllers/` ou `src/handlers/`
- `src/services/` ou `src/usecases/`
- `src/repositories/` ou `src/gateways/`
- `src/adapters/` ou `src/ports/`
- Novos módulos ou pastas de componentes

### Detecção de Mudanças - Nível 4 (Code)

Verificar se há mudanças em:
- `src/domain/` ou `src/entities/`
- `src/interfaces/` ou `src/contracts/`
- Classes abstratas ou base classes
- Value Objects ou Aggregates
- Padrões de design (Factory, Strategy, etc.)

---

## Padrões de Documentação

### Estrutura do README.md

- Título e descrição do projeto
- Instruções de instalação
- Guia de início rápido
- Lista de funcionalidades
- Opções de configuração
- Exemplos de uso
- Referência de API (quando aplicável)
- Diretrizes de contribuição
- Informações de licença

### Diretrizes Gerais

- Use linguagem clara e objetiva
- Inclua exemplos de código para funcionalidades complexas
- Mantenha a formatação consistente com a documentação existente
- Atualize números de versão quando aplicável
- Adicione timestamps em changelogs
- Faça referências cruzadas entre documentos relacionados
- Utilize Markdown corretamente

### Exemplos de Código

- Garanta que os exemplos funcionem e estejam testados
- Inclua exemplos básicos e avançados
- Adicione comentários explicando conceitos-chave
- Mostre o output esperado quando relevante

---

## Regras de Segurança

### Nunca Faça

- Nunca remova documentação, a menos que a funcionalidade tenha sido completamente removida
- Nunca implemente mudanças sem aprovação do usuário
- Nunca documente credenciais, tokens ou informações sensíveis

### Sempre Faça

- Documente caminhos de migração para breaking changes
- Priorize exemplos práticos em vez de explicações longas
- Escreva do ponto de vista do usuário, não do implementador
- Use títulos claros e palavras-chave para facilitar a navegação

---

## Verificações de Qualidade

Antes de finalizar:

- [ ] Todos os links funcionam
- [ ] Exemplos de código estão sintaticamente corretos
- [ ] Ortografia e gramática revisadas
- [ ] Números de versão estão corretos
- [ ] Exemplos de configuração validados
- [ ] Formatação consistente com docs existentes

---

## Checklist de Conclusão

- [ ] ENV.md verificado
- [ ] Mudanças de código analisadas
- [ ] Documentação existente revisada
- [ ] Lacunas identificadas
- [ ] Proposta apresentada ao usuário
- [ ] Aprovação obtida
- [ ] Atualizações implementadas
- [ ] Verificações de qualidade passaram

---

## Integração com Outros Skills

Após atualizar a documentação, considere:

- **docs-index**: Atualizar o índice de documentação (`$IDE/skills/docs-index/SKILL.md`)
- **arch-c4**: Atualizar diagramas C4 se houver mudanças arquiteturais

---

## Mensagem de Conclusão

```
Documentação atualizada com sucesso!

Resumo:
- Arquivos atualizados: [lista]
- Arquivos criados: [lista]

Próximos passos:
1. Revisar as mudanças
2. Commitar junto com o código
3. Incluir no PR
4. Atualizar índice de docs (opcional: usar skill docs-index)

Lacunas restantes (se houver):
- [lista de itens para futuras atualizações]
```