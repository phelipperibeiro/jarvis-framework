# Regras de Padrões Cypress — QA Engineering

> **Applies to:** HUB: QA | POSITION: all | AREA: ENGINEERING | SQUAD: all

Convenções obrigatórias para a escrita e manutenção da suíte de testes E2E em Cypress + TypeScript.
Estas regras são carregadas automaticamente pelo `warm-up` quando `HUB=QA`.

> **Fonte de verdade**: este arquivo define o padrão para toda a sessão.
> A skill `eng-qa-cypress-e2e` assume que estas regras foram carregadas — não as redescobre.

---

## 1. Estrutura de Pastas

```
$TEST_FOLDER/
├── e2e/                        ← specs organizados por domínio/feature
│   ├── {dominio}/
│   │   └── {feature}.cy.ts
├── fixtures/                   ← dados de teste tipados
│   └── {dominio}/
│       └── {entidade}.json
├── support/
│   ├── commands/               ← custom commands por domínio
│   │   └── {dominio}.commands.ts
│   ├── pages/                  ← Page Objects
│   │   └── {Dominio}Page.ts
│   ├── commands.ts             ← barrel de imports dos commands
│   └── e2e.ts                  ← configuração global
└── cypress.config.ts
```

> `$TEST_FOLDER` é definido no `ENV.md` do projeto.
> Se não definido, inferir do `cypress.config.ts` na raiz.

---

## 2. Nomenclatura de Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Spec | `{feature}.cy.ts` | `login.cy.ts` |
| Page Object | `{Dominio}Page.ts` (PascalCase) | `LoginPage.ts` |
| Custom command | `{dominio}.commands.ts` | `auth.commands.ts` |
| Fixture | `{entidade}.json` | `usuario.json` |
| Intercept fixture | `{endpoint}-{metodo}.json` | `usuarios-get.json` |

---

## 3. Estrutura de Spec (describe/it)

```typescript
describe('{Domínio} — {Feature}', () => {
  beforeEach(() => {
    // setup comum: autenticação, navegação inicial
  })

  afterEach(() => {
    // limpeza se necessário
  })

  context('quando {condição}', () => {
    it('deve {comportamento esperado}', () => {
      // Arrange → Act → Assert
    })
  })
})
```

**Regras de nomenclatura:**
- `describe`: `{Domínio} — {Feature}` (domínio sempre em PascalCase)
- `context`: `quando {condição}` — descreve o estado/pré-condição
- `it`: `deve {comportamento}` — verifica um único comportamento
- Nunca usar `it('test 1')`, `it('cenário A')` ou nomes vagos

---

## 4. Page Object Pattern

```typescript
// support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login')
    return this
  }

  fillEmail(email: string) {
    cy.get('[data-testid="input-email"]').type(email)
    return this
  }

  fillPassword(password: string) {
    cy.get('[data-testid="input-password"]').type(password)
    return this
  }

  submit() {
    cy.get('[data-testid="btn-submit"]').click()
    return this
  }

  // Asserções ficam no Page Object quando são reutilizáveis
  shouldShowError(message: string) {
    cy.get('[data-testid="alert-error"]').should('contain', message)
    return this
  }
}
```

**Regras do Page Object:**
- Retornar `this` em todos os métodos de ação (fluent interface)
- Métodos de asserção começam com `should`
- Nunca colocar lógica de negócio — apenas interação com a UI
- Um Page Object por página ou componente de alto nível
- Importar e instanciar no topo da spec: `const page = new LoginPage()`

---

## 5. Seletores — Uso de `data-testid`

**Hierarquia de preferência de seletores:**

```
1. cy.get('[data-testid="..."]')       ← PADRÃO — sempre preferir
2. cy.get('[aria-label="..."]')        ← acessibilidade — segundo recurso
3. cy.get('[role="..."]')              ← semântico — terceiro recurso
4. cy.contains('Texto visível')        ← apenas para elementos de texto
5. cy.get('.classe') / cy.get('#id')   ← PROIBIDO em specs novas
```

**Convenção de nomes para `data-testid`:**

```
{tipo}-{dominio}-{identificador}

Exemplos:
  btn-auth-login
  input-form-email
  table-users-list
  row-users-{id}          ← para listas dinâmicas
  modal-confirm-delete
  alert-error-message
```

---

## 6. Interceptação de API com `cy.intercept`

```typescript
// Padrão de intercept com fixture tipada
cy.intercept('GET', '**/api/usuarios', { fixture: 'usuarios/usuarios-get.json' })
  .as('getUsuarios')

// Aguardar antes de asserção
cy.wait('@getUsuarios')
cy.get('[data-testid="table-users-list"]').should('be.visible')
```

**Regras de intercept:**
- Sempre usar `.as('{verbo}{Recurso}')` — ex: `@getUsuarios`, `@postPagamento`
- Sempre usar `cy.wait('@alias')` antes de asserções que dependem da resposta
- Fixtures de intercept ficam em `fixtures/{dominio}/{endpoint}-{metodo}.json`
- Para erros: passar `{ statusCode: 422, body: { message: '...' } }` diretamente (não fixture)
- Nunca depender do estado real da API em testes E2E — sempre interceptar chamadas externas

---

## 7. Fixtures Tipadas

```typescript
// cypress/fixtures/usuarios/usuario.json
{
  "id": "usr-001",
  "nome": "Dev Teste",
  "email": "dev@example.com",
  "perfil": "admin"
}

// Uso na spec com tipo
import type { Usuario } from '../../src/types/usuario'

cy.fixture<Usuario>('usuarios/usuario').then((usuario) => {
  cy.get('[data-testid="input-email"]').type(usuario.email)
})
```

**Regras de fixtures:**
- Dados sensíveis (senhas, tokens) nunca em fixtures — usar `Cypress.env()`
- Fixtures refletem contratos reais de API — atualizá-las quando a API muda
- Usar tipos do projeto (`import type`) para garantir sincronia com o código

---

## 8. Custom Commands

```typescript
// support/commands/auth.commands.ts
Cypress.Commands.add('loginAs', (perfil: 'admin' | 'viewer' | 'editor') => {
  cy.fixture(`usuarios/${perfil}`).then((usuario) => {
    cy.request('POST', '/api/auth/login', {
      email: usuario.email,
      password: Cypress.env('DEFAULT_PASSWORD'),
    }).then(({ body }) => {
      window.localStorage.setItem('auth_token', body.token)
    })
  })
})
```

**Regras de custom commands:**
- Prefixo do domínio no nome: `loginAs`, `selectCompany`, `fillAddress`
- Login/autenticação sempre via `cy.request` (não via UI) — mais rápido e estável
- Tipar os parâmetros com union types quando há opções fixas
- Registrar em `support/commands.ts` e declarar tipo em `support/index.d.ts`

---

## 9. Cenários Obrigatórios por Spec

Toda spec deve cobrir no mínimo:

| Cenário | Obrigatório? |
|---------|-------------|
| Happy Path — fluxo principal com dados válidos | ✅ Sempre |
| Edge Case — dados limite, campos opcionais | ✅ Se aplicável |
| Negative Test — dados inválidos, erros esperados | ✅ Se há validação |
| Estado vazio — lista sem itens, tela inicial | ⚠️ Quando relevante |
| Permissão — comportamento por perfil de usuário | ⚠️ Quando há controle de acesso |

---

## 10. Antipadrões — Nunca Fazer

```typescript
// ❌ Seletor frágil
cy.get('.btn-primary').click()
cy.get('#submit').click()

// ✅ Correto
cy.get('[data-testid="btn-auth-submit"]').click()

// ❌ Sleep hardcoded
cy.wait(3000)

// ✅ Correto — aguardar elemento ou intercept
cy.wait('@postLogin')
cy.get('[data-testid="dashboard-title"]').should('be.visible')

// ❌ Lógica condicional no teste
if (Cypress.env('USE_MOCK')) { ... }

// ✅ Correto — sempre interceptar, nunca depender de flag

// ❌ Dependência entre testes
// Teste 2 só funciona se Teste 1 rodou antes

// ✅ Correto — cada `it` deve ser independente (usar beforeEach para setup)
```
