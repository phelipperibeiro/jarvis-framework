# Sinais de stack — detecção do passo "adicionar as stacks"

> Tabela mantida pelo framework. O passo 9 do `/jarvis-init` a usa para identificar, **só lendo**, as stacks de backend e de frontend dos projetos do workspace. Para suportar uma stack nova, acrescente uma linha à tabela (não é preciso mudar o fluxo).

## Como a detecção usa esta tabela

A detecção tem **dois níveis**, ambos só de leitura:

1. **Linguagem**, pelo arquivo de manifesto do projeto (primeira coluna).
2. **Framework**, pelas dependências declaradas no manifesto (segunda coluna).

Leia só manifestos e dependências. **Nunca leia** `.env*`, chaves, certificados nem arquivos de credenciais. A análise **não altera** arquivos do projeto nem as listas do `ENV.md`.

## Tabela de sinais

| Sinal (arquivo) | Dependência que indica | Área | Stack sugerida |
|-----------------|------------------------|------|----------------|
| `go.mod` | (qualquer) | backend | `golang` |
| `composer.json` | (qualquer) | backend | `php` |
| `pom.xml` | (qualquer) | backend | `java` |
| `build.gradle` | (qualquer) | backend | `java` |
| `pyproject.toml` | (qualquer) | backend | `python` |
| `requirements.txt` | (qualquer) | backend | `python` |
| `Cargo.toml` | (qualquer) | backend | `rust` |
| `package.json` | `@nestjs/*` | backend | `nestjs` |
| `package.json` | `express` | backend | `express` |
| `package.json` | `vue` ou `quasar` | frontend | `vue` |
| `package.json` | `react` ou `next` | frontend | `react` |
| `package.json` | (nenhuma das anteriores) | perguntar | — |

## Regras de leitura

- **Linha "perguntar":** quando o manifesto não deixa claro se o projeto é de backend ou de frontend (por exemplo, um `package.json` sem framework reconhecido), mostre o projeto e **pergunte a área** à pessoa.
- **Backend e frontend no mesmo projeto:** quando um projeto reúne os dois (por exemplo, `composer.json` com `laravel/framework` e arquivos `.blade.php`), mostre **as duas possibilidades** e deixe a pessoa escolher.
- **Mais de uma dependência no mesmo `package.json`:** cada área reconhecida vira uma stack do projeto (por exemplo, `vue` no frontend e `express` no backend).
- **Stack fora da tabela:** não é detectada. A pessoa pode escolher uma especialização da listagem ou criar uma pelo `/jarvis-create-specialization`.
- **Nome sugerido:** é uma sugestão. A pessoa pode renomear a stack antes de criar (por exemplo, `vue3-quasar` em vez de `vue`). O nome final segue `^[a-z0-9][a-z0-9-]*$`.

## Como o nome da stack é comparado com os skills instalados

Compare a stack sugerida com o campo `metadata.stack` do frontmatter de cada `$IDE/skills/*/SKILL.md` **da mesma área**:

```bash
for f in $IDE/skills/*/SKILL.md; do
  awk -v f="$f" 'BEGIN{fm=0} /^---[[:space:]]*$/{fm++; next}
    fm==1 && /^name:/{n=$2}
    fm==1 && /^[[:space:]]+area:/{a=$2}
    fm==1 && /^[[:space:]]+stack:/{s=$2}
    END{printf "%s|area=%s|stack=%s\n", n, a, s}' "$f"
done
```

- **Algum skill tem a mesma `area` e a mesma `stack`:** ele é a sugestão de **registrar o existente**.
- **Nenhum tem:** a sugestão é **criar um novo** pelo `/jarvis-create-specialization {área} {stack}`.
