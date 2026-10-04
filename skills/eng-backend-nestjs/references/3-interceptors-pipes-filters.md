# Interceptors, Pipes e Exception Filters

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando a tarefa envolver interceptors, validação com pipes ou tratamento de exceções.

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
