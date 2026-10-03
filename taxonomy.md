# Taxonomia Organizacional
Define a estrutura organizacional, vocabulário e configurações do framework Jarvis

> **📝 Como usar**: Este arquivo define as opções válidas para variáveis do ENV.md.
> Edite este arquivo para customizar as opções da sua organização antes de instalar o framework.
>
> **Domínio de Email**: Configure `DOMAIN:` para validar emails corporativos (ex: `DOMAIN: suaempresa.com.br`)

---

## 🏢 Squads (Times de Desenvolvimento)

Squads são times multidisciplinares. Customize via `/taxonomy`. Skills e agentes técnicos (RPA, Data, QA, etc.) **não** dependem destes nomes.

### CORE
channel_id:
board_code:
modules:
Time principal. Adicione squads da sua organização com `/taxonomy add SQUADS`.

---

## 🎯 Hubs (Áreas Técnicas)

Hubs representam especialidades técnicas dentro da organização.

### AI
Inteligência Artificial, Jarvis, Chatbots, n8n, agents

### FRONTEND
Desenvolvimento de interfaces de usuário, web e mobile

### BACKEND
Desenvolvimento de APIs, serviços, microsserviços e integrações

### QA
Quality Assurance, testes automatizados, testes manuais e garantia de qualidade

### DATA
Engenharia e análise de dados, pipelines, BI e operações de dados, Machine Learning, Data Science e modelos preditivos

### FULLCYCLE
Desenvolvedor que atua em todas as camadas técnicas (frontend, backend e, quando necessário, dados) do início ao fim de uma entrega — em qualquer verificação de HUB, é tratado como coringa/superusuário: satisfaz qualquer HUB exigido, nunca bloqueado por applies_to HUB específico
---

## 👤 Positions (Cargos e Senioridades)

Níveis de senioridade e cargos técnicos na organização.

### HEAD
Líder de área (Engenharia, Produto, Vendas)
- Responsável por uma área técnica ou de negócio
- Gestão de pessoas e direção técnica/produto
- Interface entre squads e liderança executiva

### JUNIOR
Desenvolvedor Júnior (0-2 anos de experiência)
- Aprendendo tecnologias e processos
- Pede ajuda quando precisar — sem gate obrigatório de TL/PM
- Foco em desenvolver habilidades técnicas
- No fluxo downstream: dono ponta-a-ponta do card que assumiu (puxar, implementar, MR, validar, deploy)

### PLENO
Desenvolvedor Pleno (2-4 anos de experiência)
- Autonomia em tarefas individuais
- Contribui para decisões técnicas
- Mentoría desenvolvedores júnior
- No fluxo downstream: dono ponta-a-ponta do card que assumiu

### SENIOR
Desenvolvedor Sênior (4+ anos de experiência)
- Alta autonomia técnica
- Toma decisões arquiteturais
- Mentoria e liderança técnica
- No fluxo downstream: dono ponta-a-ponta do card que assumiu

### TECH LEAD
Líder técnico de time ou squad
- Responsável por direção técnica do time
- Coordena desenvolvimento e arquitetura
- Interface entre time e stakeholders
- No fluxo downstream: apoia o time. Não é gate — o profissional que assumiu o card conduz ponta-a-ponta. TL desbloqueia e cobre quando pedido.

### SPECIALIST
Especialista em área técnica ou disciplina específica
- Expert em domínio particular (segurança, performance, etc.)
- Consultoria técnica para times
- Define padrões e melhores práticas
- No fluxo downstream: dono ponta-a-ponta do card que assumiu

### QA-ENGINEER
Engenheiro de Quality Assurance
- Planejamento e execução de testes (manuais e automatizados)
- Reporte e rastreamento de bugs
- Validação técnica de entregas antes da aprovação de produto
- No fluxo downstream: apoia o DEV na validação — não move cards, apenas executa e reporta

### PM
Product Manager
- Gestão de produto e roadmap
- Define prioridades e features
- Interface com stakeholders de negócio
- No fluxo downstream: pode priorizar, aceitar e também assumir/conduzir um card ponta-a-ponta. Aceite apoia — não trava o owner.

### TPM
Technical Product Manager
- Product Manager com foco técnico
- Ponte entre produto e engenharia
- Decisões de produto com viés técnico
- No fluxo downstream: pode priorizar, aceitar e também assumir/conduzir um card ponta-a-ponta. Aceite apoia — não trava o owner.

### GPM
Group Product Manager
- Gerencia múltiplos PMs
- Visão estratégica de produto
- Coordenação entre diferentes áreas
- No fluxo downstream: pode priorizar, aceitar e também assumir/conduzir um card ponta-a-ponta. Aceite apoia — não trava o owner.

### QUALITY_CHAMPION
Designação secundária para devs com função parcial de qualidade dentro do squad.
Não é uma posição de senioridade — o dev mantém seu cargo (JUNIOR, PLENO, SENIOR, etc.).
Registrado no campo Posição do `members.md` junto com o cargo principal.
- Responsável por cobertura de testes em features de baixo/médio risco do squad
- Executa quality gates e orienta outros devs via eng-qa-dev-guide
- NÃO substitui QA em features críticas, decisões de bloqueio ou sign-off de release
- Dedicação típica: ~30% do tempo em atividades de qualidade
- No fluxo downstream: apoia o QA-ENGINEER na cobertura — não toma decisões de bloqueio

### CTO
Chief Technology Officer
- Direção estratégica de tecnologia
- Responsável por toda organização técnica
- Decisões de alto nível sobre arquitetura e stack

### GENERALIST
Profissional que acumula funções de outras posições (SPECIALIST, PM, dev, QA etc.) conforme a demanda — típico de times pequenos sem gente dedicada por função
- Cargo principal (como SPECIALIST), não designação secundária (diferente de QUALITY_CHAMPION)
- Transita entre ENGINEERING e PRODUCT — não fica restrito a uma única área
- Em qualquer verificação de POSITION ou AREA, é tratado como coringa/superusuário: satisfaz qualquer valor exigido
- No fluxo downstream: dono ponta-a-ponta do card que assumiu, com autonomia equivalente a TECH LEAD/staff (ver eng-rules.md)

---

## 📊 Areas (Áreas de Negócio)

Áreas funcionais da organização.

### ENGINEERING
prefix: eng
Área de Engenharia
- Desenvolvimento de software
- Infraestrutura e operações
- Inovação tecnológica

### PRODUCT
prefix: prod
Área de Produto
- Gestão de produto
- Discovery e research
- Roadmap e estratégia

DOMAIN:

---

## 🌐 Domain (Domínio de Email Corporativo)

Define o domínio de email corporativo para validação e padronização de emails.

**ADICIONAR APENAS UMA LINHA APÓS AREAS:**

```markdown
DOMAIN:
```

### Como Funciona
- Todos os emails devem terminar com `@DOMAIN`
- Usado na validação de ENV.md durante `/init-jarvis`
- Garante que apenas emails corporativos sejam registrados
- Exemplo: `pedro@domain.com.br`, `ana@domain.com.br`

### Para Open Source (Sem Restrição)
Deixe em branco ou remova a linha:

```markdown
DOMAIN:
```

---

## 📝 Como Adicionar Novas Opções

Para adicionar uma nova opção:

1. Adicione o nome em MAIÚSCULAS sob a categoria apropriada
2. Inclua os campos estruturados (se aplicável)
3. Inclua uma breve descrição
4. Execute `/init-jarvis` - as novas opções aparecerão automaticamente

**Exemplo — Squad com channel_id e modules:**
```markdown
### MOBILE
channel_id: C0123456789
board_code: MOB
modules: app-ios, app-android, push-notification, deep-link
Time focado em desenvolvimento mobile nativo (iOS/Android)
```

> Membros da organização são gerenciados em `members.md`.

**Exemplo — Area com prefix:**
```markdown
### DESIGN
prefix: design
Área de Design, UX e pesquisa com usuários
```

> Use `/taxonomy-manager add` para adicionar opções com validação automática.

---

## 🔄 Sincronização

Quando este arquivo é atualizado:
- Execute `/init-jarvis` para recriar ENV.md com novas opções
- Ou edite manualmente `$IDE/ENV.md` se já existir
- As validações nos workflows usarão automaticamente as novas opções

---

## ⚠️ Notas Importantes

1. **Mantenha nomes sem espaços**: Use `-` ou `_` para separar palavras
   - ✅ `CORE`
   - ❌ `ENGINEERING CORE`

2. **Use MAIÚSCULAS**: Facilita padronização e busca
   - ✅ `SENIOR`
   - ❌ `Senior` ou `senior`

3. **Evite caracteres especiais**: Apenas letras, números, `-` e `_`
   - ✅ `RPA`, `TECH-LEAD`
   - ❌ `RPA!`, `TECH/LEAD`

4. **Mantenha consistência**: Uma vez definido, evite mudar nomes existentes
   - Impacta ENV.md de projetos existentes
   - Se necessário mudar, comunique toda a organização

5. **Domínio de Email**: Configure uma única vez no início
   - ✅ `DOMAIN: seudominio.com.br` (validará emails @seudominio.com.br)
   - ✅ `DOMAIN:` (em branco para sem restrição)
   - ❌ Múltiplos domínios (use apenas um)
