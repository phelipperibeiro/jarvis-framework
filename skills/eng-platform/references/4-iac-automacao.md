# 4. Infraestrutura como Código e Automação

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Tratar infraestrutura como software: versionada, revisada, testada e reproduzível.

**Conhecimentos:** declarativo vs. imperativo; idempotência e convergência; estado desejado vs. real e drift; módulos reutilizáveis; imutabilidade (substituir, não consertar); ambientes efêmeros e paridade; gestão de estado e segredos; revisão por pull request, testes de infraestrutura, policy as code; GitOps; automação de runbooks.

**Princípios:**
- Tudo que se faz duas vezes se automatiza.
- Git é a fonte da verdade; mudança manual é dívida.
- Ambientes devem ser descartáveis e recriáveis.

**Fora do escopo:** sintaxe de uma ferramenta de provisionamento ou de configuração.

**Pergunta-chave:** Se o ambiente de produção sumisse hoje, em quanto tempo e com que confiança você o recria?

**Referências:**
- Morris, *Infrastructure as Code* (2ª ed.)
- Humble & Farley, *Continuous Delivery*
- OpenGitOps, *Principles* v1.0
- Limoncelli et al., *The Practice of System and Network Administration*

**Usam mais:** Automation, DevOps, Cloud, Platform
