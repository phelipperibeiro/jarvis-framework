---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador único do ARD, em sequência (ex.: ARD-001). Vai no nome do arquivo.
id: [ARD-xxx]

# Título da arquitetura. Vai no título e, em kebab-case, no nome do arquivo.
name: [Título da Arquitetura]

# Versão do documento (X.Y.Z). Atualize a cada alteração.
version: [1.0.0]

# Em que ponto este ARD está no ciclo de vida.
# Opções: proposed | in_progress | in_review | approved
# proposed = proposta, ainda em discussão | in_progress = arquitetura em desenvolvimento
# in_review = em validação com os revisores | approved = finalizada e aprovada
status: [um dos valores acima]

# Documentos relacionados: RFC (proposta técnica), FRD (requisitos funcionais), PRD (requisitos de produto).
related: [RFC-xxx, FRD-xxx, PRD-xxx]

# Data de criação (YYYY-MM-DD).
created_at: [YYYY-MM-DD]

# Data da última alteração (YYYY-MM-DD).
updated_at: [YYYY-MM-DD]

# Quem criou o documento (Tech Lead ou arquiteto responsável).
created_by: [nome]

# Quem editou o documento por último.
last_editor: [nome]
---

# 🧱 ARD Template — Architecture Requirement Document

**Arquivo:** $ENG_DOCS/ARD/ARD-xxx-nome-da-arquitetura.md

---

## 🏗️ ARD-[número] — [Título da Arquitetura]

**Revisores:** [Chapter Leads, Eng. de Plataforma, etc.]

> Status, versão, datas, autor e documentos relacionados ficam no frontmatter (topo do arquivo).

---

### 🔗 Referência ao PRD (obrigatório quando existir)

- **Referência:** [PRD-{id} – {Título}](../../product/prd-{id}-{nome}/prd-{id}-{nome}.md)
- **Requisito citado:** [RQT-{n}](../../product/prd-{id}-{nome}/frd-{id}-{nome}.md#{âncora-do-título}) (link com a âncora do título real, `rules-on-demand/doc-links-rules.md`)

#### Legenda (tipos de requisito)

- **RF**: Requisito Funcional (comportamento/capacidade do sistema)
- **NFR**: Requisito Não Funcional (qualidade: performance, disponibilidade, segurança, etc.)
- **Restrição**: Limitação obrigatória (técnica/negócio/infra/processo) que guia a solução
- **SLA**: Service Level Agreement (meta/compromisso mensurável de nível de serviço)
- **Métrica**: Indicador de sucesso/monitoramento (KPI/SLI) usado para medir resultado

#### Requisitos do PRD consumidos diretamente por este ARD

| ID | Tipo (RF/NFR/Restrição/SLA/Métrica) | Origem (FRD/PRD) | Descrição | Como impacta a arquitetura |
|----|-------------------------------------|------------------|-----------|----------------------------|

### 🎯 Objetivo
<!-- Descreva o propósito e metas técnicas -->

---

### 🚫 O que não é papel deste ARD

- Redefinir objetivo de produto
- Mudar regra de negócio
- Criar feature nova “porque tecnicamente é melhor”
- Discutir roadmap ou priorização

> Se algo disso aparecer, é sinal de PRD mal definido ou incompleto. Pausar e validar com Produto/usuário antes de seguir.

---

### 🧠 Premissas e Restrições

- Deve operar dentro do cluster GKE atual  
- Sem dependência de serviços externos  
- Limite de CPU total de 6vCPU

---

### ⚙️ Desenho da Arquitetura

```mermaid
graph TD
A[Prometheus] -->|export metrics| B[Controller]
B -->|ajusta concorrência| C[RabbitMQ]
C --> D[Workers]
B -->|salva estado| E[Redis]
```

---

### 🧩 Componentes Principais

| Componente | Função | Responsável |
|-------------|--------|--------------|

---

### 🔄 Fluxos de Dados

| Fluxo | Origem | Destino | Dados | Garantias (ordem/entrega) |
|------|--------|---------|------|----------------------------|

---

### 🔌 Integrações

| Integração | Tipo | Direção | Autenticação/Autorização | Observações |
|----------|------|---------|---------------------------|-------------|

---

### 📜 Contratos (APIs, eventos, filas)

#### APIs

| Endpoint | Método | Request | Response | Erros | Autenticação | Observações |
|----------|--------|---------|----------|-------|--------------|-------------|

#### Eventos

| Evento | Publisher | Consumers | Schema/Versão | Chave de idempotência | Observações |
|-------|-----------|-----------|---------------|------------------------|-------------|

#### Filas / Tópicos

| Recurso | Tipo | Producer | Consumers | DLQ/Retry | Ordenação | Observações |
|---------|------|----------|-----------|----------|-----------|-------------|

---

### 🔐 Segurança e Compliance

- Autenticação via Service Account GCP  
- Secrets gerenciados pelo Secret Manager  
- Logs e métricas auditáveis no Stackdriver

---

### 📊 Métricas e Observabilidade

- queue_backlog_total  
- rebalance_iterations  
- consumer_restarts

---

### ⚖️ Escalabilidade e Resiliência

- Controlador roda em pod único com HPA mínimo 1 / máximo 3  
- Retry backoff exponencial  
- Fallback para configuração manual via Redis

---

### 🧠 Decisões Técnicas e Trade-offs

| Decisão | Referência no PRD (RF/NFR/Restrição/SLA/Métrica) | Alternativas consideradas | Trade-offs | Decisão final |
|--------|-----------------------------------------------|----------------------------|------------|--------------|

---

### ⚔️ Riscos e Mitigações

| Risco | Mitigação |
|-------|------------|

---

### ✅ Critérios de Sucesso

- Redistribuição dinâmica < 30s  
- Nenhum downtime detectado  
- Redução ≥ 25% no tempo médio de fila  
- Logs e métricas funcionais

---

### 🧩 Roadmap Técnico

| Etapa | Responsável | Status |
|-------|--------------|--------|

---

### 🏗️ Como vamos construir isso de forma segura, escalável e sustentável?

#### Segurança

| Medida | Como aplicar | Validação |
|--------|-------------|----------|

#### Escalabilidade

| Medida | Como aplicar | Validação |
|--------|-------------|----------|

#### Sustentabilidade (manutenção e evolução)

| Medida | Como aplicar | Validação |
|--------|-------------|----------|

---

### 🧩 Anexos

- [RFC-xxx](../RFC/RFC-xxx.md)  
- [AVD-xxx](../AVD/AVD-xxx.md)

---

### 🏁 Conclusão
<!-- Resumo da decisão arquitetural final -->
