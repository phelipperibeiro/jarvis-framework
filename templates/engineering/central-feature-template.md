---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador da funcionalidade no Central docs (estável; não muda entre entregas). Ex.: FEAT-checkout
id: {FEAT-slug}

# Nome da funcionalidade, como as pessoas a chamam. Vai no título.
name: {Nome da funcionalidade}

# Em que ponto a funcionalidade está (lista em rules/product/prod-rules.md).
# Opções: icebox | in_review | backlog | in_progress | in_production | cancelled | deprecated
# in_progress = parte entregue, ainda em evolução | in_production = em produção
# deprecated = esteve em produção e foi descontinuada
status: {um dos valores acima}

# Produto (pasta do Central docs): o WORKSPACE do ENV.md, ou o informado no comando.
product: {produto}

# Data da última consolidação (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}

# Registro da última entrega consolidada (nome do arquivo delivery-*.md). Vazio na carga inicial.
last_delivery: {delivery-AAAA-MM-DD-task_key.md}

# Documentos de trabalho de origem, só como referência (basename). O entendimento NÃO depende deles.
related_docs: {prd-001-nome.md, frd-001-nome.md, ARD-001-nome.md, RFC-001-nome.md}
---

# {Nome da funcionalidade}

> Documento **autossuficiente**: descreve o que está implementado hoje. Se os documentos de origem (PRD, FRD, ARD, RFC) se perderem, este documento basta. Escrito para humanos e para IAs: frases completas, termos definidos, nada implícito.

## 1. Visão geral

{O problema que a funcionalidade resolve, para quem, e o valor entregue. 3 a 6 frases.}

## 2. Comportamento atual

{O que o sistema faz hoje, regra por regra, fluxo por fluxo. Use listas "Quando X, o sistema Y". Inclua os estados de erro e os casos de borda tratados. Critérios de aceite cumpridos.}

## 3. Requisitos não funcionais atendidos

| Requisito | Como foi atendido | Evidência |
|---|---|---|
| {desempenho, segurança, acessibilidade, limites…} | {…} | {teste, medição, arquivo} |

## 4. Arquitetura e decisões

{Componentes envolvidos e como conversam. Cada decisão relevante com o porquê e as alternativas descartadas (ex.: vindas do ARD, do RFC e das questões do architecture.md).}

## 5. Onde está no código

| Parte | Caminho | O que faz |
|---|---|---|
| {módulo, endpoint, comando, job} | `{caminho/arquivo}` | {…} |

## 6. Configuração e dependências

{Variáveis de ambiente (só nomes, nunca valores), flags, serviços externos, migrações, permissões.}

## 7. O que mudou em relação ao especificado

{Diferenças entre o que os documentos de trabalho pediam e o que foi implementado, e por quê. "Nenhuma" se não houver.}

## 8. Fora do escopo e limitações conhecidas

{O que a funcionalidade não faz (de propósito ou por limitação), com o motivo. Follow-ups abertos, com card.}

## 9. Testes e evidências

{Como a funcionalidade é verificada: suítes, cenários cobertos, testes manuais. Onde ficam.}

## 10. Histórico de entregas

| Data | Card | PR/MR | Autores | Resumo | Registro |
|---|---|---|---|---|---|
| {AAAA-MM-DD} | [{TASK_KEY}]({URL do card}) | [#{n}]({URL do PR/MR}) | {nomes} | {1 frase} | [delivery-…](../../engineering/{produto}/delivery-….md) |

## 11. Glossário e referências

- **{Termo}:** {definição}
- Cards: {TASK_KEY com URL}
- PRs/MRs: {números com URL}
- Documentos de origem (referência): {basenames}
