# 10. Resiliência e Arquitetura de Infraestrutura

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Projetar infraestrutura que continua útil quando partes falham.

**Conhecimentos:** redundância e domínios de falha; alta disponibilidade vs. recuperação de desastres; RTO e RPO; backup/restore, pilot light, warm standby, active-active; escala vertical e horizontal; timeouts, retries com backoff, circuit breaker, bulkhead; degradação graciosa; backups testados; consistência em sistemas distribuídos (CAP/PACELC); dimensionamento de capacidade.

**Princípios:**
- Backup sem teste de restauração não é backup.
- Retries sem limite viram a própria falha.
- Custo de disponibilidade cresce de forma não linear.

**Fora do escopo:** topologias proprietárias de um provedor ou produto.

**Pergunta-chave:** Qual é o RPO real do seu sistema, e quando você o testou pela última vez?

**Referências:**
- Nygard, *Release It!* (2ª ed.)
- Kleppmann, *Designing Data-Intensive Applications*
- Hamilton, *On Designing and Deploying Internet-Scale Services* (LISA 2007)
- ISO 22301 (continuidade de negócio)

**Usam mais:** Architecture, SRE, Infrastructure, Systems
