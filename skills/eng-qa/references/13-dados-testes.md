# 13. Testes de Dados

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Verificar correção, completude e consistência de dados em pipelines, migrações e bancos.

**Conhecimentos:** validação de esquema e restrições; reconciliação origem–destino (contagens, somas, amostragem); testes de transformação e regras de negócio; dimensões de qualidade: completude, unicidade, validade, atualidade; testes de migração e de reversão; pipelines: idempotência, reprocessamento e dados tardios; integridade referencial e transações; dados de teste: sintéticos, mascarados, subconjuntos; privacidade em dados de teste; regressão de dados e dados de referência; verificações contínuas como monitoramento.

**Princípios:**
- Dado correto no destino é a prova de um pipeline correto.
- Dados de produção em testes exigem mascaramento.
- Teste a regra de negócio, não só o formato.

**Fora do escopo:** ferramentas e linguagens de transformação ou de qualidade de dados específicas.

**Pergunta-chave:** Como você prova que nenhum registro foi perdido, duplicado ou alterado na migração?

**Referências:**
- Wang & Strong, *Beyond Accuracy: What Data Quality Means to Data Consumers* (1996)
- ISO/IEC 25012 (qualidade de dados)
- DAMA International, *DAMA-DMBOK2*
- Reis & Housley, *Fundamentals of Data Engineering*

**Usam mais:** Data Testing, Test Engineering, Integration
