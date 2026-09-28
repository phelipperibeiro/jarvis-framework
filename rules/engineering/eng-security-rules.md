---
trigger: always_on
env_file: "@/ENV.md"
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras de Seguranca para Engenharia

Regras de seguranca aplicaveis a todo o fluxo de engenharia — do planejamento ao merge.
Toda implementacao deve seguir estas regras por padrao, sem necessidade de invocar o skill `eng-cybersecurity` explicitamente.

---

## Fase: eng.start (Arquitetura)

Ao definir a arquitetura de uma feature, o agente DEVE incluir no `architecture.md`:

1. **Dados sensiveis** — listar PII, dados financeiros e credenciais envolvidas na feature
2. **Superficie de ataque** — mapear endpoints publicos vs. autenticados
3. **Modelo de auth** — definir como autenticacao e autorizacao se aplicam (JWT, session, OAuth, RBAC)
4. **Integracoes externas** — listar e validar que usam TLS; documentar retry e fallback
5. **Estrategia de sanitizacao** — se a feature recebe inputs de usuario, documentar como serao validados

> Se a feature nao envolve nenhum destes pontos, registrar explicitamente: "Sem superficie de seguranca identificada".

---

## Fase: eng.work (Implementacao)

O agente DEVE aplicar as seguintes regras em todo codigo gerado ou revisado:

### Inputs — validar e sanitizar SEMPRE

- Toda entrada externa (body, query params, headers, uploads) validada com schema (Zod, Joi, class-validator)
- Queries SEMPRE parametrizadas — nunca concatenar variaveis em SQL, NoSQL ou command
  ```typescript
  // ❌ PROIBIDO
  db.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${input}'`)
  exec(`ping ${host}`)

  // ✅ OBRIGATORIO
  db.$queryRaw`SELECT * FROM users WHERE email = ${input}`
  execFile('ping', ['-c', '1', validatedHost])
  ```
- HTML e rich text sanitizados com allowlist (DOMPurify ou equivalente)
- Uploads: validar tipo MIME real (nao apenas extensao), tamanho maximo e nome de arquivo
- URLs dinamicas: validar contra allowlist de dominios permitidos (prevenir SSRF)

### Auth — proteger por padrao

- Endpoints protegidos com guard de autenticacao por padrao
- Endpoints publicos devem ser marcados explicitamente (`@Public()`, `@IsPublic()` ou equivalente)
- Autorizacao verificada apos autenticacao — nao basta estar logado, verificar permissao (RBAC, roles, ownership)
- Prevenir IDOR: usuario so acessa seus proprios recursos, a menos que tenha permissao explicita
- Senhas hasheadas com bcrypt (cost >= 12) ou argon2 — nunca MD5, SHA1 ou SHA256 puro
- Tokens JWT com expiracao curta (access: <= 15min), refresh com rotacao

### Secrets — nunca no codigo

- Nunca hardcodar tokens, senhas, API keys, connection strings ou credenciais no codigo
- Usar variaveis de ambiente (`process.env`, `os.environ`, etc.)
- Arquivo `.env` deve estar no `.gitignore` — verificar antes de commitar
- Se um secret for detectado no diff, o agente DEVE alertar o usuario e bloquear o commit

### Output — nao vazar informacao

- Nunca expor stack traces, queries ou detalhes internos em respostas de API em producao
- Erros retornam apenas `code` + `message` generica (sem nome de tabela, coluna ou path interno)
- Logs nunca contem senhas, tokens, PII ou dados de cartao
  ```typescript
  // ❌ PROIBIDO
  logger.info({ password, token, cpf }, 'User login')

  // ✅ CORRETO
  logger.info({ userId, action: 'auth.login.success' }, 'User login')
  ```

### Headers e Configs — seguranca ativa

- CORS restritivo: origins especificas, nunca `origin: '*'` em producao
- Headers de seguranca configurados: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Cookies de sessao: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- Debug mode desabilitado em producao

### Dependencias — supply chain

- Lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) SEMPRE commitado
- Ao adicionar dependencia nova: verificar manutencao ativa, downloads e issues conhecidas
- `npm audit` (ou equivalente) nao deve ter vulnerabilidades HIGH ou CRITICAL antes de abrir PR

---

## Fase: eng.pre-pr (Validacao)

O agente DEVE incluir no checklist de pre-PR as seguintes verificacoes de seguranca:

- [ ] **Secrets scan**: nenhum token, senha ou API key no diff
- [ ] **Dependencias**: `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] **Lockfile**: commitado e atualizado
- [ ] **Inputs**: todo endpoint novo ou alterado valida inputs com schema
- [ ] **Auth guard**: todo endpoint novo tem guard (ou `@Public()` explicito com justificativa)
- [ ] **Outputs**: erros nao vazam detalhes internos

Se o PR toca em areas sensiveis (auth, sessions, RBAC, CORS, CSP, permissoes), o agente DEVE:
1. Adicionar label `security` ao PR
2. Recomendar ao usuario executar `/eng.security-review` antes do merge

---

## Fase: eng.pr (Merge)

- PRs com label `security` devem ter review de seguranca aprovado (manual ou via `/eng.security-review`)
- Nunca aprovar PR com secret detectado no diff — sem excecoes
- Se o PR adiciona endpoint publico, documentar justificativa no description do PR

---

## Fronteira Read-Only (Analise de Seguranca)

Os skills de seguranca (`eng-threat-model`, `eng.security-audit`, `eng-security-triage`) operam em **modo estatico apenas**:

- Leem codigo-fonte, historico git e relatorios fornecidos pelo usuario
- **Nunca** executam, buildam, fuzzam ou modificam o codigo-alvo
- **Nunca** fazem requests de rede a infraestrutura do alvo
- Se o usuario pedir para validar uma ameaca por execucao: declinar e orientar para pipeline de execucao dedicado

---

## Calibracao CDD por Risco

Usar `context-detect` para calibrar a profundidade da analise de seguranca:

| Nivel de risco | Criterio | Estrategia | Tokens (estimado) |
|---|---|---|---|
| **Baixo** — PR comum | Logica de negocio sem superficie sensivel | Single-pass, sem fan-out | ~15k (main thread) |
| **Medio** — PR sensivel | Toca auth, sessions, RBAC, CORS, CSP, PII, fluxo financeiro, criptografia | Fan-out por area + single-vote | ~80k (subagentes isolados) |
| **Alto** — Audit completo | Usuario invoca `/eng.security-audit` explicitamente | Fan-out + multi-voto (3 votos por achado) | ~200k-1M (subagentes isolados) |

O peso do token fica em subagentes isolados — janela da sessao principal nao lota.
PR comum sem risco identificado = zero token extra (so as rules always_on).

---

## Escalacao por POSITION

As regras acima se aplicam a TODOS os engenheiros. A responsabilidade escala com o cargo:

| POSITION | Responsabilidade adicional |
|----------|---------------------------|
| JUNIOR, PLENO | Seguir as regras. Em duvida de seguranca, consultar senior/TL — nao bloqueia a entrega se o risco for registrado |
| SENIOR, SPECIALIST | Seguir + revisar seguranca de PRs do squad quando solicitado |
| TECH LEAD, HEAD | Seguir + garantir que `/eng.security-review` foi executado em PRs com label `security`. Decidir se escala incidente |
| CTO | Seguir + visao de compliance (LGPD/GDPR) e risco organizacional. Aprovar excecoes de seguranca |

---

## Quando escalar para o agente SENTINEL

O agente de engenharia (ATHENA) deve recomendar o uso do agente SENTINEL (`eng.cybersecurity.agent.md`) quando:

- Vulnerabilidade conhecida (CVE) afeta uma dependencia do projeto
- Auditoria de seguranca completa e solicitada
- Incidente de seguranca em producao
- Feature envolve fluxo financeiro, PII ou auth complexa (OAuth, MFA)
- Duvida sobre impacto de seguranca que excede o escopo das regras acima

> O skill `/eng-cybersecurity` pode ser invocado diretamente para consulta rapida sem ativar o agente completo.

---

## Nunca

- Desabilitar verificacao de certificado TLS (`rejectUnauthorized: false`) em producao
- Usar `eval()`, `Function()` ou `child_process.exec()` com input de usuario
- Armazenar senhas em texto plano ou com hash fraco (MD5, SHA1)
- Confiar em validacao apenas no frontend — o backend SEMPRE valida
- Pular secrets scan no pre-PR "porque e so um refactor"
- Aprovar PR com `npm audit` HIGH/CRITICAL sem justificativa documentada

## Sempre

- Defense in depth: nunca confiar em uma unica camada de protecao
- Fail secure: em caso de erro, negar acesso (nao permitir)
- Least privilege: dar apenas as permissoes necessarias
- Registrar eventos de seguranca nos logs (auth success/failure, access denied, config changes)
