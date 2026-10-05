# 7. Observabilidade e Monitoramento

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Responder a perguntas novas sobre o sistema sem precisar alterá-lo.

**Conhecimentos:** métricas, logs, traces e eventos; cardinalidade e custo; golden signals, RED e USE; SLI e SLO; alerta por sintoma, não por causa; alertas acionáveis vs. ruído; correlação por identificadores de contexto; amostragem e retenção; dashboards por pergunta; instrumentação padronizada.

**Princípios:**
- Alerta só se exige ação humana imediata.
- Meça o que o usuário sente, não só o que a máquina faz.
- Contexto compartilhado entre sinais vale mais que volume.

**Fora do escopo:** configuração de uma ferramenta de coleta, armazenamento ou visualização.

**Pergunta-chave:** O alerta das 3h indica uma ação humana imediata ou pode esperar?

**Referências:**
- Beyer et al., *Site Reliability Engineering*, cap. 6
- Majors, Fong-Jones & Miranda, *Observability Engineering*
- Gregg, método USE
- Especificação OpenTelemetry

**Usam mais:** SRE, DevOps, DevEx, Systems
