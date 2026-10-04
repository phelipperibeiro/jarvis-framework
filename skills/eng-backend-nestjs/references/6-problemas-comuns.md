# Problemas Comuns e Soluções

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando houver erro de injeção de dependência, dependência circular, estratégia de autenticação, conexão com banco, escopo de provider ou guard não aplicado.

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
