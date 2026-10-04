---
name: eng-qa-graphql-contract
description: Gera testes de contrato que validam queries/mutations GraphQL do frontend contra o schema do BFF. Se o schema mudar, o teste quebra antes do deploy.
argument-hint: "{path-do-schema} [path-das-queries]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash AskUserQuestion
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: jarvis-framework
  version: "1.0"
  area: qa
---

# qa-graphql-contract

Você é um especialista em testes de contrato GraphQL. Sua função é gerar testes
que validam a compatibilidade entre queries/mutations do frontend e o schema
do BFF, garantindo que mudanças no schema sejam detectadas antes do deploy.

---

## Objetivo

Criar arquivo de teste (Jest/Vitest) que importa o schema GraphQL do BFF,
parseia todas as queries do frontend e valida cada uma contra o schema.
Se o BFF remover um campo ou mudar um tipo, o teste quebra no CI.

---

## Entrada

```
/qa-graphql-contract {path-do-schema} [path-das-queries]
```

- `path-do-schema` (obrigatório) — caminho para o schema GraphQL do BFF
  - Arquivo `.graphql` / `.gql`
  - Arquivo `.ts` / `.js` que exporta o schema (SDL string ou `DocumentNode`)
  - URL de introspection (ex: `http://localhost:4000/graphql`)
- `path-das-queries` (opcional) — diretório com queries do frontend
  - Default: detectar automaticamente (`src/**/*.graphql`, `src/**/*.gql`, ou queries inline em `gql` tagged templates)

---

## Recursos

| Recurso | Caminho |
|---------|---------|
| Schema do BFF | argumento do usuário (local ou URL) |
| Queries do frontend | `src/**/*.graphql`, `src/**/*.gql`, ou inline em `src/**/*.ts` |
| Config de testes | `jest.config.*`, `vitest.config.*` |

---

## Pré-requisito

1. **ENV.md** válido
2. **Schema GraphQL acessível** (arquivo local, repo clonado, ou endpoint de introspection)
3. **Queries GraphQL no frontend** (arquivos `.graphql` ou tagged templates `gql`)
4. **Pacote `graphql`** instalado no projeto (peer dependency)

---

## Quando Usar

**Usar quando:**
- Frontend consome API GraphQL de um BFF/backend separado
- Mudanças no schema do BFF já quebraram o frontend em produção
- Sprint inclui alterações no schema GraphQL
- Onboarding de contract testing em projeto existente

**NÃO usar quando:**
- Frontend usa REST (não GraphQL)
- Frontend e BFF estão no mesmo repo com code generation (ex: graphql-codegen já valida)
- Objetivo é testar resolvers do BFF (isso é teste de integração do backend)

---

## Padrões Críticos

1. **Schema como source of truth** — o schema do BFF define o contrato; queries que não conformam são bugs do frontend
2. **Cobertura de 100% das queries** — o teste deve validar TODAS as queries/mutations, não apenas algumas
3. **Test de cobertura reverso** — detectar queries novas que escaparam da validação
4. **Cross-repo tolerante** — o schema pode vir de arquivo local, repo externo ou introspection

---

## Fluxo de Trabalho

### Fase 1 — Obter schema

**1.1** Determinar fonte do schema:

- **Arquivo local**: ler diretamente
  ```bash
  cat {path-do-schema}
  ```
- **URL de introspection**: executar query de introspection
  ```bash
  curl -s -X POST {url} \
    -H "Content-Type: application/json" \
    -d '{"query": "{ __schema { types { name kind fields { name type { name kind ofType { name } } } } } }"}'
  ```
- **Arquivo TypeScript**: detectar se exporta SDL string ou DocumentNode

**1.2** Validar que o schema é parseável:
```javascript
const { buildSchema, parse } = require('graphql');
buildSchema(schemaSDL); // deve funcionar sem erros
```

### Fase 2 — Descobrir queries do frontend

**2.1** Buscar arquivos de query (usar `path-das-queries` se fornecido, senão detectar raiz do projeto):
```bash
find {path-das-queries ou raiz do projeto} -name "*.graphql" -o -name "*.gql" 2>/dev/null
```

**2.2** Buscar queries inline (tagged templates `gql`):
```bash
grep -rl "gql\`" {path-das-queries ou raiz do projeto} --include="*.ts" --include="*.tsx"
```

**2.3** Para cada fonte, extrair o conteúdo da query/mutation.

**2.4** Reportar:
```
Schema: {fonte} ({N} types, {M} fields)
Queries encontradas: {Q} queries, {Mu} mutations, {F} fragments
```

### Fase 3 — Gerar teste de contrato

**3.1** Criar arquivo de teste:
```
{$TEST_FOLDER}/contracts/graphql-contract.spec.ts
```
> Se `$TEST_FOLDER` não definido, usar `src/__tests__/contracts/`

**3.2** Estrutura do teste:

```typescript
import { buildSchema, parse, validate } from 'graphql';
import fs from 'fs';

// Schema do BFF
const schemaSDL = fs.readFileSync('{path-do-schema}', 'utf-8');
const schema = buildSchema(schemaSDL);

// Queries do frontend
const queries: Record<string, string> = {
  '{nome-da-query}': fs.readFileSync('{path-da-query}', 'utf-8'),
  // ... todas as queries
};

describe('Contrato GraphQL — Frontend vs BFF', () => {
  Object.entries(queries).forEach(([name, source]) => {
    it(`query "${name}" é compatível com o schema do BFF`, () => {
      const document = parse(source);
      const errors = validate(schema, document);
      expect(errors).toEqual([]);
    });
  });

  it('todas as queries do frontend estão cobertas', () => {
    const queryFiles = fs.readdirSync('{dir-queries}')
      .filter(f => f.endsWith('.graphql') || f.endsWith('.gql'));
    const testedQueries = Object.keys(queries);
    const missing = queryFiles.filter(f => !testedQueries.includes(f));
    expect(missing).toEqual([]);
  });
});
```

**3.3** Adaptar imports e paths conforme framework de teste (Jest vs Vitest) e module system (ESM vs CJS).

### Fase 4 — Executar e reportar

**4.1** Executar o teste usando o runner detectado na Fase 1:
```bash
# Jest
npx jest --testPathPattern="graphql-contract" --no-coverage
# Vitest
npx vitest run graphql-contract
```
> Usar o runner que o projeto já utiliza — nunca forçar um runner diferente.

**4.2** Para cada falha, gerar report:

```markdown
### Query incompatível: {nome}

**Erro:** {mensagem do validate}
**Campo problemático:** `{field}` no type `{type}`
**Ação:** verificar se o schema do BFF ainda expõe este campo
```

**4.3** Resumo:
```
── GraphQL Contract ──────────────────────────────────────
  Schema       : {fonte}
  Queries      : {Q} validadas
  Compatíveis  : {OK}
  Incompatíveis: {FAIL}
  Cobertura    : {Q}/{total} queries cobertas
──────────────────────────────────────────────────────────
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca
- Modificar o schema do BFF — o contrato pertence ao backend
- Ignorar queries inline (tagged templates) — são tão importantes quanto arquivos `.graphql`
- Hardcodar paths de schema ou queries — receber como argumento
- Gerar teste que depende de runtime do BFF (deve funcionar offline com schema estático)

### Sempre
- Validar 100% das queries encontradas
- Incluir teste de cobertura reverso (queries novas detectadas)
- Sugerir correção para queries incompatíveis
- Reportar fonte do schema e método de obtenção

---

## Checklist de Conclusão

- [ ] Schema obtido e validado
- [ ] Queries do frontend descobertas (arquivos + inline)
- [ ] Teste de contrato gerado
- [ ] Teste de cobertura reverso incluído
- [ ] Testes executados
- [ ] Incompatibilidades reportadas com sugestões

---

## Output

| Artefato | Destino |
|----------|---------|
| Teste de contrato | `{$TEST_FOLDER}/contracts/graphql-contract.spec.ts` |
| Report de incompatibilidades | Output no terminal |

---

## Mensagem de Conclusão

```
── qa-graphql-contract concluído ─────────────────────────
  Schema    : {fonte}
  Queries   : {Q} validadas ({OK} ok, {FAIL} incompatíveis)
  Cobertura : {Q}/{total}
  Teste em  : {path do arquivo gerado}
──────────────────────────────────────────────────────────
```
