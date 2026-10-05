# 4. Scraping, Crawling e Extração Web

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Coletar páginas e extrair conteúdo em escala, respeitando as regras do site e a carga que se causa.

**Conhecimentos:** scraping (extrair) vs. crawling (descobrir e percorrer) vs. spiders (agentes de rastreamento); fronteira de URLs, profundidade e priorização; normalização e deduplicação de URLs; sitemaps e links canônicos; paginação, rolagem infinita e carregamento incremental; robots.txt como convenção; cortesia: intervalo, concorrência por host, identificação clara do agente; cache e requisições condicionais; extração por seletores e por dados estruturados embutidos; detecção de mudança de layout; guardar o HTML bruto para reprocessar.

**Princípios:**
- Armazene o bruto, extraia depois.
- Rastreie como bom cidadão: identifique-se e limite a carga.
- A extração deve falhar alto quando o layout muda.

**Fora do escopo:** frameworks de rastreamento e técnicas para ocultar a identidade do agente.

**Pergunta-chave:** Se o site mudar o HTML hoje, você descobre pelo monitoramento ou pelo cliente?

**Referências:**
- Olston & Najork, *Web Crawling* (Foundations and Trends in IR, 2010)
- Manning, Raghavan & Schütze, *Introduction to Information Retrieval*, cap. 20
- Heydon & Najork, *Mercator: A Scalable, Extensible Web Crawler* (1999)
- RFC 9309 (Robots Exclusion Protocol)
- W3C, *JSON-LD 1.1*; Schema.org

**Usam mais:** Web Automation, Data Extraction, Data Acquisition
