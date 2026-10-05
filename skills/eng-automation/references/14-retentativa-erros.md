# 14. Retentativa, Recuperação e Tratamento de Erros

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Falhar de modo previsível e se recuperar sem duplicar efeitos nem esconder problemas.

**Conhecimentos:** erros transitórios, permanentes, de negócio e de dados; repetição com recuo exponencial e jitter; limite de tentativas e orçamento de repetição; idempotência e chaves de deduplicação; disjuntor (circuit breaker); pontos de verificação e retomada parcial; compensação (sagas); filas de mensagens mortas e reprocessamento manual; timeouts em tudo; mensagens de erro acionáveis; fonte alterada vs. falha de infraestrutura.

**Princípios:**
- Só repita o que é seguro repetir.
- Retry sem limite e sem jitter amplifica a falha.
- Erro engolido é incidente adiado.

**Fora do escopo:** bibliotecas de repetição e resiliência.

**Pergunta-chave:** A etapa 3 de 5 falha depois de gravar na etapa 2: o que acontece ao repetir?

**Referências:**
- Nygard, *Release It!* (2ª ed.)
- Brooker, *Exponential Backoff and Jitter* (2015)
- Garcia-Molina & Salem, *Sagas* (SIGMOD 1987)
- Helland, *Idempotence Is Not a Medical Condition* (ACM Queue, 2012)
- Beyer et al., *Site Reliability Engineering*, cap. 22 (Addressing Cascading Failures)

**Usam mais:** Automation Engineering, API Automation, Data Ingestion, RPA
