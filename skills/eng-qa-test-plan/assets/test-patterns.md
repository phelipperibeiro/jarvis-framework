# Padrões de Teste por Linguagem/Framework

Este documento serve como referência para identificar arquivos de teste e padrões de nomenclatura em diferentes stacks.

---

## Convenções de Nomenclatura

### Por Linguagem

| Linguagem | Padrão de Arquivo | Exemplo |
|-----------|-------------------|---------|
| TypeScript/JavaScript | `[filename].test.ts` | `user.test.ts` |
| TypeScript/JavaScript | `[filename].spec.ts` | `user.spec.ts` |
| Python | `test_[filename].py` | `test_user.py` |
| Python | `[filename]_test.py` | `user_test.py` |
| Go | `[filename]_test.go` | `user_test.go` |
| Java | `[Filename]Test.java` | `UserTest.java` |
| Rust | `[filename]_test.rs` | `user_test.rs` |
| C# | `[Filename]Tests.cs` | `UserTests.cs` |

### Por Framework

| Framework | Estrutura de Pastas | Padrão |
|-----------|---------------------|--------|
| Jest | `__tests__/` ou junto ao código | `*.test.ts`, `*.spec.ts` |
| Vitest | `__tests__/` ou junto ao código | `*.test.ts`, `*.spec.ts` |
| Pytest | `tests/` | `test_*.py` |
| Go testing | Junto ao código | `*_test.go` |
| JUnit | `src/test/java/` | `*Test.java` |
| NUnit | `*.Tests/` | `*Tests.cs` |

---

## Estrutura de Diretórios Comum

### JavaScript/TypeScript

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx      # Teste junto ao componente
├── services/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
└── __tests__/               # Pasta dedicada (alternativa)
    └── integration/
```

### Python

```
project/
├── src/
│   └── user/
│       └── service.py
└── tests/
    ├── unit/
    │   └── test_service.py
    └── integration/
        └── test_api.py
```

### Go

```
project/
├── user/
│   ├── service.go
│   └── service_test.go      # Sempre junto ao código
└── integration/
    └── api_test.go
```

---

## Tipos de Teste

### Unitário

- **Escopo**: Função/método isolado
- **Dependências**: Mockadas
- **Velocidade**: Muito rápido (< 100ms)
- **Quando usar**: Lógica de negócio, validações, transformações

### Integração

- **Escopo**: Múltiplos componentes
- **Dependências**: Reais ou containers
- **Velocidade**: Médio (100ms - 5s)
- **Quando usar**: APIs, banco de dados, serviços externos

### E2E (End-to-End)

- **Escopo**: Fluxo completo do usuário
- **Dependências**: Ambiente completo
- **Velocidade**: Lento (> 5s)
- **Quando usar**: Fluxos críticos, smoke tests

---

## Priorização de Testes

### Alta Prioridade (P0)

- APIs públicas e endpoints
- Lógica de negócio crítica
- Código de autenticação/autorização
- Manipulação de dados sensíveis
- Cálculos financeiros

### Média Prioridade (P1)

- Utilitários compartilhados
- Tratamento de erros
- Validações de entrada
- Transformações de dados

### Baixa Prioridade (P2)

- Código de apresentação puro
- Configurações simples
- Constantes e enums
- Wrappers triviais

---

## Comandos de Execução

### JavaScript/TypeScript

```bash
# Jest
npm test
npm test -- --coverage
npm test -- --watch

# Vitest
npm run test
npm run test:coverage
```

### Python

```bash
# Pytest
pytest
pytest --cov=src
pytest -v tests/unit/
```

### Go

```bash
go test ./...
go test -cover ./...
go test -v ./user/
```

### Java (Maven)

```bash
mvn test
mvn test -Dtest=UserTest
```

---

## Ferramentas de Cobertura

| Linguagem | Ferramenta | Comando |
|-----------|------------|---------|
| JS/TS | Istanbul/NYC | `npm test -- --coverage` |
| Python | Coverage.py | `pytest --cov` |
| Go | go test | `go test -cover` |
| Java | JaCoCo | `mvn jacoco:report` |
| C# | Coverlet | `dotnet test --collect:"XPlat Code Coverage"` |
