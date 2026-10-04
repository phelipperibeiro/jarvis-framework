---
description: Gerencia o arquivo taxonomy.md de forma segura (CRUD de opções organizacionais)
---

# taxonomy

Gerencia o arquivo `taxonomy.md` que define as opções válidas para SQUAD, HUB, POSITION e AREA.

Este workflow é **autônomo**: as instruções para as operações abaixo estão aqui, sem depender de nenhum skill.

## Uso

### Listar opções

```bash
/taxonomy list SQUADS
/taxonomy list HUBS
/taxonomy list POSITIONS
/taxonomy list AREAS
```

### Adicionar nova opção

```bash
/taxonomy add SQUADS MOBILE "Time focado em desenvolvimento mobile nativo"
/taxonomy add HUBS DEVOPS "DevOps e infraestrutura"
/taxonomy add POSITIONS PRINCIPAL "Principal Engineer"
```

### Atualizar descrição

```bash
/taxonomy update SQUADS CORE "Nova descrição do time"
```

### Remover opção

```bash
/taxonomy remove SQUADS MOBILE
```

### Validar estrutura

```bash
/taxonomy validate
```

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — workflow autocontido | — |

## Sintaxe

```
/taxonomy <operação> [<CATEGORIA>] [<NOME>] [<DESCRIÇÃO>]
```

Onde `$ARGUMENTS` é um dos formatos:
- `list <CATEGORIA>`
- `add <CATEGORIA> <NOME> <DESCRIÇÃO>`
- `update <CATEGORIA> <NOME> <NOVA_DESCRIÇÃO>`
- `remove <CATEGORIA> <NOME>`
- `validate`

`<CATEGORIA>` é `SQUADS`, `HUBS`, `POSITIONS` ou `AREAS`. Sem argumentos ou com uma operação desconhecida, mostre a sintaxe acima e pergunte o que a pessoa quer fazer.

## Como executar cada operação

O arquivo é o `taxonomy.md` da raiz do framework (ou do workspace). Cada categoria é uma seção `## ...` (Squads, Hubs, Positions, Areas) e cada opção é um título `### NOME`, seguido de linhas de descrição. Em `SQUADS`, a opção também pode ter linhas de metadados (`channel_id:`, `board_code:`, `modules:`); em `AREAS`, a linha `prefix:`. A seção `Domain` (`DOMAIN:`) não é uma categoria de opções.

### Regras comuns (antes de qualquer alteração)

1. **Ler** o `taxonomy.md` inteiro e localizar a seção da categoria. Se a categoria não existir, informe e liste as categorias válidas.
2. **Validar o nome** (em `add`): MAIÚSCULAS, sem espaços (use `-` ou `_` para separar palavras), sem duplicar uma opção que já existe na categoria.
3. **Fazer backup** antes de gravar: copie o `taxonomy.md` para `.jarvis/backups/taxonomy-{AAAAMMDD-HHMMSS}.md` (a pasta `.jarvis/` não é versionada). Se não for possível gravar o backup, **pare** e avise, sem alterar o arquivo.
4. **Mostrar o que vai mudar** (a seção antes e depois) e **pedir confirmação** antes de gravar em `add`, `update` e `remove`.
5. **Preservar a estrutura markdown**: não reordenar nem reescrever outras seções; alterar só a opção pedida.

### `list <CATEGORIA>`

Mostre cada opção da categoria com a primeira linha da descrição, em tabela. Não altera nada.

### `add <CATEGORIA> <NOME> <DESCRIÇÃO>`

1. Aplique as regras comuns.
2. Acrescente, no fim da seção da categoria (antes do `---` que a encerra), um bloco `### NOME` com a descrição.
3. Em `SQUADS`, pergunte se a pessoa quer preencher `channel_id`, `board_code` e `modules`; sem resposta, deixe-os vazios como nas outras squads.
4. Em `AREAS`, peça o `prefix` (letras minúsculas, sem espaços) e **avise** que as áreas do framework são `ENGINEERING` e `PRODUCT`: adicionar outra área exige um menu correspondente no `warm-up` e só deve ser feito com confirmação explícita.

### `update <CATEGORIA> <NOME> <NOVA_DESCRIÇÃO>`

1. A opção deve existir; se não, informe e sugira nomes parecidos.
2. Substitua só as linhas de descrição da opção (mantendo `prefix:` e metadados), depois de mostrar o antes e o depois e pedir confirmação.

### `remove <CATEGORIA> <NOME>`

1. A opção deve existir; se não, informe e sugira nomes parecidos.
2. **Ação destrutiva:** leia o `$IDE/ENV.md`; se o valor de `SQUAD`, `HUB`, `POSITION` ou `AREA` for a opção a remover, **avise** que o `ENV.md` ficará inválido e peça confirmação explícita.
3. Remova o bloco `### NOME` e suas linhas, sem tocar nas outras opções, depois de mostrar o que será removido e pedir confirmação.

### `validate`

Não altera nada. Verifique e reporte, por categoria:
- a seção existe e tem ao menos uma opção;
- todo nome está em MAIÚSCULAS e sem espaços, sem duplicata;
- toda opção de `AREAS` tem `prefix:`;
- a estrutura markdown está íntegra (títulos `##` e `###`, separadores `---`).

Termine com um resumo (`✅ válido` ou a lista de problemas, com a linha de cada um).

## Exemplos

### Adicionar novo squad
```
/taxonomy add SQUADS DATA "Time de Data Science e Analytics"
```

### Listar todas as positions
```
/taxonomy list POSITIONS
```

### Remover hub obsoleto
```
/taxonomy remove HUBS LEGACY
```

## Segurança

✅ Backup antes de modificações (`.jarvis/backups/`)
✅ Validação de formato (MAIÚSCULAS, sem espaços)
✅ Confirmação para ações destrutivas e antes de gravar
✅ Preservação da estrutura markdown

## Após Modificações

Depois de adicionar/remover opções:
1. Execute `/jarvis-init` - as novas opções aparecem automaticamente
2. Não é necessário reiniciar o Claude ou a IDE
3. Projetos existentes continuam funcionando

> **Referência**: o formato das seções está descrito no próprio `taxonomy.md` ("Como Adicionar Novas Opções").
