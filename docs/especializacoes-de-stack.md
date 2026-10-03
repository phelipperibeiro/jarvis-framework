# Especializações de stack — adaptar o Jarvis ao seu projeto

Guia para quem desenvolve: como o Jarvis trabalha com **qualquer stack** (Go, PHP, Java, Vue, React, NestJS…) sem você editar arquivos do framework.

## Em uma frase

O framework traz uma **skill base neutra** para backend e para frontend, e cada projeto registra no `ENV.md` as **especializações** da sua stack. Os comandos `eng.*` carregam a base **mais** as especializações registradas.

## Os conceitos

| Conceito | O que é |
|----------|---------|
| **Skill base** | `eng-backend` e `eng-frontend`. Guardam o que vale em **qualquer** linguagem ou framework (segurança, erros, testes, API, estado, acessibilidade…). Estão sempre ativas. |
| **Especialização** | Um skill com o que **depende da stack** (convenções, comandos, estrutura, padrões do seu projeto). Soma-se à base, nunca a substitui. Nome: `eng-<área>-<stack>` (por exemplo, `eng-backend-golang`). |
| **Lista de especializações** | `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS` no `ENV.md`: os nomes dos skills que o projeto quer carregar, separados por vírgula. Vazia significa "só a skill base". |
| **Marcação** | Todo skill tem `metadata.area` e, se for especialização, `metadata.stack` no frontmatter. É assim que o framework o reconhece. |

A pergunta que separa os dois: **"isso continua válido se eu mudar de linguagem?"** Se sim, vai na base. Se não, vai numa especialização.

## O que acontece em cada comando `eng.*`

1. Ao iniciar, o comando confere os skills instalados: se algum não tem `metadata.area` reconhecida, **o comando é interrompido** e lista quais (marque a área ou remova o skill).
2. Se o trabalho é de backend ou de frontend, lê a lista da área no `ENV.md`, carrega a skill base e cada especialização registrada, e informa o que carregou.
3. Se um nome da lista não existe em `$IDE/skills/`, avisa na hora, mostra como ajustar (`/jarvis-list-specializations`) e segue com a base e os demais itens.

## Como adaptar o projeto à sua stack

### Opção 1: no `/jarvis-init` (recomendada)

Ao rodar `/jarvis-init` (criação, atualização ou **Upgrade (C)**), o passo opcional **"adicionar as stacks"**:

1. lista as especializações instaladas, registradas ou não, e deixa registrar uma direto;
2. **lê** o workspace (só leitura) e **mostra** as stacks que encontrou, por projeto e por área, antes de sugerir qualquer coisa;
3. para cada stack, sugere **registrar o skill que já existe** ou **criar um novo**; o que você não aceitar não muda;
4. mostra um resumo das listas.

Você pode pular o passo e acrescentar stacks depois. O tempo de referência é de uns 10 minutos, sem ser um limite.

A detecção usa a tabela de sinais (`skills/jarvis-init/assets/sinais-de-stack.md`): `go.mod`, `composer.json`, `pom.xml`, `build.gradle`, `pyproject.toml`, `requirements.txt`, `Cargo.toml` e as dependências do `package.json` (`@nestjs/*`, `express`, `vue`, `quasar`, `react`, `next`). Uma stack fora da tabela não é detectada: escolha da listagem ou crie com o criador.

### Opção 2: criar a especialização a qualquer momento

```
/jarvis-create-specialization backend golang
```

O criador:

1. valida a área (só `backend` e `frontend`) e o nome da stack (letras minúsculas, números e hífen);
2. confere se a lista da área existe no `ENV.md` (senão, orienta o `/jarvis-init` com Upgrade);
3. procura código no projeto (sem código, ele avisa e a skill base continua valendo);
4. **lê o projeto** (dependências, estrutura, até 15 arquivos de código por área, testes e lint), sem ler `.env*`, chaves nem credenciais;
5. gera o skill (`SKILL.md` e `references/` só dos temas que o projeto confirma), citando o arquivo de origem de cada afirmação e marcando como **"A validar"** o que não confirmou;
6. **mostra tudo para você revisar**: confirmar, ajustar ou cancelar. **Nada é gravado antes da sua confirmação**;
7. grava `eng-backend-golang` em `$IDE/skills/` e acrescenta o nome ao **final** da lista, sem duplicar nem mexer nos outros itens.

Se a pasta já existir, se o item já estiver na lista ou se o nome coincidir com um skill do framework, ele pergunta antes de sobrescrever. No caso do framework, avisa que o `jarvis init --force` sobrescreve a pasta, e sugere outro nome.

### Opção 3: registrar um skill que já existe

Veja o que há com `/jarvis-list-specializations` e acrescente o nome à lista da área no `ENV.md`:

```
BACKEND_SPECIALIZATIONS=eng-backend-nestjs,eng-backend-golang
```

Formato: separado por vírgula (a leitura aceita colchetes e aspas, mas o framework grava sempre com vírgula). Cada item é um nome de skill em minúsculas, números e hífen.

## Especializações que já vêm no framework

Os skills de apoio abaixo viram especializações quando você os registra: `eng-backend-nestjs`, `eng-backend-rabbitmq`, `eng-backend-arch-c4`, `eng-backend-microservices-trace`, `eng-frontend-microfrontend` e `eng-frontend-design-system`.

## Nomes e áreas dos skills

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Engenharia por área | `eng-<área>-<nome>` | `eng-qa-gate`, `eng-data-engineer` |
| Especialização | `eng-<backend\|frontend>-<stack>` | `eng-backend-golang` |
| Engenharia global | `eng-global-<nome>` | `eng-global-pr` |
| Produto | `product-<nome>` | `product-specs` |
| Transversal do framework | `jarvis-<nome>` | `jarvis-init`, `jarvis-create-specialization` |

Áreas reconhecidas: `qa`, `data`, `ai`, `frontend`, `backend`, `security`, `scraper`, `devops`, `global` e `product`. A convenção completa está em [`skills/AGENTS.md`](../skills/AGENTS.md).

## Atualizando de uma versão anterior

1. `jarvis init --force`: as pastas dos skills renomeados ou removidos somem e o `ENV.md` é preservado.
2. `/jarvis-init` → **Upgrade (C)**: acrescenta as duas listas vazias (sem elas, os comandos `eng.*` de backend e de frontend param) e oferece o passo "adicionar as stacks".
3. **Skills criados por você** sem `metadata.area` bloqueiam os `eng.*`: marque a área ou remova.
4. Nomes antigos (`eng-nestjs`, `eng-pr`, `init-jarvis`…) deixaram de existir; troque pelos novos. A tabela completa está nas notas de release.

## Limites

- Só backend e frontend têm especialização nesta versão.
- O criador e o passo do `/jarvis-init` são **instruções** seguidas pela IA: leia o que ela mostra antes de confirmar.
- Só Claude Code e Cursor foram verificados.

## Referências

- Regras: [`eng.specializations-rules.md`](../rules/engineering/eng.specializations-rules.md) e [`eng.skills-rules.md`](../rules/engineering/eng.skills-rules.md)
- Skills: [`jarvis-create-specialization`](../skills/jarvis-create-specialization/SKILL.md), [`jarvis-list-specializations`](../skills/jarvis-list-specializations/SKILL.md) e [`jarvis-init`](../skills/jarvis-init/SKILL.md)
- Template do `ENV.md`: [`templates/ENV-template.md`](../templates/ENV-template.md) (seção "Especializações de stack")
