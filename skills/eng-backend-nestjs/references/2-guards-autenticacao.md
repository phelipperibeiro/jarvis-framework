# Guards e Autenticação (Passport + JWT)

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando a tarefa envolver guards, roles/permissões ou autenticação com Passport e JWT.

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
