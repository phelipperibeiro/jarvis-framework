# Template — Spec Cypress + TypeScript

Template base para criação de specs `.cy.ts` seguindo os padrões definidos em
`$RULES_FOLDER/engineering/qa/eng.qa.cypress-standards-rules.md`.

---

## Estrutura Base

```typescript
// e2e/{dominio}/{feature}.cy.ts

import { {Dominio}Page } from '../../support/pages/{Dominio}Page'

const page = new {Dominio}Page()

describe('{Domínio} — {Feature}', () => {
  beforeEach(() => {
    // Setup comum: autenticação e navegação
    cy.loginAs('{perfil}')
    page.visit()
  })

  // ---------------------------------------------------------------------------
  // Happy Path
  // ---------------------------------------------------------------------------
  context('quando {condição principal — estado válido}', () => {
    beforeEach(() => {
      cy.intercept('{MÉTODO}', '**/api/{recurso}', {
        fixture: '{dominio}/{recurso}-{metodo}.json',
      }).as('{verbRecurso}')
    })

    it('deve {comportamento principal esperado}', () => {
      // Arrange
      // (dados já preparados no beforeEach)

      // Act
      page.{acao}()
      cy.wait('@{verbRecurso}')

      // Assert
      page.shouldShow{Resultado}()
    })
  })

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  context('quando {condição de borda}', () => {
    it('deve {comportamento esperado no limite}', () => {
      // ...
    })
  })

  // ---------------------------------------------------------------------------
  // Negative Tests
  // ---------------------------------------------------------------------------
  context('quando {condição de erro / dados inválidos}', () => {
    it('deve exibir {mensagem de erro esperada}', () => {
      cy.intercept('{MÉTODO}', '**/api/{recurso}', {
        statusCode: 422,
        body: { message: '{mensagem de erro da API}' },
      }).as('{verbRecursoError}')

      page.{acaoComDadosInvalidos}()
      cy.wait('@{verbRecursoError}')

      page.shouldShowError('{mensagem esperada}')
    })
  })
})
```

---

## Page Object Base

```typescript
// support/pages/{Dominio}Page.ts

export class {Dominio}Page {
  visit() {
    cy.visit('/{rota}')
    return this
  }

  // --- Ações ---

  {acao}() {
    cy.get('[data-testid="{btn-dominio-acao}"]').click()
    return this
  }

  fill{Campo}(valor: string) {
    cy.get('[data-testid="input-{dominio}-{campo}"]').clear().type(valor)
    return this
  }

  submit() {
    cy.get('[data-testid="btn-{dominio}-submit"]').click()
    return this
  }

  // --- Asserções ---

  shouldShow{Resultado}() {
    cy.get('[data-testid="{el-dominio-resultado}"]').should('be.visible')
    return this
  }

  shouldShowError(message: string) {
    cy.get('[data-testid="alert-error-message"]').should('contain', message)
    return this
  }

  shouldBeOnPage() {
    cy.url().should('include', '/{rota}')
    return this
  }
}
```

---

## Custom Command de Autenticação (referência)

```typescript
// support/commands/auth.commands.ts

Cypress.Commands.add('loginAs', (perfil: '{perfil1}' | '{perfil2}') => {
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

---

## Fixture de Intercept (referência)

```json
// fixtures/{dominio}/{recurso}-get.json
{
  "data": [
    {
      "id": "{id-1}",
      "{campo}": "{valor}"
    }
  ],
  "total": 1,
  "page": 1
}
```

---

## Checklist antes de fazer commit da spec

- [ ] Todos os seletores usam `data-testid`
- [ ] Nenhum `cy.wait({número})` hardcoded — apenas `cy.wait('@alias')`
- [ ] Cada `it` testa exatamente um comportamento
- [ ] Todas as chamadas de API estão interceptadas
- [ ] Fixtures tipadas com `cy.fixture<Tipo>(...)`
- [ ] Happy Path + pelo menos 1 Negative Test cobertos
- [ ] Page Object retorna `this` em todos os métodos de ação
- [ ] `beforeEach` garante estado limpo para cada teste
