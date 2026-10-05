# 13. Agendamento e Orquestração

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Disparar e encadear automações no momento certo, com dependências explícitas.

**Conhecimentos:** gatilhos: tempo, evento, arquivo, dependência, manual; expressões de agenda, fusos e horário de verão; grafo de dependências (DAG) e ordem de execução; execução atrasada, perdida ou sobreposta; janelas de dados e reprocessamento (backfill); filas de trabalho e paralelismo; prioridade e limites de recursos; versionamento e promoção de fluxos; idempotência por execução; parada e retomada; calendário de negócio (feriados).

**Princípios:**
- Toda execução tem identidade e janela de dados definidas.
- Duas execuções simultâneas não podem corromper o resultado.
- Todo horário agendado declara o fuso.

**Fora do escopo:** agendadores e orquestradores específicos.

**Pergunta-chave:** Se o agendador ficar fora por 6 horas, o que roda ao voltar e em que ordem?

**Referências:**
- Beyer et al., *Site Reliability Engineering*, cap. 24 (Distributed Periodic Scheduling with Cron)
- Reis & Housley, *Fundamentals of Data Engineering* (orquestração)
- Burns, *Designing Distributed Systems*
- Kleppmann, *Designing Data-Intensive Applications* (processamento em lote)

**Usam mais:** Automation Engineering, Data Ingestion, RPA
