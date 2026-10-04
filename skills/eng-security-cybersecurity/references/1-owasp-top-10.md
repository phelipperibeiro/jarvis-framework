# Auditoria OWASP Top 10

> Parte do skill `eng-security-cybersecurity`. Leia este arquivo quando a tarefa for uma auditoria de seguranca do codigo (OWASP Top 10).

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
