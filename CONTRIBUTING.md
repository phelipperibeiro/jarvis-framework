# Contributing Guide

Obrigado por contribuir com o **spoiler-framework**.

Este documento define as convenções utilizadas no projeto para manter um fluxo de desenvolvimento consistente, facilitar code reviews e preservar um histórico Git organizado.

---

## 1. Índice

* [Princípios](#2-princípios)
* [Branch Convention](#3-branch-convention)
* [Commit Convention](#4-commit-convention)
* [Pull Request Convention](#5-pull-request-convention)
* [Git Flow](#6-git-flow)
* [Exemplos de Fluxos](#7-exemplos-de-fluxos)
* [Code Review](#8-code-review)
* [Breaking Changes](#9-breaking-changes)
* [Releases](#10-releases)
* [Checklist](#11-checklist)
* [Boas Práticas](#12-boas-práticas)

---

# 2. Princípios

As contribuições devem priorizar:

* código simples e legível;
* mudanças pequenas e focadas;
* commits semânticos;
* branches com propósito claro;
* Pull Requests fáceis de revisar;
* testes quando aplicáveis;
* documentação quando necessária;
* compatibilidade com versões existentes;
* histórico Git organizado.

A regra principal é:

> **Uma mudança lógica deve representar uma unidade lógica no Git.**

Evite misturar funcionalidades, refatorações e correções não relacionadas no mesmo commit ou Pull Request.

---

# 3. Branch Convention

As branches devem seguir uma nomenclatura padronizada.

## 3.1 Tipos de branch

| Prefixo     | Uso                          |
| ----------- | ---------------------------- |
| `feature/`  | Nova funcionalidade          |
| `fix/`      | Correção de bug              |
| `hotfix/`   | Correção urgente em produção |
| `refactor/` | Refatoração                  |
| `perf/`     | Melhoria de performance      |
| `docs/`     | Documentação                 |
| `test/`     | Testes                       |
| `build/`    | Build ou dependências        |
| `ci/`       | CI/CD                        |
| `chore/`    | Manutenção                   |

---

## 3.2 Formato

```text
<type>/<description>
```

Exemplos:

```text
feature/add-authentication
fix/token-validation
refactor/config-loader
perf/cache-lookup
docs/update-installation
test/authentication
build/update-dependencies
ci/add-release-workflow
chore/update-eslint
```

Utilize:

* letras minúsculas;
* palavras separadas por `-`;
* nomes curtos e objetivos;
* inglês.

Evite:

```text
Feature/NovaFuncionalidade
minha-branch
branch-do-felipe
teste
fix
changes
```

Prefira:

```text
feature/add-authentication
fix/token-validation
```

---

## 3.3 Branch principal

A branch principal do projeto é:

```text
main
```

A `main` deve permanecer estável e pronta para release.

Não devem ser realizados commits diretamente na `main`.

As alterações devem passar por Pull Request.

---

# 4. Commit Convention

O projeto utiliza **Conventional Commits**.

Formato:

```text
<type>(<scope>): <description>
```

Exemplo:

```text
feat(auth): add JWT authentication
```

O `scope` é opcional.

---

## 4.1 Tipos

| Type       | Descrição                                 |
| ---------- | ----------------------------------------- |
| `feat`     | Nova funcionalidade                       |
| `fix`      | Correção de bug                           |
| `refactor` | Refatoração                               |
| `perf`     | Melhoria de performance                   |
| `test`     | Testes                                    |
| `docs`     | Documentação                              |
| `style`    | Formatação/estilo sem alteração de lógica |
| `build`    | Build ou dependências                     |
| `ci`       | CI/CD                                     |
| `chore`    | Manutenção                                |
| `revert`   | Reversão de commit                        |

---

## 4.2 Exemplos

### Feature

```text
feat(auth): add JWT authentication
```

### Bug fix

```text
fix(auth): handle expired tokens
```

### Refactoring

```text
refactor(config): simplify configuration loader
```

### Performance

```text
perf(cache): reduce lookup overhead
```

### Tests

```text
test(auth): add token validation tests
```

### Documentation

```text
docs: update installation guide
```

### CI

```text
ci: add automated release workflow
```

### Build

```text
build: update dependencies
```

### Chore

```text
chore: remove obsolete configuration
```

---

## 4.3 Description

A descrição deve:

* ser objetiva;
* utilizar inglês;
* começar em minúsculo;
* utilizar verbo no imperativo;
* não terminar com ponto.

Preferir:

```text
feat(api): add user endpoint
```

Em vez de:

```text
feat(api): Added user endpoint.
```

---

## 4.4 Scope

O `scope` identifica a área afetada.

Exemplos:

```text
feat(auth): add authentication
fix(cli): handle invalid command
refactor(config): simplify loader
test(api): add endpoint tests
```

Scopes devem ser utilizados quando adicionarem contexto relevante.

Não é obrigatório utilizar scope.

---

## 4.5 Body

Para alterações simples, apenas a primeira linha é suficiente.

```text
fix(api): handle invalid request
```

Para alterações mais complexas, utilize um body:

```text
fix(api): handle invalid request

The API previously returned an internal server error
when receiving malformed input.

The validation layer now returns a structured
validation error before reaching the service layer.
```

---

## 4.6 Breaking Changes

Breaking changes devem ser explicitamente identificadas.

Utilize `!`:

```text
feat(config)!: change configuration format
```

Ou:

```text
feat(config): change configuration format

BREAKING CHANGE: configuration files now require
the `version` property.
```

---

## 4.7 Bons commits

```text
feat(cli): add login command
```

```text
fix(auth): prevent expired token reuse
```

```text
refactor(api): simplify request validation
```

```text
perf(database): reduce redundant queries
```

---

## 4.8 Commits que devem ser evitados

Evite:

```text
update
```

```text
fix
```

```text
changes
```

```text
stuff
```

```text
wip
```

```text
final
```

```text
final2
```

Prefira:

```text
fix(cli): handle expired session
```

---

# 5. Pull Request Convention

Toda alteração relevante deve ser submetida através de Pull Request.

O objetivo do PR é permitir:

* revisão de código;
* discussão técnica;
* validação dos testes;
* validação do CI;
* rastreabilidade da mudança;
* documentação da decisão técnica.

---

## 5.1 Título do Pull Request

O título deve seguir a mesma convenção dos commits:

```text
<type>(<scope>): <description>
```

Exemplos:

```text
feat(auth): add JWT authentication
```

```text
fix(cli): handle expired sessions
```

```text
refactor(config): simplify configuration loader
```

```text
docs: update installation guide
```

---

## 5.2 Estrutura do Pull Request

Um PR deve conter:

```markdown
## Description

Describe what was changed and why.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

Describe how the changes were tested.

## Breaking Changes

Describe any breaking changes.

## Checklist

- [ ] Tests added or updated
- [ ] Documentation updated
- [ ] CI passes
- [ ] No breaking changes
```

---

## 5.3 Exemplo

### Título

```text
feat(auth): add JWT authentication
```

### Descrição

```markdown
## Description

Adds JWT authentication to the API.

## Changes

- Add JWT token generation
- Add token validation middleware
- Add authentication configuration
- Add authentication tests

## Testing

- Unit tests
- Integration tests
- Manual API validation

## Breaking Changes

None.

## Checklist

- [x] Tests added or updated
- [x] Documentation updated
- [x] CI passes
- [x] No breaking changes
```

---

# 6. Git Flow

O projeto utiliza um fluxo baseado em Pull Requests.

Fluxo padrão:

```text
main
  │
  ├── feature/add-authentication
  │
  ├── fix/token-validation
  │
  └── refactor/config-loader
          │
          ▼
     Pull Request
          │
          ▼
         main
```

---

## 6.1 Criando uma feature

Atualize a `main`:

```bash
git checkout main
git pull origin main
```

Crie a branch:

```bash
git checkout -b feature/add-authentication
```

Implemente a alteração.

Depois:

```bash
git status
git add .
git commit -m "feat(auth): add JWT authentication"
```

Envie a branch:

```bash
git push -u origin feature/add-authentication
```

Abra o Pull Request:

```text
feature/add-authentication
        ↓
      main
```

---

## 6.2 Correção de bug

Atualize a `main`:

```bash
git checkout main
git pull origin main
```

Crie a branch:

```bash
git checkout -b fix/token-validation
```

Faça a correção:

```bash
git add .
git commit -m "fix(auth): handle expired tokens"
```

Envie:

```bash
git push -u origin fix/token-validation
```

Abra o PR:

```text
fix/token-validation
        ↓
       main
```

---

## 6.3 Refatoração

```bash
git checkout main
git pull origin main

git checkout -b refactor/config-loader
```

Depois:

```bash
git add .
git commit -m "refactor(config): simplify configuration loader"

git push -u origin refactor/config-loader
```

---

# 7. Exemplos de Fluxos

## 7.1 Feature completa

```text
                 ┌─────────────────────┐
                 │        main         │
                 └──────────┬──────────┘
                            │
                            │ checkout
                            ▼
                 ┌─────────────────────┐
                 │ feature/add-auth    │
                 └──────────┬──────────┘
                            │
                       commits
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Pull Request      │
                 └──────────┬──────────┘
                            │
                         review
                            │
                            ▼
                 ┌─────────────────────┐
                 │        main         │
                 └─────────────────────┘
```

---

## 7.2 Feature com múltiplos commits

Uma feature pode possuir vários commits:

```text
feat(auth): add authentication service

test(auth): add authentication tests

docs(auth): document authentication flow
```

Após revisão, o histórico pode ser mantido dessa forma ou consolidado, dependendo da estratégia adotada pelo projeto.

---

## 7.3 Correção durante desenvolvimento

Imagine que uma feature esteja sendo desenvolvida:

```text
feature/add-authentication
```

Durante o desenvolvimento é encontrado um bug.

O commit pode ser:

```text
fix(auth): handle expired tokens
```

Não é necessário criar outra branch se a correção fizer parte da mesma feature.

---

# 8. Code Review

Todo Pull Request deve ser revisado antes do merge.

O reviewer deve observar principalmente:

### Funcionalidade

* A alteração resolve o problema?
* O comportamento esperado está correto?
* Existem casos extremos?

### Código

* O código é legível?
* A solução é simples?
* Existe duplicação desnecessária?
* A arquitetura existente foi respeitada?

### Testes

* Existem testes suficientes?
* Os casos relevantes foram cobertos?
* Os testes existentes continuam passando?

### Segurança

* Existem dados sensíveis expostos?
* Entradas externas são validadas?
* Existem vulnerabilidades óbvias?

### Performance

* A alteração adiciona operações desnecessárias?
* Existem consultas ou chamadas repetitivas?
* Existe algum impacto relevante de performance?

### Documentação

* A alteração exige documentação?
* A documentação existente continua correta?

---

# 9. Breaking Changes

Breaking changes exigem atenção especial.

Exemplos:

* alteração de API pública;
* remoção de comandos;
* alteração de parâmetros;
* alteração de comportamento esperado;
* alteração de formato de configuração;
* alteração de contratos públicos;
* remoção de funcionalidades.

Exemplo:

```text
feat(cli)!: change login command arguments
```

Body:

```text
BREAKING CHANGE: the login command no longer accepts
the `--username` argument and now uses `--email`.
```

Pull Requests contendo breaking changes devem explicar claramente:

1. o comportamento anterior;
2. o novo comportamento;
3. o impacto;
4. como migrar;
5. exemplos atualizados.

---

# 10. Releases

As releases devem ser baseadas em **Semantic Versioning (SemVer)**.

Formato:

```text
MAJOR.MINOR.PATCH
```

Exemplo:

```text
2.4.1
```

---

## 10.1 MAJOR

Alterações incompatíveis:

```text
1.5.0 → 2.0.0
```

Normalmente associadas a:

```text
BREAKING CHANGE
```

---

## 10.2 MINOR

Nova funcionalidade compatível:

```text
1.5.0 → 1.6.0
```

Normalmente associada a:

```text
feat
```

---

## 10.3 PATCH

Correções compatíveis:

```text
1.5.0 → 1.5.1
```

Normalmente associada a:

```text
fix
```

---

# 11. Checklist

Antes de abrir um Pull Request:

```markdown
### Code

- [ ] Código segue os padrões do projeto
- [ ] Não existem alterações desnecessárias
- [ ] Não existem credenciais ou secrets no código

### Tests

- [ ] Testes existentes continuam passando
- [ ] Novos testes foram adicionados quando necessário
- [ ] Casos relevantes foram testados

### Documentation

- [ ] Documentação foi atualizada quando necessário

### Git

- [ ] Branch segue o padrão
- [ ] Commits seguem Conventional Commits
- [ ] Histórico não contém commits desnecessários

### Pull Request

- [ ] Título segue o padrão
- [ ] Descrição explica a alteração
- [ ] Breaking changes estão documentadas
- [ ] CI está passando
```

---

# 12. Boas Práticas

## 12.1 Mantenha commits pequenos

Prefira:

```text
feat(auth): add authentication service
test(auth): add authentication tests
docs(auth): document authentication
```

Em vez de:

```text
feat(auth): implement everything related to authentication
```

---

## 12.2 Não misture assuntos

Evite:

```text
feat(auth): add authentication and update Docker configuration
```

Prefira:

```text
feat(auth): add authentication
```

e:

```text
build: update Docker configuration
```

---

## 12.3 Não faça commits diretamente na main

Evite:

```bash
git checkout main
git commit
git push
```

Utilize:

```text
branch
   ↓
commit
   ↓
push
   ↓
Pull Request
   ↓
review
   ↓
main
```

---

## 12.4 Mantenha a branch atualizada

Antes de abrir ou atualizar um PR:

```bash
git checkout main
git pull origin main
```

Depois atualize sua branch conforme a estratégia adotada pelo projeto.

Com merge:

```bash
git checkout feature/add-authentication
git merge main
```

Ou com rebase:

```bash
git checkout feature/add-authentication
git rebase main
```

Não faça rebase de uma branch compartilhada sem alinhar previamente com os demais colaboradores.

---

## 12.5 Evite commits artificiais

Evite:

```text
fix
fix again
fix final
fix final 2
```

Se necessário, corrija o histórico local antes de abrir o PR.

Exemplo:

```bash
git commit --amend
```

ou, quando apropriado:

```bash
git rebase -i
```

---

# 13. Resumo

O fluxo recomendado é:

```text
             ┌──────────────┐
             │     main     │
             └──────┬───────┘
                    │
                    ▼
          criar uma branch
                    │
                    ▼
       feature/fix/refactor/...
                    │
                    ▼
              desenvolver
                    │
                    ▼
              fazer commits
                    │
                    ▼
              push da branch
                    │
                    ▼
            Pull Request
                    │
                    ▼
              Code Review
                    │
                    ▼
              CI / Checks
                    │
                    ▼
                  Merge
                    │
                    ▼
                  main
                    │
                    ▼
                Release
```

### Regras essenciais

```text
Branch:
<type>/<description>

Commit:
<type>(<scope>): <description>

Pull Request:
<type>(<scope>): <description>

Release:
MAJOR.MINOR.PATCH
```

Exemplo completo:

```text
Branch:
feature/add-authentication

Commit:
feat(auth): add JWT authentication

Pull Request:
feat(auth): add JWT authentication

Release:
2.3.0
```

---

## Referências

* Conventional Commits: https://www.conventionalcommits.org/
* Semantic Versioning: https://semver.org/
* Git Documentation: https://git-scm.com/doc
* GitHub Pull Requests: https://docs.github.com/en/pull-requests
