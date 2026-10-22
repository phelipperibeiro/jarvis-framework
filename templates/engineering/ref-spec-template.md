---
# Identificador único da spec de referência, em sequência (ex.: SPEC-001). Vai no nome do arquivo.
id: [SPEC-xxx]

# Título da spec. Vai no título e, em kebab-case, no nome do arquivo.
name: [Título da Especificação]

# Versão do documento (X.Y.Z, SemVer). Major: muda o que é exigido e quebra a aderência de quem já
# segue a spec. Minor: acrescenta regra ou contrato sem quebrar. Patch: corrige texto ou exemplo.
version: [1.0.0]

# Em que ponto esta spec está no ciclo de vida.
# Opções: proposed | in_review | approved | superseded
# proposed = proposta, ainda em discussão | in_review = em validação com os revisores
# approved = vigente: implementações devem segui-la | superseded = substituída por outra spec (cite qual em related)
status: [um dos valores acima]

# Documentos de origem e relacionados: RFC (a decisão), ARD (a arquitetura), outras SPECs.
# Opcional: uma spec de referência pode não ter origem (ver "Checagem de RFC" no modo referência).
related: [RFC-xxx, ARD-xxx]

# Data de criação (YYYY-MM-DD).
created_at: [YYYY-MM-DD]

# Data da última alteração (YYYY-MM-DD).
updated_at: [YYYY-MM-DD]

# Quem criou o documento.
author: [nome]

# Quem revisa ou aprova a spec.
reviewers: [nomes]
---

# 📐 SPEC-[número] — [Título da Especificação]

**Arquivo:** $ENG_DOCS/SPEC/SPEC-xxx-nome-da-especificacao.md

> Especificação técnica de **referência**: documento normativo, sem card de origem e sem quebra em subtarefas. Não decide trade-off (isso é do RFC) nem desenha a arquitetura (isso é do ARD): resolve o que ficou em aberto e define como as implementações devem ser feitas.
> Status, versão, datas, autor e documentos relacionados ficam no frontmatter (topo do arquivo).

---

## 1. Contexto

{Por que esta spec existe. Qual problema ela resolve, de onde ela parte (RFC/ARD de origem, se houver) e o que acontece hoje sem ela. Defina siglas e termos na primeira vez em que aparecerem.}

## 2. Escopo normativo

**Esta spec rege:**

- {o que as implementações precisam seguir}

**Esta spec não rege:**

- {o que fica fora, e onde está a regra, se existir}

## 3. Decisões resolvidas

> Cada decisão aponta a **origem**: o RFC ou ARD que a tomou, ou "resolvida aqui" quando esta spec a resolve. Uma decisão "resolvida aqui" que escolhe entre alternativas com trade-off relevante é sinal de que faltou um RFC.

| # | Decisão | Resolução | Origem |
|---|---------|-----------|--------|
| D1 | {o que estava em aberto} | {como fica} | {RFC-xxx \| ARD-xxx \| resolvida aqui} |

## 4. Contratos e convenções

{Contratos (interfaces, eventos, filas, schemas), convenções de nome, topologia e formatos. Seja específico: nomes reais, campos, tipos e exemplos. Contrato de terceiro sem fonte confirmada fica como `[A DEFINIR — contrato pendente com {time/parceiro}]`.}

### 4.1 {Contrato ou convenção}

{descrição, exemplo e regras}

## 5. Critérios de aderência

> Como saber se uma implementação segue esta spec. Cada critério é verificável.

- [ ] {critério verificável 1}
- [ ] {critério verificável 2}

## 6. Fases de implementação (opcional)

{Se a adoção tiver ordem (ex.: primeiro os produtores, depois os consumidores), descreva as fases e o critério de cada uma. Sem subtarefas nem estimativas: isso é do modo card.}

## 7. Versionamento e compatibilidade

{O que muda de uma versão para outra, o que é considerado quebra (major) e como as implementações existentes migram.}

## 8. Referências

- {RFC/ARD de origem, outras SPECs, código de referência no projeto, documentação externa}

---

## Histórico de revisões

| Versão | Data | Autor | Mudança |
|--------|------|-------|---------|
| 1.0.0 | {YYYY-MM-DD} | {nome} | Criação do documento |
