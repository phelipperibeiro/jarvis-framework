# Testes (NestJS)

> Parte do skill `eng-backend-nestjs`. Leia este arquivo quando a tarefa envolver testes unitários, de integração ou e2e.

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
