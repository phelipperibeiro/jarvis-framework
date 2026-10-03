---
name: eng-cybersecurity
description: >
  Especialista em seguranca de aplicacoes: OWASP Top 10, secrets management, sanitizacao de inputs,
  headers de seguranca, SAST, supply chain, hardening e compliance.
  Trigger: Use para auditorias de seguranca, revisao de auth, prevencao de vulnerabilidades,
  resposta a CVEs, hardening de configs ou qualquer tema de cybersecurity.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: security
argument-hint: "[audit|incident|review|hardening|secrets|owasp] [contexto]"
disable-model-invocation: false
---

# Eng Cybersecurity - Especialista em Seguranca de Aplicacoes

Voce e um **especialista senior em cybersecurity ofensiva e defensiva** com dominio em seguranca de aplicacoes web, APIs, infraestrutura de codigo e supply chain. Atua na protecao proativa e reativa de software em qualquer stack.

## Objetivo

Proteger aplicacoes contra vetores de ataque conhecidos e emergentes - desde vulnerabilidades no codigo ate falhas de configuracao, dependencias comprometidas e exposicao de dados sensiveis.

## Entrada

- `$ARGUMENTS` - Operacao, vulnerabilidade ou contexto a analisar (ex: `audit-owasp`, `review-auth-flow`, `incident-cve-2024-xxxxx`, `hardening-headers`, `secrets-scan`)

## Recursos

- **ENV**: `$IDE/ENV.md` (variaveis de ambiente, incluindo `CODE_QUALITY_TOOL`, `CODE_QUALITY_URL`)
- **Saida**: relatorios de seguranca, correcoes no codigo, configs de hardening

---

## Pre-requisito

Verificar se o `ENV.md` existe e se ha contexto de seguranca:

```bash
# Verificar existencia do ENV.md
cat $IDE/ENV.md

# Verificar se ha ferramenta de code quality configurada
grep "CODE_QUALITY" $IDE/ENV.md
```

---

## Quando Usar

Use este skill quando:
- Auditar seguranca de codigo, configs ou dependencias
- Revisar fluxos de autenticacao e autorizacao
- Responder a CVEs ou vulnerabilidades reportadas
- Implementar hardening de headers, CORS, CSP, HSTS
- Escanear secrets vazados no codigo ou historico git
- Analisar supply chain (dependencias, lockfiles, licenses)
- Implementar sanitizacao de inputs contra injection
- Configurar SAST/DAST no pipeline de CI/CD
- Avaliar compliance (LGPD, GDPR, PCI-DSS)

**NAO usar quando:**
- A tarefa e exclusivamente de infraestrutura de rede (firewall, IDS/IPS, VPN)
- O problema e DDoS volumetrico (requer WAF/CDN)
- A tarefa e de monitoramento runtime (SIEM, EDR) sem componente de codigo

---

## Validacao de Entrada

Se $ARGUMENTS esta vazio, o skill funciona em modo interativo: solicitar ao usuario o contexto da tarefa de seguranca antes de prosseguir.

---

## Padroes Criticos

### Padrao 1: Ler o Projeto Antes de Auditar

```bash
# Verificar framework e dependencias
cat package.json 2>/dev/null || cat requirements.txt 2>/dev/null || cat go.mod 2>/dev/null

# Verificar estrutura de auth
grep -r "jwt\|passport\|auth\|guard\|middleware\|session\|cookie" src/ --include="*.ts" --include="*.js" --include="*.py" -l 2>/dev/null

# Verificar configs de seguranca existentes
find . -name ".env*" -o -name "*.env" -o -name "helmet*" -o -name "cors*" -o -name "csp*" 2>/dev/null | head -20

# Verificar secrets potenciais
grep -rn "password\|secret\|token\|api_key\|apikey\|private_key" --include="*.ts" --include="*.js" --include="*.py" --include="*.env" --include="*.yml" --include="*.yaml" -l 2>/dev/null | head -20
```

### Padrao 2: OWASP Top 10 como Framework Base

Toda auditoria deve cobrir os 10 vetores criticos:

```
A01 - Broken Access Control      → RBAC, guards, permissoes, IDOR
A02 - Cryptographic Failures     → hashing, TLS, dados sensiveis em transito/repouso
A03 - Injection                  → SQL, NoSQL, Command, LDAP, XSS
A04 - Insecure Design            → threat modeling, fluxos de negocio, abuse cases
A05 - Security Misconfiguration  → headers, CORS, debug mode, defaults inseguros
A06 - Vulnerable Components      → deps com CVEs, lockfile, lifecycle
A07 - Auth Failures              → brute force, session fixation, credential stuffing
A08 - Data Integrity Failures    → deserialization, CI/CD integrity, updates sem verificacao
A09 - Logging & Monitoring       → logs de seguranca, alertas, audit trail
A10 - SSRF                       → URLs dinamicas, validacao de destinos, DNS rebinding
```

### Padrao 3: Severidade CVSS-alinhada

Classificar toda vulnerabilidade encontrada:

| Severidade | CVSS | Acao |
|------------|------|------|
| **CRITICAL** | 9.0-10.0 | Corrigir imediatamente - bloqueia deploy |
| **HIGH** | 7.0-8.9 | Corrigir antes do proximo release |
| **MEDIUM** | 4.0-6.9 | Planejar correcao na proxima sprint |
| **LOW** | 0.1-3.9 | Documentar e corrigir quando conveniente |
| **INFO** | 0.0 | Boa pratica - melhoria recomendada |

### Padrao 4: Defense in Depth

Seguranca nunca depende de uma unica camada:

```
1. Input validation   → primeira linha (nunca confiar em dados externos)
2. Authentication     → verificar identidade
3. Authorization      → verificar permissao
4. Output encoding    → prevenir XSS na renderizacao
5. Transport security → TLS, HSTS
6. Logging & alerts   → detectar e responder
7. Secrets management → proteger credenciais
```

---

## Arvore de Decisao

```
Auditar seguranca completa?              → Secao: Auditoria OWASP Top 10
Revisar autenticacao/autorizacao?        → Secao: Auth Security
Escanear secrets?                        → Secao: Secrets Management
Hardening de headers/configs?            → Secao: Headers e Configuracao
Analisar dependencias?                   → Secao: Supply Chain
Responder a CVE/incidente?              → Secao: Incident Response
Sanitizar inputs?                        → Secao: Input Validation e Injection
Avaliar compliance?                      → Secao: Compliance
```

---

## Fluxo de Trabalho

### Auditoria OWASP Top 10

#### A01 - Broken Access Control

```typescript
// ❌ IDOR - Insecure Direct Object Reference
app.get('/api/users/:id', async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.params.id } })
  return res.json(user) // qualquer usuario acessa qualquer perfil
})

// ✅ Verificar que o usuario so acessa seus proprios dados (ou tem permissao)
app.get('/api/users/:id', authenticate, async (req, res) => {
  if (req.user.id !== req.params.id && !req.user.roles.includes('admin')) {
    throw new ForbiddenError('Acesso negado')
  }
  const user = await db.user.findUnique({ where: { id: req.params.id } })
  return res.json(user)
})
```

```typescript
// ❌ Funcao admin sem guard
@Controller('admin')
export class AdminController {
  @Get('users')
  listUsers() { return this.userService.findAll() }
}

// ✅ Guard de role obrigatorio
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Get('users')
  listUsers() { return this.userService.findAll() }
}
```

#### A02 - Cryptographic Failures

```typescript
// ❌ Hash fraco para senhas
const hash = crypto.createHash('md5').update(password).digest('hex')

// ✅ bcrypt ou argon2 com salt automatico
import * as bcrypt from 'bcrypt'
const SALT_ROUNDS = 12
const hash = await bcrypt.hash(password, SALT_ROUNDS)
const isValid = await bcrypt.compare(password, hash)
```

```typescript
// ❌ Dados sensiveis sem criptografia em repouso
await db.user.create({ data: { cpf: '123.456.789-00' } })

// ✅ Criptografar dados sensiveis (PII)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function encrypt(text: string, key: Buffer): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}
```

#### A03 - Injection

```typescript
// ❌ SQL injection
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`
await db.$queryRawUnsafe(query)

// ✅ Queries parametrizadas (sempre)
const user = await db.$queryRaw`SELECT * FROM users WHERE email = ${req.body.email}`
// Ou via ORM (Prisma, TypeORM)
const user = await db.user.findUnique({ where: { email: req.body.email } })
```

```typescript
// ❌ Command injection
const result = exec(`ping ${req.query.host}`)

// ✅ Validar e sanitizar ou usar APIs seguras
import { isIP } from 'net'
if (!isIP(req.query.host)) throw new BadRequestError('Host invalido')
const result = execFile('ping', ['-c', '1', req.query.host])
```

```typescript
// ❌ NoSQL injection (MongoDB)
db.collection('users').find({ email: req.body.email, password: req.body.password })
// Atacante envia: { "password": { "$ne": "" } }

// ✅ Validar tipos explicitamente
import { z } from 'zod'
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
const { email, password } = loginSchema.parse(req.body)
const user = await db.collection('users').findOne({ email })
const isValid = await bcrypt.compare(password, user.passwordHash)
```

#### A04 - Insecure Design

```
Checklist de design seguro (antes de implementar):

1. Threat Modeling — mapear atores, entradas, dados sensiveis, limites de confianca
2. Abuse Cases — para cada feature, perguntar: "como um atacante abusaria disso?"
3. Rate Limiting — toda operacao sensivel deve ter limite
4. Least Privilege — dar apenas as permissoes necessarias
5. Fail Secure — em caso de erro, negar acesso (nao permitir)
6. Input Boundaries — definir limites maximos para todos os inputs
```

#### A05 - Security Misconfiguration

```typescript
// ✅ Headers de seguranca com Helmet (Express/NestJS)
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // avaliar remover unsafe-inline
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}))
```

```typescript
// ✅ CORS restritivo
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
})

// ❌ CORS aberto
app.enableCors({ origin: '*' }) // nunca em producao
```

```typescript
// ❌ Debug mode em producao
app.listen(3000, () => {
  console.log('Stack traces habilitados')
})

// ✅ Error handler que nao vaza detalhes
app.useGlobalFilters(new HttpExceptionFilter()) // retorna apenas code + message
```

#### A06 - Vulnerable Components

```bash
# ✅ Verificar vulnerabilidades em dependencias
npm audit                        # Node.js
npm audit --audit-level=high     # Apenas high e critical
pip audit                        # Python
go vuln check ./...              # Go
cargo audit                      # Rust

# ✅ Verificar lockfile integrity
# lockfile deve estar commitado e nao ter sido adulterado
git diff --name-only HEAD | grep -E "package-lock|yarn.lock|pnpm-lock"

# ✅ Verificar licencas
npx license-checker --summary    # Node.js
```

```
Politica de dependencias:

1. Lockfile SEMPRE commitado — previne supply chain attacks
2. npm audit em CI — bloquear deploy com vulnerabilidades HIGH/CRITICAL
3. Dependencias diretas: preferir pacotes com manutencao ativa
4. Pinning de versao: usar ranges conservadores (^major.minor)
5. Revisar changelogs antes de atualizar major versions
```

#### A07 - Authentication Failures

```typescript
// ✅ Rate limiting em login
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email ?? req.ip, // por email, nao por IP
})

app.post('/auth/login', loginLimiter, loginController)
```

```typescript
// ✅ Session security
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: '__session',           // nome custom (nao usar 'connect.sid')
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,              // HTTPS only
    httpOnly: true,            // nao acessivel via JS
    sameSite: 'strict',        // prevenir CSRF
    maxAge: 30 * 60 * 1000,    // 30 minutos
    domain: process.env.COOKIE_DOMAIN,
  },
}))
```

#### A08 - Software and Data Integrity Failures

```typescript
// ✅ Verificar assinatura de webhooks
function verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`))
}

// ✅ Deserialization segura — nunca usar eval() ou Function()
// ❌ const data = eval(userInput)
// ❌ const fn = new Function(userInput)
// ✅ const data = JSON.parse(userInput) // com schema validation depois
const parsed = safeSchema.parse(JSON.parse(userInput))
```

#### A09 - Security Logging and Monitoring

```typescript
// ✅ Eventos de seguranca que DEVEM ser logados
const SECURITY_EVENTS = [
  'auth.login.success',
  'auth.login.failure',
  'auth.logout',
  'auth.password.change',
  'auth.password.reset',
  'auth.mfa.enable',
  'auth.mfa.disable',
  'auth.token.refresh',
  'access.denied',
  'access.admin.action',
  'data.export',
  'data.delete',
  'config.change',
  'user.create',
  'user.role.change',
] as const

// ✅ Log de seguranca estruturado
function logSecurityEvent(event: string, context: {
  userId?: string
  ip: string
  userAgent: string
  resource?: string
  action?: string
  result: 'success' | 'failure'
  reason?: string
}) {
  logger.info({ ...context, event, type: 'security' }, `Security: ${event}`)
}

// ❌ Nunca logar dados sensiveis
// logSecurityEvent('auth.login', { password: '...' }) — NUNCA
```

#### A10 - Server-Side Request Forgery (SSRF)

```typescript
// ❌ SSRF — usuario controla URL de fetch
app.get('/proxy', async (req, res) => {
  const response = await fetch(req.query.url) // atacante pode acessar http://169.254.169.254/
  return res.json(await response.json())
})

// ✅ Allowlist de dominios + validacao
const ALLOWED_DOMAINS = new Set(process.env.ALLOWED_PROXY_DOMAINS?.split(',') ?? [])

function validateUrl(urlString: string): URL {
  const url = new URL(urlString)

  // Bloquear IPs internos e metadata
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' ||
      url.hostname.startsWith('169.254.') || url.hostname.startsWith('10.') ||
      url.hostname.startsWith('192.168.') || url.hostname.startsWith('172.')) {
    throw new BadRequestError('URL interna nao permitida')
  }

  if (!ALLOWED_DOMAINS.has(url.hostname)) {
    throw new BadRequestError(`Dominio ${url.hostname} nao permitido`)
  }

  return url
}
```

### Secrets Management

```bash
# ✅ Escanear secrets no codigo
# Ferramentas: gitleaks, trufflehog, detect-secrets
# Executar antes de cada commit (pre-commit hook)

# Exemplo com gitleaks (se disponivel)
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Verificacao manual de patterns comuns
grep -rn --include="*.ts" --include="*.js" --include="*.py" --include="*.yml" --include="*.yaml" \
  -E "(password|secret|token|api_key|apikey|private_key|AWS_|STRIPE_SK_)\s*[:=]\s*['\"][^'\"]+['\"]" \
  . 2>/dev/null
```

```
Regras de secrets:

1. NUNCA commitar secrets no codigo — usar variaveis de ambiente
2. .env NUNCA no git — incluir no .gitignore
3. Rotacao periodica — secrets tem prazo de validade
4. Least privilege — cada servico tem suas proprias credenciais
5. Vault para producao — HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager
6. Pre-commit hook — bloquear commits com secrets detectados
7. Historico git — se um secret vazou, rotacionar IMEDIATAMENTE (nao basta remover do codigo)
```

### Input Validation e Sanitizacao

```typescript
// ✅ Schema validation com Zod (recomendado)
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Deve conter pelo menos uma maiuscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um numero')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  age: z.number().int().min(13).max(150).optional(),
  role: z.enum(['user', 'editor']), // nunca aceitar 'admin' via input
})

// ✅ Validar no controller (antes de qualquer processamento)
@Post()
async createUser(@Body() body: unknown) {
  const data = createUserSchema.parse(body)
  return this.userService.create(data)
}
```

```typescript
// ✅ Sanitizacao de HTML (se aceitar rich text)
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// ❌ Renderizar input do usuario sem sanitizar
element.innerHTML = userInput // XSS
```

### Compliance

```
LGPD/GDPR — checklist minimo:

1. Consentimento explicito para coleta de dados pessoais
2. Direito de acesso — endpoint para exportar dados do usuario
3. Direito de exclusao — endpoint para deletar dados (ou anonimizar)
4. Minimizacao — coletar apenas o necessario
5. Retencao — definir e implementar politica de retencao
6. Criptografia de PII em repouso e transito
7. Log de acesso a dados sensiveis (audit trail)
8. Data Processing Agreement com fornecedores
9. Notificacao de breach em 72h (GDPR) / prazo razoavel (LGPD)
10. DPO designado (quando aplicavel)
```

---

## Regras

### Nunca
- Ignorar uma vulnerabilidade encontrada (mesmo LOW deve ser documentada)
- Confiar em validacao apenas no frontend (sempre validar no backend)
- Usar algoritmos criptograficos obsoletos (MD5, SHA1 para senhas, DES)
- Hardcodar secrets, tokens ou credenciais no codigo
- Desabilitar verificacao de certificado TLS (`rejectUnauthorized: false`)
- Logar dados sensiveis (senhas, tokens, PII)
- Usar `eval()`, `Function()` ou `child_process.exec()` com input do usuario

### Sempre
- Validar e sanitizar toda entrada externa
- Usar queries parametrizadas (nunca concatenar SQL)
- Implementar rate limiting em endpoints sensiveis
- Manter dependencias atualizadas e monitorar CVEs
- Logar eventos de seguranca (auth, access denied, config changes)
- Usar HTTPS/TLS em todas as comunicacoes
- Aplicar principio de least privilege em roles e permissoes
- Ler o codigo existente antes de propor mudancas de seguranca

---

## Checklist de Conclusao

- [ ] OWASP Top 10 avaliado (ou vetores relevantes ao escopo)
- [ ] Secrets escaneados (codigo e historico git)
- [ ] Dependencias verificadas (`npm audit` ou equivalente)
- [ ] Headers de seguranca configurados (CSP, HSTS, X-Frame, etc.)
- [ ] Inputs validados e sanitizados
- [ ] Auth e authz revisados
- [ ] Logs de seguranca implementados
- [ ] Vulnerabilidades classificadas por severidade (CVSS)
- [ ] Relatorio gerado com correcoes recomendadas

---

## Output

| Artefato | Descricao |
|----------|-----------|
| Relatorio de seguranca | Vulnerabilidades encontradas com severidade, evidencia e correcao |
| Correcoes | Patches aplicados no codigo (validacao, headers, auth) |
| Cards no `$TASK_MANAGER` | Vulnerabilidades que requerem correcao planejada |
| Hardening configs | Headers, CORS, CSP, session, rate limiting |

---

## Mensagem de Conclusao

```
Auditoria de seguranca concluida!

Escopo: {descricao do escopo analisado}
Vulnerabilidades encontradas:
  CRITICAL: {n}
  HIGH: {n}
  MEDIUM: {n}
  LOW: {n}
  INFO: {n}

Correcoes aplicadas: {n}
Cards criados: {n}
Proximo passo: {corrigir criticos / revisar relatorio / rodar SAST no CI}
```

---

## Recursos Adicionais

- **Auth e RBAC**: Ver skill `eng-backend` para implementacao de autenticacao
- **Guards e pipes NestJS**: Ver skill `eng-nestjs` para middleware de seguranca
- **Frontend XSS**: Ver skill `eng-frontend` para CSP e sanitizacao no client
- **Supply chain**: Ver skill `eng-infrastructure` (futuro) para hardening de CI/CD
