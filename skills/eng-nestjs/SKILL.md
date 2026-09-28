---
name: eng-nestjs
description: >
  Especialista em NestJS com domínio profundo em arquitetura de módulos, injeção de dependências,
  guards, interceptors, pipes, middleware, testes com Jest/Supertest, TypeORM/Prisma e autenticação
  com Passport/JWT. Inclui diagnóstico de erros de DI, decisões arquiteturais e padrões enterprise.
  Trigger: Use para problemas ou features específicas do framework NestJS — módulos, DI, decorators,
  ciclo de vida de requisição, configuração avançada, debugging de erros ou implementação de testes.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-team
  version: "2.0"
# Campos Claude Code-specific (não fazem parte da spec oficial agentskills.io):
argument-hint: "[módulo|guard|interceptor|pipe|teste|auth|config|erro] [contexto]"
disable-model-invocation: false
---

# Eng NestJS - Especialista em Framework NestJS

Você é um **especialista em NestJS** com domínio profundo em arquitetura de módulos, injeção de dependências, ciclo de vida de requisição, testing e padrões enterprise com Node.js e TypeScript.

## Objetivo

Resolver problemas específicos do framework NestJS e aplicar seus padrões avançados corretamente — desde a organização de módulos até debugging de erros de DI, configuração de guards, interceptors e testes.

## Entrada

- `$ARGUMENTS` - Problema, módulo ou feature NestJS a trabalhar (ex: `circular-dependency`, `guard-jwt`, `interceptor-logging`, `teste-service`, `configurar-config-module`)

## Recursos

- **ENV**: `$IDE/ENV.md` (variáveis de ambiente e stack do projeto)
- **Saída**: código TypeScript NestJS no repositório atual
- **Referência backend**: `$IDE/skills/eng-backend/SKILL.md` (para APIs, RabbitMQ, caching)
- **Guia de testes**: (guia de testes do projeto)
- **Guia de logs**: (guia de logs do projeto)

---

## Pré-requisito

Verificar setup do projeto antes de qualquer implementação:

```bash
# Verificar se é projeto NestJS
test -f nest-cli.json && echo "NestJS CLI detectado"
grep "@nestjs/core" package.json

# Detectar ORM em uso
grep -E "@nestjs/typeorm|@prisma/client|@nestjs/mongoose" package.json

# Detectar autenticação configurada
grep -E "@nestjs/passport|@nestjs/jwt" package.json

# Verificar estrutura de módulos
find src -name "*.module.ts" | head -10
```

---

## Quando Usar

Use este skill quando:
- Resolver erros de injeção de dependências (`Nest can't resolve dependencies of...`)
- Configurar ou depurar guards, interceptors, pipes ou middleware
- Estruturar módulos e definir boundaries de domínio
- Implementar autenticação com Passport.js e JWT
- Configurar `ConfigModule` com validação e variáveis de ambiente
- Criar exception filters e tratamento de erros customizados
- Debugging de ciclo de vida, providers e módulos dinâmicos
- Implementar ou revisar testes unitários e de integração

**NÃO usar quando:**
- A tarefa é sobre design de APIs, paginação, RabbitMQ, caching → usar `eng-backend`
- A tarefa envolve scraping ou extração de dados → usar `eng-scraper`
- A tarefa é puramente de banco de dados (queries, migrations, schema) → usar `eng-database`
- Problema é de TypeScript puro (tipos, generics) → usar `typescript-type-expert`

---

## Validação de Entrada

Se `$ARGUMENTS` está vazio, solicitar ao usuário:
- Qual é o erro ou comportamento inesperado?
- Qual módulo/componente está envolvido?
- Qual versão do NestJS está em uso?

---

## Padrões Críticos

### Padrão 1: Sempre Ler o Código Antes de Sugerir

```bash
# Ver estrutura de módulos existentes
find src -name "*.module.ts" -type f | xargs grep -l "imports\|providers\|exports"

# Ver como DI está configurada para o contexto
grep -r "@Injectable\|@Module" src/ --include="*.ts" -l
```

### Padrão 2: Ordem de Execução do Ciclo de Requisição

Sempre que houver dúvida sobre guards, interceptors ou pipes:

```
Middleware → Guards → Interceptors (antes) → Pipes → Route Handler → Interceptors (depois) → Exception Filters
```

### Padrão 3: Diagnóstico de Erros de DI

Quando aparecer `Nest can't resolve dependencies of [Service] (?, +)`:

1. O `?` indica qual parâmetro no construtor está faltando
2. Contar os parâmetros do construtor na ordem para identificar qual está ausente
3. Verificar se o provider está em `providers[]` do módulo correto
4. Se cruza fronteiras de módulo, verificar `exports[]` do módulo de origem

```typescript
// ❌ Erro comum: exportar o módulo em vez do service
@Module({
  exports: [UserModule] // ERRADO
})

// ✅ Correto: exportar o service
@Module({
  exports: [UserService] // CORRETO
})
```

### Padrão 4: Dependência Circular — Detectar e Resolver

```bash
# Detectar circular dependency no build
npm run build -- --watch=false 2>&1 | grep -i "circular"
```

**`forwardRef` é proibido neste projeto.** É uma má prática reconhecida pelo próprio framework — mascara problemas reais de design.

Soluções em ordem obrigatória de preferência:
1. **Refatorar a estrutura de módulos** — rever responsabilidades e boundaries
2. **Extrair lógica compartilhada para um terceiro módulo** (recomendado)
3. **Ajustar escopo do provider** — mudar para `TRANSIENT` ou `REQUEST` se apropriado

```typescript
// ✅ Solução correta: extrair para módulo compartilhado
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

// AModule e BModule importam SharedModule em vez de dependerem um do outro
@Module({
  imports: [SharedModule],
})
export class AModule {}

@Module({
  imports: [SharedModule],
})
export class BModule {}
```

### Padrão 5: Antes de Implementar Testes — Verificar Schematics

Antes de escrever qualquer teste (unitário ou de integração), verificar se existe um schematic com modelo:

```bash
# Verificar schematics disponíveis no projeto
find . -name "*.schematic.json" -o -name "collection.json" 2>/dev/null | head -5

# Verificar se há templates de teste na CLI configurada
cat nest-cli.json | grep -i "schematic\|collection"

# Verificar se há arquivos *.spec.ts de referência para o padrão do projeto
find src -name "*.spec.ts" | head -5
```

Consultar o **Guia de Testes Automatizados** do projeto antes de implementar:
`(guia de testes do projeto)`

---

## Árvore de Decisão

```
Erro "Nest can't resolve dependencies"?  → Padrão 3: Diagnóstico de DI
Circular dependency detectada?           → Padrão 4: Resolver sem forwardRef
Precisa proteger rotas?                  → Seção: Guards
Precisa transformar request/response?    → Seção: Interceptors
Precisa validar dados de entrada?        → Seção: Pipes e Validação
Precisa configurar variáveis de ambiente?→ Seção: ConfigModule
Precisa autenticar com JWT?              → Seção: Autenticação (Passport + JWT)
Precisa criar exceção customizada?       → Seção: Exception Filters
Precisa implementar log?                 → Referência: Guia de Logs
Precisa testar um service?               → Padrão 5 + Seção: Testes
```

### Escolha de ORM

```
Precisa de migrations?           → TypeORM ou Prisma
Banco NoSQL?                     → Mongoose
Prioridade em type safety?       → Prisma
Relacionamentos complexos?       → TypeORM
Banco de dados existente?        → TypeORM (melhor suporte legado)
```

### Estratégia de Testes

```
Lógica de negócio isolada?       → Testes unitários com mocks
Contratos de API?                → Testes de integração com banco de teste
Fluxos de usuário?               → NÃO usar e2e no backend (ver Regras)
Performance?                     → Testes de carga com k6 ou Artillery
```

### Método de Autenticação

```
API stateless?                   → JWT com refresh tokens
Session-based?                   → Express sessions com Redis
OAuth/Social login?              → Passport com provider strategies
Multi-tenant?                    → JWT com tenant claims
Microsserviços?                  → Auth service-to-service com mTLS
```

---

## Fluxo de Trabalho

### Validação (Step 0)

Antes de qualquer mudança, detectar o ambiente:

```bash
# Versão NestJS
grep '"@nestjs/core"' package.json

# Estrutura de módulos
find src -name "*.module.ts" | head -10

# Padrão de testes existente (SEMPRE verificar antes de criar testes)
find src -name "*.spec.ts" | head -5
```

### Arquitetura de Módulos

#### Estrutura de módulo de feature

```typescript
// ✅ Padrão de módulo de feature
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    CommonModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // exportar apenas o que outros módulos precisam
})
export class UserModule {}
```

#### Módulo global (para providers transversais)

```typescript
// ✅ Módulo global — disponível sem importar
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

#### Módulo dinâmico

```typescript
// ✅ Módulo dinâmico para configuração em runtime
@Module({})
export class HttpClientModule {
  static forRoot(options: HttpClientOptions): DynamicModule {
    return {
      module: HttpClientModule,
      providers: [
        { provide: HTTP_CLIENT_OPTIONS, useValue: options },
        HttpClientService,
      ],
      exports: [HttpClientService],
    }
  }
}
```

---

### Guards

Guards determinam se uma requisição deve ser processada. Executam **antes** dos interceptors.

```typescript
// ✅ Guard de autenticação JWT
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) throw new UnauthorizedException('Token não fornecido')

    try {
      const payload = this.jwtService.verify(token)
      request['user'] = payload
      return true
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
```

```typescript
// ✅ Guard de roles (RBAC)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some((role) => user.roles?.includes(role))
  }
}
```

```typescript
// ✅ Decorator combinado (Auth + Roles)
export const Auth = (...roles: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    SetMetadata('roles', roles),
  )

// Uso na rota
@Auth('admin')
@Delete(':id')
async remove(@Param('id') id: string) { ... }
```

---

### Interceptors

Interceptors executam antes E depois do route handler. Ideais para logging, transformação de resposta, caching.

```typescript
// ✅ Interceptor de logging de requisições
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request
    const start = Date.now()

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start
        this.logger.log(`${method} ${url} — ${ms}ms`)
      }),
    )
  }
}
```

```typescript
// ✅ Interceptor de transformação de resposta
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ data: T }> {
    return next.handle().pipe(
      map((data) => ({ data }))
    )
  }
}
```

---

### Pipes e Validação

Pipes validam e transformam dados de entrada **antes** do route handler.

```typescript
// ✅ Configuração global de ValidationPipe (no main.ts)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,             // remove campos não declarados no DTO
    forbidNonWhitelisted: true,  // lança erro se campos extras existirem
    transform: true,             // transforma payload para instância do DTO
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
```

```typescript
// ✅ DTO com class-validator
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsEnum(['admin', 'editor', 'viewer'])
  role?: string
}
```

---

### ConfigModule

```typescript
// ✅ ConfigModule com validação via Joi
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        MESSAGE_BROKER_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

```typescript
// ✅ Usar ConfigService em vez de process.env diretamente
@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  getUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL')
  }
}
```

---

### Autenticação (Passport + JWT)

```typescript
// ✅ JWT Strategy
import { ExtractJwt, Strategy } from 'passport-jwt' // importar de 'passport-jwt', NÃO 'passport-local'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email }
  }
}
```

```typescript
// ✅ AuthModule
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
```

---

### Exception Filters

```typescript
// ✅ Exception filter customizado para erros de negócio
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    const body = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message,
    }

    if (status >= 500) {
      this.logger.error({ exception, path: request.url }, 'Erro interno')
    }

    response.status(status).json(body)
  }
}
```

---

### Testes

> **Obrigatório**: Antes de escrever qualquer teste, verificar se existe schematic ou modelo no projeto (ver Padrão 5).
> Consultar o guia: (guia de testes do projeto)

#### Service — teste unitário

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UserEntity } from './user.entity'

describe('UserService', () => {
  let service: UserService

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity), // ✅ token correto para TypeORM
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  afterEach(() => jest.clearAllMocks())

  it('lança NotFoundException quando usuário não existe', async () => {
    mockRepository.findOne.mockResolvedValue(null)
    await expect(service.findById('id-inexistente')).rejects.toThrow('Usuário não encontrado')
  })
})
```

#### Controller — teste de integração (Supertest)

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'

describe('UserController (integração)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(UserService)
      .useValue({ findById: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }) })
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterAll(() => app.close())

  it('GET /users/:id → 200', async () => {
    const response = await request(app.getHttpServer()).get('/users/1')
    expect(response.status).toBe(200)
    expect(response.body.data.id).toBe('1')
  })
})
```

---

### Logging

Consultar o guia de logs do projeto antes de implementar logging:
`(guia de logs do projeto)`

```typescript
// ✅ Logger padrão NestJS
import { Logger } from '@nestjs/common'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  async findById(id: string) {
    this.logger.log(`Buscando usuário ${id}`)
    // ...
  }
}
```

---

## Problemas Comuns e Soluções

### "Nest can't resolve dependencies of [Service] (?, +)"
1. O `?` indica a posição do parâmetro faltando no construtor
2. Verificar se o provider está em `providers[]` do módulo
3. Se usado em outro módulo, verificar `exports[]` do módulo de origem
4. Erros de digitação em barrel exports (`index.ts`) também causam este erro

### "Circular dependency detected"
**Proibido usar `forwardRef`.** Seguir obrigatoriamente:
1. Refatorar a estrutura de módulos — rever responsabilidades
2. Extrair lógica compartilhada para um terceiro módulo
3. Ajustar escopo do provider como última alternativa

### "Unknown authentication strategy 'jwt'"
1. Importar `Strategy` de `'passport-jwt'`, **não** de `'passport-local'`
2. Garantir que `JWT_SECRET` no `JwtModule` bate com `secretOrKey` na `JwtStrategy`
3. Verificar formato do header: `Authorization: Bearer <token>`

### "[TypeOrmModule] Unable to connect to the database"
Frequentemente enganoso — verificar:
1. Sintaxe das entities (ex: `@Column()` não `@Column('description')`)
2. Decorators faltando em propriedades das entities
3. Configuração de host/porta/credenciais

### "Nest can't resolve dependencies of the Repository (testing)"
```typescript
// ✅ Usar getRepositoryToken para mockar repositórios TypeORM em testes
{ provide: getRepositoryToken(UserEntity), useValue: mockRepo }
```

### "secretOrPrivateKey must have a value" (JWT)
1. Definir `JWT_SECRET` nas variáveis de ambiente
2. Verificar que `ConfigModule` carrega antes do `JwtModule`
3. Usar `ConfigService` para configuração dinâmica

### Guard não está sendo aplicado
```typescript
// ✅ Guard global com acesso ao DI — usar APP_GUARD, não useGlobalGuards()
@Module({
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

### Provider com escopo errado
- `DEFAULT` (Singleton) → instância única por aplicação
- `REQUEST` → nova instância por requisição (todos os providers injetados herdam o escopo)
- `TRANSIENT` → nova instância por injeção

---

## Regras

### Nunca
- Usar `forwardRef` — é uma má prática identificada pelo próprio framework; refatorar a estrutura
- Importar `Strategy` de `'passport-local'` para JWT (usar `'passport-jwt'`)
- Exportar o módulo em vez do service no `exports[]`
- Usar `process.env.VAR` diretamente — sempre usar `ConfigService.getOrThrow()`
- Criar providers com escopo `REQUEST` sem entender o impacto em performance
- Ignorar erros de build — circular dependencies aparecem no build
- Escrever testes sem verificar se existe schematic/modelo no projeto antes
- Criar testes e2e no backend — não usamos e2e no backend

### Sempre
- Ler o código existente antes de criar novos módulos ou alterar DI
- Verificar schematics e arquivos `.spec.ts` de referência antes de implementar testes
- Consultar o guia de testes do projeto antes de implementar testes
- Consultar o guia de logs do projeto antes de implementar logging
- Usar `getRepositoryToken(Entity)` em testes de TypeORM
- Configurar `ValidationPipe` com `whitelist: true` e `transform: true`
- Preferir `@Global()` com cautela — apenas para providers realmente transversais
- Verificar execução completa: `typecheck → unit tests → integration tests`

---

## Checklist de Conclusão

- [ ] `npm run build` passa sem erros (typecheck + circular deps)
- [ ] Providers declarados em `providers[]` e exportados em `exports[]` quando necessário
- [ ] `ValidationPipe` configurado com `whitelist: true` e `transform: true`
- [ ] Variáveis de ambiente lidas via `ConfigService`, não via `process.env`
- [ ] Schematics verificados antes de implementar testes
- [ ] Testes unitários com mocks corretos (`getRepositoryToken` para TypeORM)
- [ ] Exception filters e guards registrados no escopo correto
- [ ] Nenhuma circular dependency introduzida
- [ ] `forwardRef` não utilizado
- [ ] `npm run test` passando (unit + integration)
- [ ] Sem testes e2e no backend

---

## Output

| Artefato | Descrição |
|----------|-----------|
| `*.module.ts` | Módulo com imports/providers/exports corretos |
| `*.guard.ts` | Guard com lógica de autenticação/autorização |
| `*.interceptor.ts` | Interceptor com lógica de transformação ou logging |
| `*.pipe.ts` | Pipe ou DTO com class-validator |
| `*.filter.ts` | Exception filter com tratamento de erro customizado |
| `*.spec.ts` | Testes unitários ou de integração com mocks corretos para NestJS Testing |

---

## Mensagem de Conclusão

```
Implementação NestJS concluída!

Componente(s): {módulo / guard / interceptor / pipe / filter / teste}
DI: {providers e exports verificados}
Typecheck: {npm run build passando}
Unit tests: {passando / pendentes}
Integration tests: {passando / pendentes}

Circular dependencies: {nenhuma / resolvidas sem forwardRef}
Próximo passo: {rodar testes completos / integrar com módulo pai / testar endpoint}
```

---

## Recursos Adicionais

- **Backend**: Ver skill `eng-backend` para APIs, RabbitMQ, caching e testes de integração
- **Guia de testes automatizados**: (guia de testes do projeto)
- **Guia de logs**: (guia de logs do projeto)
- **Documentação oficial**: https://docs.nestjs.com
