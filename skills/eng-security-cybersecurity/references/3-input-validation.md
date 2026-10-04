# Input Validation e Sanitizacao

> Parte do skill `eng-security-cybersecurity`. Leia este arquivo quando a tarefa envolver validacao e sanitizacao de entradas.

### Input Validation e Sanitizacao

```typescript
// ✅ Schema validation com Zod (recomendado)
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Deve conter pelo menos uma maiuscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um numero')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  age: z.number().int().min(13).max(150).optional(),
  role: z.enum(['user', 'editor']), // nunca aceitar 'admin' via input
})

// ✅ Validar no controller (antes de qualquer processamento)
@Post()
async createUser(@Body() body: unknown) {
  const data = createUserSchema.parse(body)
  return this.userService.create(data)
}
```

```typescript
// ✅ Sanitizacao de HTML (se aceitar rich text)
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// ❌ Renderizar input do usuario sem sanitizar
element.innerHTML = userInput // XSS
```
