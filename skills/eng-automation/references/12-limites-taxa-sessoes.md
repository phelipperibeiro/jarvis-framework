# 12. Limites de Taxa, Sessões e Cortesia

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Respeitar a capacidade das fontes e manter sessões corretas, estáveis e seguras.

**Conhecimentos:** limitação de taxa: janela fixa e deslizante, token bucket, leaky bucket; respostas 429 e Retry-After; limitação no cliente (throttle) e concorrência controlada; recuo e cortesia por host; cache e requisições condicionais (ETag, If-Modified-Since); cotas do provedor e custo por chamada; sessões: cookies, tokens, expiração e renovação; isolamento de sessão por identidade; logout e invalidação; estado entre execuções; rejeição de sessões compartilhadas inseguras.

**Princípios:**
- Seu limite de taxa deve ser menor que o da fonte.
- Peça menos: cache e condicionais reduzem carga e custo.
- Sessão expirada é caso normal, não exceção.

**Fora do escopo:** parâmetros de limites de serviços específicos.

**Pergunta-chave:** Ao receber 429, a automação espera o tempo indicado ou insiste?

**Referências:**
- RFC 6585 (429 Too Many Requests)
- RFC 9110 (condicionais e Retry-After)
- RFC 6265 (cookies)
- OWASP, *Session Management Cheat Sheet*
- Beyer et al., *Site Reliability Engineering*, cap. 21 (Handling Overload)

**Usam mais:** CAPTCHA & Anti-Bot, Web Automation, API Automation, Automation Engineering
