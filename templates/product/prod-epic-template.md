---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador único, em sequência (ex.: EPIC-001). Vai no nome do arquivo e nos campos related_* de outros documentos.
id: {EPIC-001}

# Nome curto do documento. Vai no título e, em kebab-case, no nome do arquivo.
name: {nome desse épico}

# Versão do documento (X.Y.Z). Atualize a cada alteração.
version: {X.Y.Z - atualizar sempre que houver alteração}

# Em que ponto este documento está no ciclo de vida (lista em rules/product/prod-rules.md).
# Opções: icebox | in_review | backlog | in_progress | in_production | cancelled | deprecated
# icebox = ideia aguardando priorização | in_review = sendo estudado ou revisado | backlog = definido, aguardando implementação
# in_progress = em desenvolvimento | in_production = em produção
# cancelled = cancelado antes de ser entregue | deprecated = esteve em produção e foi descontinuado
status: {um dos valores acima}

# Link do card no task manager do projeto (TASK_MANAGER no ENV.md). Remova a linha se não houver.
task_link: {URL referêncial no $TASK_MANAGER - se existir. Se não, ignore essa linha}

# PRD relacionado (Product Requirements Document: o problema e o que vamos construir).
related_prd: {path PRD relacionado, exemplo /master-docs/product/prd-001.md}

# FRD relacionado (Functional Requirements Document: o comportamento detalhado de uma funcionalidade).
related_frd: {path FRD relacionado, exemplo /master-docs/product/frds/frd-001.md}

# Discovery de origem (o rascunho da ideia, anterior ao PRD). Remova a linha se não houver.
related_discovery: {path do discovery de origem, exemplo $DISCOVERIES_DOCS/discovery-001-nome.md. Se não existir, ignore essa linha}

# Data de criação (YYYY-MM-DD).
created_at: {YYYY-MM-DD}

# Data da última alteração (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}

# Quem criou o documento.
created_by: {nome de quem criou esse doc}

# Quem editou o documento por último.
last_editor: {nome de quem editou por último}
---

# {id}: {name}

**Lançamento**: [Nome do lançamento]  

## Contexto
[Antecedentes: por que esse épico é importante, como ele se encaixa no lançamento, recursos relacionados]

[Que problema do usuário isso resolve?]  

## Critérios de aceitação
[Critérios de aceitação de alto nível para o épico em formato de marcadores]

## Histórias Relacionadas

Este épico só é considerado concluído quando as histórias relacionadas terminam.

**STORY-001**: [Título da história/tarefa]
- **História do usuário**: Como [usuário], quero [capacidade], para que [benefício]
- **Prioridade**: [Alta/Média/Baixa]

**STORY-002**: [Título da história/tarefa]
[Mesma estrutura]

**STORY-003**: [Título da história/tarefa]
[Mesma estrutura]

## Considerações Técnicas Gerais
- [Nota técnica 1]
- [Nota técnica 2]

## Garantia de Qualidade

**Teste de Unidade**:
- [Meta de cobertura]

**Teste de integração**:
- [Escopo]
- [Linha do tempo]

**Teste de aceitação do usuário**:
- [Quem]
- [Quando]
- [Critérios]

**Teste de desempenho**:
- [Métricas]
- [Alvos]

## Definição de Concluído (por história)

- [ ] Código completo e revisado
- [ ] Testes unitários escritos e aprovados
- [ ] Testes de integração aprovados
- [ ] Documentação atualizada
- [ ] Revisão de projeto aprovada
- [ ] Proprietário do produto aceito
- [ ] Implantado no teste
- [ ] Controle de qualidade assinado

## Assets de design
- [Link para mockups]
- [Link para protótipos]