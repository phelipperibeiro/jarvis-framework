# 11. CAPTCHA e Anti-bot: Postura Responsável

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Lidar com CAPTCHAs e detecção de bots detectando, respeitando e escalando, sem contornar o controle.

**Conhecimentos:** finalidade e tipos de CAPTCHA: texto ou imagem, pontuação de risco, desafios invisíveis, prova de trabalho; como serviços detectam automação (conceito): taxa, padrões de acesso, reputação, sinais do cliente; detectar um desafio e interromper com segurança; humano no laço: fila de intervenção e retomada; alternativas oficiais: API, parceria, exportação, feed, acordo de acesso; termos de uso e consentimento; tratamento de falha: recuo, alerta, fonte marcada como bloqueada; registro do evento e decisão de negócio; se a fonte não permite automação, não automatize.

**Princípios:**
- CAPTCHA indica que o dono do serviço não quer acesso automatizado ali: trate como limite, não como obstáculo técnico.
- Antes de qualquer tentativa técnica, pergunte se existe via oficial.
- Falha explícita e escalada valem mais que sucesso obtido contornando controles.

**Fora do escopo:** técnicas e serviços para burlar CAPTCHAs ou evadir detecção de bots.

**Pergunta-chave:** A automação encontrou um desafio: ela para, avisa quem e qual alternativa oficial existe?

**Referências:**
- von Ahn et al., *CAPTCHA: Using Hard AI Problems for Security* (EUROCRYPT 2003)
- OWASP, *Automated Threats to Web Applications*
- W3C, *Inaccessibility of CAPTCHA* (Nota do grupo de trabalho)
- RFC 9309 (Robots Exclusion Protocol)
- Parasuraman, Sheridan & Wickens (2000), humano no laço

**Usam mais:** CAPTCHA & Anti-Bot, Web Automation, RPA, Data Acquisition
