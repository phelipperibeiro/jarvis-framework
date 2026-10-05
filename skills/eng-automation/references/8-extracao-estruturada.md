# 8. Extração de Dados Estruturados e Semiestruturados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Ler dados estruturados e semiestruturados com fidelidade, esquema e validação.

**Conhecimentos:** formatos tabulares e hierárquicos (CSV, JSON, XML, logs, chave-valor); codificação de caracteres, delimitadores e escape; fusos, formatos de data e números locais; esquema declarado vs. inferido; campos ausentes, nulos e repetidos; normalização e achatamento; validação e quarentena de registros inválidos; evolução de esquema; extração por caminhos em XML e HTML; identificação de duplicatas; testes com amostras reais e sujas.

**Princípios:**
- Declare o esquema; inferir serve apenas para exploração.
- Registro inválido vai para quarentena, nunca some em silêncio.
- Codificação e fuso são fontes clássicas de erro silencioso.

**Fora do escopo:** bibliotecas de leitura e manipulação de tabelas.

**Pergunta-chave:** O que acontece com um registro que chega com um campo novo, outro ausente e datas em outro fuso?

**Referências:**
- RFC 4180 (CSV)
- RFC 8259 (JSON)
- W3C, *XML 1.0*
- The Unicode Standard
- Kleppmann, *Designing Data-Intensive Applications* (codificação e evolução de esquemas)

**Usam mais:** Data Extraction, Data Ingestion, Data Acquisition
