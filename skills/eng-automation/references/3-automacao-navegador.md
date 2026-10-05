# 3. Automação de Navegador

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Controlar navegadores de forma estável para fluxos que só existem na interface web.

**Conhecimentos:** HTML, DOM e renderização por JavaScript; páginas estáticas vs. dinâmicas; protocolo de controle de navegador (WebDriver); seletores estáveis (semântica, papéis acessíveis) vs. frágeis (posição, classes geradas); esperas por condição, não por tempo fixo; estado: cookies, armazenamento local, perfis isolados; navegador sem interface e suas diferenças; iframes, janelas, downloads e uploads; evidências: capturas de tela e rastros; isolamento e limpeza entre execuções; testabilidade acordada com o dono do site.

**Princípios:**
- Espere por condição, não por segundos.
- Seletor ancorado em semântica sobrevive a redesenho.
- Navegador é último recurso quando existe API ou dado estruturado.

**Fora do escopo:** bibliotecas e drivers específicos.

**Pergunta-chave:** Este fluxo realmente exige um navegador ou existe a chamada de rede que ele faz por trás?

**Referências:**
- W3C, *WebDriver* (Recomendação)
- WHATWG, *HTML Living Standard* e *DOM Standard*
- W3C, *WAI-ARIA* (papéis e árvore de acessibilidade)
- Fowler, *PageObject*

**Usam mais:** Web Automation, RPA (navegador), Data Acquisition
