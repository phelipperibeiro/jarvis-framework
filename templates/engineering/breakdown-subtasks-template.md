# Template de Subtarefa ULTRA DETALHADA

> Este é o template que DEVE ser usado para CADA subtarefa gerada pelo workflow `eng.breakdown-subtasks`.
>
> **IMPORTANTE:** Este template deve ser preenchido COMPLETAMENTE. Cada seção é obrigatória.

---

## ⚠️ Princípio de Independência

Esta subtarefa é uma **unidade de entrega completa e independente**. Será um card no `$TASK_MANAGER` com **sua própria branch, seu próprio commit e seu próprio deploy**.

Por isso, ela é uma **fatia vertical** (vertical slice): atravessa todas as camadas necessárias (migration + DTO + use-case + factory + repository + controller + enum + testes, ou — no frontend — componente + estado + integração + estilos + testes) e entrega um fluxo end-to-end funcional.

**Valide antes de iniciar a implementação — responda sim para as três perguntas:**

1. [ ] **Posso fazer merge desta branch sem quebrar o sistema?**
2. [ ] **Posso testar/demonstrar esta entrega sem depender das próximas subtarefas?**
3. [ ] **Esta subtarefa entrega valor observável** (endpoint funcionando, modal usável, tela navegável)?

Se qualquer resposta for **não** → pare e reagrupe com a subtarefa seguinte antes de continuar.

**Exemplos:**

- ✅ Uma subtarefa = um endpoint inteiro (todas as camadas envolvidas)
- ✅ Uma subtarefa = um modal inteiro no frontend
- ✅ Uma subtarefa = uma tela inteira ou alteração de uma tela existente
- ❌ Uma subtarefa só para adicionar valor em enum
- ❌ Uma subtarefa só para editar um repository
- ❌ Uma subtarefa só para criar a factory de um use-case
- ❌ Uma subtarefa só para criar um DTO

---

## 🎯 O Que Você Vai Fazer

{Descrição em 2-3 frases do objetivo final desta subtarefa. O que o desenvolvedor terá completado quando terminar?}

**Exemplo:**

> Criar o endpoint de registro de usuários que recebe email e senha, valida os dados, cria o usuário no banco de dados e retorna um token JWT. Ao finalizar, novos usuários poderão se cadastrar via API.

---

## 📋 Contexto da Tarefa

### Por que isso é necessário?

{Explique o motivo de negócio ou técnico para esta subtarefa existir. Por que é importante? O que acontece se não for feito?}

**Exemplo:**

> O sistema precisa permitir que novos usuários se cadastrem. Este endpoint é a porta de entrada para novos usuários no sistema. Sem ele, não há forma de criar contas e acessar a aplicação.

### Onde isso se encaixa?

{Explique como esta subtarefa se conecta com as outras subtarefas e como contribui para a feature final. Mostre as dependências de forma clara.}

**Exemplo:**

> Esta é a primeira subtarefa do fluxo de autenticação. O frontend de registro (próxima subtarefa) depende deste endpoint estar funcionando. Os testes de integração (subtarefa [QA]) também precisam que este endpoint exista.

### Pré-requisitos

{Liste os pré-requisitos que precisam estar prontos ANTES de começar esta subtarefa. Inclua outras subtarefas, configurações, ou ambiente.}

- [ ] {Subtarefa anterior concluída - ex: [DATA] Criar migration tabela users}
- [ ] {Variável de ambiente configurada - ex: JWT_SECRET definido em .env}
- [ ] {Acesso a recurso específico - ex: Banco de dados local rodando}

**Exemplo:**

```
- [ ] [DATA] Criar migration tabela users - Você precisa da tabela criada no banco
- [ ] JWT_SECRET configurado em .env - Necessário para gerar tokens
- [ ] Banco de dados local rodando - `docker-compose up` deve funcionar
```

---

## 🛠️ Stack Técnico

### Tecnologias e Versões

| Tecnologia | Versão/Especificação | Para que será usada                          |
| ---------- | -------------------- | -------------------------------------------- |
| {Tech 1}   | {versão específica}  | {descrição detalhada do uso nesta subtarefa} |
| {Tech 2}   | {versão específica}  | {descrição detalhada do uso nesta subtarefa} |

**Exemplo:**

| Tecnologia        | Versão | Para que será usada                                            |
| ----------------- | ------ | -------------------------------------------------------------- |
| Express.js        | 4.18+  | Framework HTTP para criar o endpoint                           |
| bcrypt            | 5.1+   | Hash seguro da senha do usuário                                |
| jsonwebtoken      | 9.0+   | Geração e validação de JWT para autenticação                   |
| express-validator | 7.0+   | Validação de email, senha e outros campos de entrada           |
| TypeScript        | 5.0+   | Tipagem estática para evitar erros em tempo de desenvolvimento |

### Padrões do Projeto a Seguir

{Descreva os padrões específicos que DEVEM ser seguidos neste projeto. Nomenclatura, estrutura de pastas, convenções de código, etc.}

**Exemplo:**

```bash
- **Nomenclatura**:
  - Variáveis: camelCase (ex: `passwordHash`)
  - Funções: camelCase (ex: `registerUser()`)
  - Classes: PascalCase (ex: `AuthService`)
  - Constantes: UPPER_SNAKE_CASE (ex: `MAX_PASSWORD_LENGTH`)

- **Estrutura de pastas**:
  - Controllers em `src/controllers/`
  - Services em `src/services/`
  - Routes em `src/routes/`
  - Schemas de validação em `src/schemas/`
  - Testes em `src/__tests__/`

- **Convenções de código**:
  - Usar Prettier para formatação
  - ESLint deve estar clean
  - TypeScript sem `any`
  - Imports alfabeticamente organizados
```

### Arquivos de Referência (COPIE O PADRÃO)

{Liste arquivos EXISTENTES no projeto que devem ser usados como referência. Descreva o que você deve copiar de cada um.}

**Exemplo:**

```bash
- `src/controllers/user.controller.ts`
  - Use como base para a estrutura do controller de auth
  - Copie o padrão de error handling
  - Observe como injeta as dependências

- `src/services/user.service.ts`
  - Copie a estrutura geral de um service
  - Veja como usa o repository

- `src/routes/user.routes.ts`
  - Copie o padrão de definição de rotas
  - Observe o uso de middleware de validação
```

---

## 📁 Arquivos a Criar/Modificar

{Lista de arquivos que serão criados ou modificados. Seja MUITO específico com os caminhos.}

| Arquivo                              | Ação         | Descrição                                                      |
| ------------------------------------ | ------------ | -------------------------------------------------------------- |
| `src/schemas/auth.schema.ts`         | 🆕 Criar     | Schema com validação de email e senha usando express-validator |
| `src/services/auth.service.ts`       | 🆕 Criar     | Service com lógica de negócio (hash, validação, criação)       |
| `src/controllers/auth.controller.ts` | 🆕 Criar     | Controller que recebe a request e chama o service              |
| `src/routes/auth.routes.ts`          | 🆕 Criar     | Rotas da API de autenticação (POST /api/auth/register)         |
| `src/routes/index.ts`                | ✏️ Modificar | Adicionar import e registro das rotas de autenticação          |
| `src/__tests__/auth.spec.ts`         | 🆕 Criar     | Testes unitários e de integração para o endpoint               |

---

## 👣 Passo a Passo de Implementação

{Quebrar a implementação em passos específicos e acionáveis. CADA passo deve incluir código COMPLETO.}

### Passo 1: {Título Descritivo}

**O que fazer:**
{Explicação detalhada do que fazer neste passo. Seja específico.}

**Exemplo:**

> Criar o arquivo de schema que valida os dados de entrada. Este arquivo define as regras de validação para email e senha antes de processar a requisição.

**Código:**

```{language}
// {CAMINHO COMPLETO E EXATO DO ARQUIVO}

{CÓDIGO COMPLETO - NÃO USE "..." OU PLACEHOLDER}
```

**Exemplo:**

```typescript
// src/schemas/auth.schema.ts
import { body } from "express-validator";

export const registerSchema = [
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Senha deve ter no mínimo 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("Senha deve conter letra maiúscula")
    .matches(/[0-9]/)
    .withMessage("Senha deve conter número"),
  body("name").trim().notEmpty().withMessage("Nome é obrigatório"),
];
```

**Explicação do código:**

{Explique linha a linha as partes importantes. Por que cada linha existe? O que faz?}

- Linha X-Y: {O que faz e por quê}
- Linha A-B: {O que faz e por quê}

**Exemplo:**

- `body('email')`: Pega o campo 'email' do request body
- `.isEmail()`: Valida se é um email válido
- `.normalizeEmail()`: Padroniza o email (lowercase, remove pontos desnecessários)
- `.isLength({ min: 8 })`: Valida comprimento mínimo de 8 caracteres
- `.matches(/[A-Z]/)`: Usa regex para exigir pelo menos uma letra maiúscula
- `.matches(/[0-9]/)`: Usa regex para exigir pelo menos um dígito

**Validação deste passo:**

{Como verificar se este passo está correto?}

- [ ] Arquivo criado em `src/schemas/auth.schema.ts`
- [ ] Imports estão corretos
- [ ] Exportação da função/classe funciona
- [ ] TypeScript compila sem erros

---

### Passo 2: {Título Descritivo}

**O que fazer:**
{Descrição detalhada}

**Código:**

```{language}
// {CAMINHO COMPLETO}

{CÓDIGO COMPLETO}
```

**Explicação do código:**

{Explicar linha a linha}

**Validação deste passo:**

- [ ] {Item 1}
- [ ] {Item 2}

---

### Passo 3: Continuar com mais passos conforme necessário

{Adicionar quantos passos forem necessários. Lembrar: cada passo deve ter código COMPLETO.}

---

## 🧪 Testes Obrigatórios

{Fornecer código COMPLETO dos testes. Todos os cenários listados abaixo devem ter testes.}

### Arquivo de teste: `{caminho/do/arquivo.spec.ts}`

```{language}
// {CAMINHO COMPLETO DO ARQUIVO DE TESTE}

{CÓDIGO COMPLETO DOS TESTES COM TODOS OS CENÁRIOS}
```

**Exemplo:**

```typescript
// src/__tests__/auth.controller.spec.ts
import request from "supertest";
import { app } from "../app";
import { UserRepository } from "../repositories/user.repository";

// Mock do repositório se necessário
jest.mock("../repositories/user.repository");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve registrar usuário com dados válidos", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "Senha123!",
      name: "New User",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toEqual({
      id: expect.any(String),
      email: "newuser@example.com",
      name: "New User",
    });
  });

  it("deve retornar 400 para email inválido", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "email-sem-arroba",
      password: "Senha123!",
      name: "Test User",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details).toBeDefined();
  });

  it("deve retornar 400 para senha fraca (< 8 caracteres)", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "Abc123",
      name: "Test User",
    });

    expect(response.status).toBe(400);
    expect(response.body.details[0].msg).toContain("8 caracteres");
  });

  it("deve retornar 409 para email duplicado", async () => {
    // Primeiro registro
    await request(app).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "Senha123!",
      name: "User 1",
    });

    // Segundo registro com mesmo email
    const response = await request(app).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "Senha123!",
      name: "User 2",
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("EMAIL_EXISTS");
  });
});
```

### Cenários a Testar

{Lista de TODOS os cenários que precisam ser testados. Inclua casos de sucesso E erro.}

| Cenário                    | Input                                       | Output Esperado                | ✓   |
| -------------------------- | ------------------------------------------- | ------------------------------ | --- |
| Registro válido            | email válido, senha válida, nome preenchido | 201 + token + dados do usuário | [ ] |
| Email inválido             | email sem @ ou incompleto                   | 400 VALIDATION_ERROR           | [ ] |
| Senha muito fraca          | senha com < 8 caracteres                    | 400 VALIDATION_ERROR           | [ ] |
| Senha sem letra maiúscula  | senha sem letra maiúscula (ex: "senha123")  | 400 VALIDATION_ERROR           | [ ] |
| Senha sem número           | senha sem dígito (ex: "Senha!")             | 400 VALIDATION_ERROR           | [ ] |
| Email duplicado            | email já cadastrado                         | 409 EMAIL_EXISTS               | [ ] |
| Nome vazio                 | name vazio ou whitespace                    | 400 VALIDATION_ERROR           | [ ] |
| Campo obrigatório faltando | requisição sem campo email/password/name    | 400 VALIDATION_ERROR           | [ ] |

### Como Executar os Testes

```bash
{COMANDO ESPECÍFICO PARA RODAR APENAS OS TESTES DESTA SUBTAREFA}
```

**Exemplo:**

```bash
# Rodar todos os testes de autenticação
npm test -- auth.controller.spec.ts

# Rodar com cobertura
npm test -- --coverage auth.controller.spec.ts

# Rodar um teste específico
npm test -- -t "deve registrar usuário com dados válidos"
```

---

## ✅ Checklist de Conclusão

Antes de marcar esta subtarefa como concluída, verifique TODOS os itens abaixo:

### Implementação

- [ ] Código implementado conforme descrito nos passos acima
- [ ] Nenhum `console.log()` ou `debugger` deixado no código
- [ ] Nenhum `TODO` ou `FIXME` sem issue linkada
- [ ] Imports organizados e sem imports não utilizados
- [ ] Tipagem TypeScript completa (sem `any`, sem tipos implícitos)
- [ ] Nenhuma variável desnecessária
- [ ] Código segue o padrão de nomenclatura do projeto

### Qualidade

- [ ] Todos os testes unitários passando (`npm test`)
- [ ] Testes de integração passando (se aplicável)
- [ ] Linter sem erros (`npm run lint`)
- [ ] Formatação ok (`npx prettier --write .`)
- [ ] Build sem erros (`npm run build`)

### Documentação

- [ ] Comentários adicionados em código complexo
- [ ] JSDoc adicionado em funções públicas
- [ ] README atualizado (se necessário)
- [ ] Tipos TypeScript exportados se necessário

### Revisão

- [ ] Auto-revisão do código feita (reler o próprio código)
- [ ] PR criado com descrição clara (referenciar esta subtarefa)
- [ ] Screenshots/vídeos anexados (se houver mudança visual)
- [ ] Testado manualmente via Postman/Insomnia (se for API)

---

## ⚠️ Riscos e Cuidados

{Tabela com riscos identificados, probabilidade, impacto e como evitar.}

| Risco     | Probabilidade    | Impacto          | Como Evitar                  |
| --------- | ---------------- | ---------------- | ---------------------------- |
| {Risco 1} | Alta/Média/Baixa | Alto/Médio/Baixo | {Ação preventiva específica} |
| {Risco 2} | ...              | ...              | ...                          |

**Exemplo:**

| Risco                           | Probabilidade | Impacto | Como Evitar                                               |
| ------------------------------- | ------------- | ------- | --------------------------------------------------------- |
| JWT_SECRET exposto no código    | Média         | Alto    | Sempre usar variáveis de ambiente (.env), NUNCA hardcoded |
| Senha armazenada em texto plano | Alta          | Alto    | Sempre usar bcrypt com salt >= 10 rounds                  |
| Validação incompleta de email   | Média         | Médio   | Testar casos edge (+, domínios especiais, internacionais) |

### Armadilhas Comuns (NÃO FAÇA ISSO!)

{Lista de erros comuns neste tipo de subtarefa e por que são errados.}

- ❌ {Erro comum 1 e por que é errado}
- ❌ {Erro comum 2 e por que é errado}

**Exemplo:**

- ❌ Não retornar `passwordHash` no response - O cliente nunca deve receber o hash da senha
- ❌ Usar `salt` < 10 no bcrypt - Menos seguro, mais rápido de quebrar
- ❌ Colocar `JWT_SECRET` no código - Vai ser exposto no repositório
- ❌ Não validar email no backend - Cliente pode falsificar dados
- ❌ Usar `Math.random()` para gerar tokens - Não é criptograficamente seguro

### Dicas de Implementação

{Dicas úteis que ajudam a fazer melhor.}

- 💡 {Dica útil 1}
- 💡 {Dica útil 2}

**Exemplo:**

- 💡 Use o Postman para testar a API manualmente antes de escrever os testes
- 💡 Configure o `.env.example` com os valores necessários para a documentação
- 💡 Valide email no backend mesmo que valide no frontend
- 💡 Use variáveis de ambiente para senhas de acesso (nunca hardcode)
- 💡 Teste com emails internacionais (não-ASCII) para validação robusta

---

## 🔗 Dependências

> ⚠️ **Lembrete**: dependências aqui se referem a **outras fatias verticais completas** — outro endpoint já mergeado, outra tela já navegável, outra configuração de ambiente. **Nunca** camadas isoladas da própria subtarefa. Se você está prestes a listar "schema", "DTO", "migration" ou "enum" como dependência externa, é sinal de que esses itens deveriam estar **dentro desta subtarefa**, não em uma anterior.

### Esta subtarefa depende de

{Outras subtarefas (entregáveis verticais completos) que DEVEM estar mergeadas antes de começar.}

- `[{STACK}] {Nome da subtarefa anterior — entregável completo}` - {Por que precisa estar pronto}

**Exemplo:**

- `[BACKEND] Endpoint POST /api/auth/register` - O frontend deste fluxo consome esse endpoint (já pronto e testado)
- `[INFRA] Configurar variáveis de ambiente JWT` - Pré-requisito de ambiente

### Subtarefas que dependem desta

{Quais outras fatias verticais serão desbloqueadas quando esta estiver mergeada.}

- `[{STACK}] {Nome da próxima subtarefa — também um entregável completo}` - {O que será desbloqueado}

**Exemplo:**

- `[FRONTEND] Tela de registro` - Passa a ter endpoint real para consumir
- `[QA] Testes E2E do fluxo de autenticação` - Fluxo completo torna-se testável

### Pode ser feita em paralelo com

{Quais fatias verticais NÃO têm dependência com esta e podem rodar simultaneamente.}

- `[{STACK}] {Nome de fatia paralela}` - {Por que não há dependência}

**Exemplo:**

- `[BACKEND] Endpoint POST /api/auth/logout` - Outra fatia vertical independente do mesmo módulo
- `[FRONTEND] Tela de recuperação de senha` - Consome outro endpoint, sem dependência com este

---

## 📚 Referências

### Documentação Oficial

{Links para documentação oficial das tecnologias usadas.}

- [{Nome da documentação}]({URL}) - {Para que usar}

**Exemplo:**

- [Express.js Documentation](https://expressjs.com/) - Como criar endpoints
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt) - Hash de senhas
- [JWT.io](https://jwt.io/) - Entender estrutura de JWT e debugar tokens
- [express-validator Guide](https://express-validator.github.io/docs/) - Validação de inputs

### Arquivos de Exemplo no Projeto

{Arquivos que existem no projeto e que você deve usar como referência.}

- `{caminho/arquivo-exemplo.ts}` - {O que copiar daqui}

**Exemplo:**

- `src/controllers/user.controller.ts` - Copie a estrutura geral de um controller
- `src/services/user.service.ts` - Padrão de como estruturar um service
- `src/__tests__/user.spec.ts` - Exemplo de teste de API com supertest

### Tech Spec Relacionada

{Referências para a Tech Spec original que originou esta subtarefa.}

- Seção {X.Y} da Tech Spec: {Descrição ou link}

**Exemplo:**

- Seção 3.1 "Fluxo de Autenticação": Explica o flow de login/registro
- Seção 4.2 "Decisões de Segurança": Explica por que usar bcrypt e JWT

---

## 🆘 Precisa de Ajuda?

Se você ficar preso em algum ponto da implementação, siga estes passos:

1. **Revise os arquivos de referência** listados na seção "Arquivos de Exemplo"
   - Compare sua implementação com o exemplo
   - Copie estruturas que funcionam

2. **Consulte a Tech Spec** original
   - Leia a seção relevante com mais detalhes
   - Procure por diagrama ou exemplo

3. **Pergunte no Slack**
   - Canal: `#{canal-relevante}`
   - Mencione: `@{pessoa-ou-team}`
   - Descreva: O que já tentou e onde ficou preso

4. **Documentação Oficial**
   - {links para docs das tecnologias}
   - {links para docs do projeto}

---

## Notas Importantes

- **Não pule nenhum passo** - Cada um é necessário
- **Siga o template exatamente** - Não improvise estrutura
- **Código completo** - Não use "..." ou placeholder
- **Testes obrigatórios** - Todos devem passar
- **Qualidade antes de velocidade** - Melhor fazer certo do que rápido
- **Pergunte dúvidas** - Melhor clarificar agora do que fazer errado
