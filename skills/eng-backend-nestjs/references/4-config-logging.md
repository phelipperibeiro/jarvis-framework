# ConfigModule e Logging

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando a tarefa envolver variáveis de ambiente (ConfigModule) ou logging.

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
