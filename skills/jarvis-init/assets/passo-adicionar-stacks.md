# Passo 9 — Adicionar as stacks (opcional)

> Fluxo completo do passo "adicionar as stacks" do `/jarvis-init`. O `SKILL.md` traz só o resumo e aponta para cá. A tabela de detecção está em [sinais-de-stack.md](sinais-de-stack.md).

## Objetivo

Deixar o projeto especializado em torno de 10 minutos (tempo de **referência**, não limite; o passo nunca é interrompido por passar dele), sem que a pessoa descreva a stack à mão: o framework lê o workspace, mostra as stacks que encontrou e, para cada uma, sugere registrar o skill que já existe ou criar um novo.

Vale **só para backend e frontend**.

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

Leia o `$IDE/ENV.md` e confirme que `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS` existem (vazias valem).

- Se **faltar** uma delas, acrescente-a **vazia** ao final do `ENV.md` (com a mesma linha do `templates/ENV-template.md`) **antes** de oferecer o passo. Não altere nenhuma outra linha.
- Se existirem, siga.

## 9.2 Oferecer o passo

Pergunte, em texto:

```
Deseja adicionar as stacks do projeto agora?
(Leva em torno de 10 minutos como referência; só backend e frontend.)

A: Sim, adicionar as stacks
B: Pular (o projeto usa só a skill base; dá para adicionar depois com /jarvis-create-specialization)
```

- **B (pular):** informe que as listas **ficam como estão** e siga para o passo 10. Nada é alterado.
- **A:** siga para o 9.3.

## 9.3 Listar as especializações instaladas

Leia o frontmatter de cada `$IDE/skills/*/SKILL.md` (comando de comparação em [sinais-de-stack.md](sinais-de-stack.md)) e mostre as **especializações**: skills com `metadata.area` de backend ou frontend **e** `metadata.stack`, estejam ou não registradas nas listas.

```
### Backend
| Skill | Stack | Registrada |
|-------|-------|------------|
| eng-backend-nestjs | nestjs | ➖ |

### Frontend
(nenhuma instalada)
```

Pergunte: **"Quer registrar alguma delas agora, sem passar pela detecção?"** Se sim, registre pelo 9.6 e siga.

## 9.4 Detectar as stacks do workspace (só leitura)

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

## 9.6 Aplicar o que foi aceito (uma stack por vez)

**Registrar um skill existente:**

1. Leia a linha `VAR=...` da área e separe os itens (aceita colchetes, espaços e aspas):
   `grep -E '^BACKEND_SPECIALIZATIONS=' $IDE/ENV.md | cut -d= -f2- | tr -d '[]" ' | tr ',' '\n' | grep -v '^$'`
2. Se o nome do skill **não está** na lista: acrescente ao **final**. Os demais itens ficam como estavam; só o formato da linha é normalizado (**separado por vírgula, sem colchetes**).
3. Se **já está**: não duplique e avise.
4. Edite **só a linha dessa variável** e **releia** o `ENV.md` para confirmar.

**Criar um skill novo:** chame `/jarvis-create-specialization {área} {stack}`. O criador lê o projeto, mostra o skill para revisão e só grava e registra depois da confirmação da pessoa. Faça **uma stack por vez** e espere o criador terminar antes da próxima.

## 9.7 Resumo final

Mostre o que ficou configurado:

```
✅ Stacks configuradas

📋 BACKEND_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}
📋 FRONTEND_SPECIALIZATIONS={lista atual ou "(vazia: só a skill base)"}

Registradas: {nomes registrados agora, ou "nenhuma"}
Criadas:     {nomes criados agora, ou "nenhuma"}
Puladas:     {stacks que a pessoa não aceitou, ou "nenhuma"}

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
