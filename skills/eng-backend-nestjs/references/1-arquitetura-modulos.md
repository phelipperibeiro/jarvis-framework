# Arquitetura de Módulos (NestJS)

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando a tarefa criar ou reorganizar módulos, providers e injeção de dependência.

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
