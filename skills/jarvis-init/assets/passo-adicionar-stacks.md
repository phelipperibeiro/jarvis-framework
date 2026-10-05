# Passo 9 — Adicionar as stacks (opcional)

> Fluxo completo do passo "adicionar as stacks" do `/jarvis-init`. O `SKILL.md` traz só o resumo e aponta para cá. A tabela de detecção está em [sinais-de-stack.md](sinais-de-stack.md).

## Objetivo

Deixar o projeto especializado em torno de 10 minutos (tempo de **referência**, não limite; o passo nunca é interrompido por passar dele), sem que a pessoa descreva a stack à mão: o framework lê o workspace, mostra as stacks que encontrou e, para cada uma, sugere registrar o skill que já existe ou criar um novo.

A **detecção por código e a criação de skill novo** (9.4-9.6) valem **só para backend e frontend** —
são as únicas áreas com universo de stack aberto. **Listar o que já está instalado e registrar
direto** (9.3) vale para as **6 áreas** com especialização: backend, frontend, qa, data, automation
e platform. As 4 últimas têm um conjunto fixo de skills pré-construídos (sem `metadata.stack`,
sem detecção por manifesto, sem criador) — só listar e registrar o que a pessoa aceitar.

## Regras gerais

### Nunca

- Alterar arquivos do projeto da pessoa: a análise **só lê**
- Gravar ou registrar algo que a pessoa não aceitou
- Duplicar um item na lista, ou remover itens existentes
- Ler `.env*`, chaves, certificados ou arquivos de credenciais
- Criar a variável da lista fora do sub-passo 9.1
- Sugerir antes de **mostrar o que encontrou** (sub-passo 9.4)

### Sempre

- Perguntar **uma coisa por vez**
- Deixar a pessoa **pular** o passo ou qualquer sugestão
- Mostrar o que encontrou **antes** de sugerir
- Reler o `ENV.md` depois de gravar uma lista

---

## 9.1 Conferir as variáveis das listas

Leia o `$IDE/ENV.md` e confirme que as **6 variáveis** existem (vazias valem):
`BACKEND_SPECIALIZATIONS`, `FRONTEND_SPECIALIZATIONS`, `QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS`, `PLATFORM_SPECIALIZATIONS`.

- Se **faltar** alguma, acrescente-a ao final do `ENV.md` com o valor padrão do `templates/ENV-template.md` (vazia para todas, **exceto `QA_SPECIALIZATIONS=eng-qa-planner`**) **antes** de oferecer o passo. Não altere nenhuma outra linha.
- Se existirem, siga.

## 9.2 Oferecer o passo

Pergunte, em texto:

```
Deseja adicionar especializações ao projeto agora?
(Leva em torno de 10 minutos como referência.)

A: Sim, adicionar especializações
B: Pular (o projeto usa só as skills base; dá para adicionar depois com
   /jarvis-list-specializations e /jarvis-create-specialization)
```

- **B (pular):** informe que as listas **ficam como estão** e siga para o passo 10. Nada é alterado.
- **A:** siga para o 9.3.

## 9.3 Listar as especializações instaladas (6 áreas)

Leia o frontmatter de cada `$IDE/skills/*/SKILL.md` (comando de comparação em [sinais-de-stack.md](sinais-de-stack.md)) e mostre as **especializações das 6 áreas**, estejam ou não registradas nas listas:

- Backend e frontend: skills com `metadata.area` correspondente **e** `metadata.stack`
- QA, data, automation, platform: skills com `metadata.area` correspondente **e sem** `metadata.stack` (exceto a própria skill base da área)

```
### Backend
| Skill | Stack | Registrada |
|-------|-------|------------|
| eng-backend-nestjs | nestjs | ➖ |

### Frontend
(nenhuma instalada)

### QA
| Skill | Registrada |
|-------|------------|
| eng-qa-planner | ✅ (padrão) |

### Data
(nenhuma instalada)

### Automation
(nenhuma instalada)

### Platform
(nenhuma instalada)
```

Pergunte: **"Quer registrar alguma delas agora?"** Se sim, registre pelo 9.6 e siga.

> Sub-passos 9.4-9.6 (detecção por código e criação de skill novo) valem **só para backend e frontend** — para QA/data/automation/platform, este sub-passo 9.3 já é o fluxo inteiro (listar + registrar).

## 9.4 Detectar as stacks do workspace (só leitura, só backend/frontend)

**Quais projetos analisar:**

1. `WORKSPACE_REPOS` do `ENV.md`, quando preenchido
2. Vazio: a raiz do workspace e as **subpastas com `.git/`**
3. Monorepos sem `.git` por pacote: procure manifestos **até 2 níveis** de profundidade

**Ignore sempre** `node_modules`, `vendor`, `.git` e pastas de build.

**Como ler:** com `Read`, `Glob` e `Grep`, conforme a tabela de [sinais-de-stack.md](sinais-de-stack.md): o manifesto indica a linguagem e as dependências indicam o framework. **Só leia manifestos e dependências.**

**Mostre o que encontrou ANTES de sugerir qualquer coisa**, por projeto e por área, somando os projetos:

```
Encontrei:

| Projeto | Área | Stack | Sinal |
|---------|------|-------|-------|
| proj-php | backend | php | composer.json |
| proj-vue | frontend | vue | package.json (vue, quasar) |

Por área: backend = php; frontend = vue
```

**Casos:**

- **Nenhuma stack identificada, ou o projeto não tem código:** informe, diga que a pessoa segue **só com a skill base**, e ofereça escolher uma especialização da listagem (9.3) ou criar uma pelo `/jarvis-create-specialization`.
- **Manifesto ambíguo** (por exemplo, `package.json` sem framework reconhecido): mostre o projeto e **pergunte a área** (backend ou frontend).
- **Projeto com backend e frontend** (por exemplo, `composer.json` com Laravel e `.blade.php`): mostre **as duas possibilidades** e deixe a pessoa escolher.
- **Stack fora da tabela:** não é detectada; ofereça a listagem ou o criador.

## 9.5 Sugerir uma ação por stack

Para cada stack encontrada, compare-a com o campo `stack` dos skills instalados **da mesma área** (comando em [sinais-de-stack.md](sinais-de-stack.md)):

- **Existe skill com a mesma `area` e `stack`:** sugira **registrar o existente**. A pessoa pode pedir um novo em vez disso.
- **Não existe:** sugira **criar** pelo `/jarvis-create-specialization {área} {stack}`. A pessoa pode **renomear a stack** antes de criar (por exemplo, `vue3-quasar` em vez de `vue`; o nome final segue `^[a-z0-9][a-z0-9-]*$`).

```
Para backend / php: não há skill especializado. Sugiro criar (eng-backend-php).
  A: Criar     B: Renomear a stack     C: Pular esta stack
```

A pessoa escolhe quais sugestões aceitar. **O que ela não aceita não é alterado.**

## 9.6 Aplicar o que foi aceito (um item por vez)

**Registrar um skill existente (qualquer uma das 6 áreas):**

1. Leia a linha `{VAR}=...` da área (`BACKEND_SPECIALIZATIONS`, `FRONTEND_SPECIALIZATIONS`, `QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS` ou `PLATFORM_SPECIALIZATIONS`) e separe os itens (aceita colchetes, espaços e aspas):
   `grep -E '^{VAR}=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'`
2. Se o nome do skill **não está** na lista: acrescente ao **final**. Os demais itens ficam como estavam; só o formato da linha é normalizado (**separado por vírgula, sem colchetes**).
3. Se **já está**: não duplique e avise.
4. Edite **só a linha dessa variável** e **releia** o `ENV.md` para confirmar.

**Criar um skill novo (só backend/frontend):** chame `/jarvis-create-specialization {área} {stack}`. O criador lê o projeto, mostra o skill para revisão e só grava e registra depois da confirmação da pessoa. Faça **uma stack por vez** e espere o criador terminar antes da próxima. Para QA/data/automation/platform não há criador — só registrar o que já existe (9.6, passo 1-4).

## 9.7 Resumo final

Mostre o que ficou configurado:

```
✅ Especializações configuradas

📋 BACKEND_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 FRONTEND_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 QA_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 DATA_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 AUTOMATION_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 PLATFORM_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}

Registradas: {nomes registrados agora, ou "nenhuma"}
Criadas:     {nomes criados agora, ou "nenhuma"}
Puladas:     {itens que a pessoa não aceitou, ou "nenhum"}

Para acrescentar outra especialização a qualquer momento: /jarvis-create-specialization
Para ver o que está instalado e registrado: /jarvis-list-specializations
```

Siga para o passo 10 (confirmar criação).

---

## Tratamento de situações

| Situação | O que fazer |
|----------|-------------|
| Variável da lista ausente | Acrescentar vazia no 9.1; não alterar outra linha |
| A pessoa pulou o passo | Listas como estão; só a skill base; seguir para o passo 10 |
| Sem stack ou sem código | Informar; só a skill base; oferecer a listagem ou o criador |
| Manifesto ambíguo | Perguntar a área |
| Backend e frontend no mesmo projeto | Mostrar as duas possibilidades; a pessoa escolhe |
| Item já na lista | Não duplicar; avisar |
| Falha ao gravar a lista | Dizer que não gravou, mostrar a linha a acrescentar à mão; nunca registrar o que não foi gravado |

## Limitações

A pasta de skills considerada é `$IDE/skills/`. Claude Code e Cursor são os suportados; em outras IDEs a estrutura é outra e o passo pode não funcionar.
