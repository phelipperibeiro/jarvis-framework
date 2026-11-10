---
description: Gerencia o arquivo taxonomy.md de forma segura (CRUD de opções organizacionais)
---

# taxonomy

Gerencia o arquivo `taxonomy.md` que define as opções válidas de SQUAD.

Este workflow é **autônomo**: as instruções para as operações abaixo estão aqui, sem depender de nenhum skill.

## Uso

### Listar opções

```bash
/taxonomy list SQUADS
```

### Adicionar nova opção

```bash
/taxonomy add SQUADS MOBILE "Time focado em desenvolvimento mobile nativo"
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

`<CATEGORIA>` é `SQUADS`, a única categoria. Sem argumentos ou com uma operação desconhecida, mostre a sintaxe acima e pergunte o que a pessoa quer fazer.

## Como executar cada operação

O arquivo é o `taxonomy.md` da raiz do framework (ou do workspace). A categoria é a seção `## 🏢 Squads` e cada opção é um título `### NOME`, seguido de linhas de descrição. A opção também pode ter linhas de metadados (`channel_id:`, `board_code:`, `modules:`). A seção `Domain` (`DOMAIN:`) não é uma categoria de opções.

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
3. Pergunte se a pessoa quer preencher `channel_id`, `board_code` e `modules`; sem resposta, deixe-os vazios como nas outras squads.

### `update <CATEGORIA> <NOME> <NOVA_DESCRIÇÃO>`

1. A opção deve existir; se não, informe e sugira nomes parecidos.
2. Substitua só as linhas de descrição da opção (mantendo os metadados), depois de mostrar o antes e o depois e pedir confirmação.

### `remove <CATEGORIA> <NOME>`

1. A opção deve existir; se não, informe e sugira nomes parecidos.
2. **Ação destrutiva:** leia o `$IDE/ENV.md`; se o valor de `SQUAD` for a opção a remover, **avise** que o `ENV.md` ficará inválido e peça confirmação explícita.
3. Remova o bloco `### NOME` e suas linhas, sem tocar nas outras opções, depois de mostrar o que será removido e pedir confirmação.

### `validate`

Não altera nada. Verifique e reporte, por categoria:
- a seção existe e tem ao menos uma opção;
- todo nome está em MAIÚSCULAS e sem espaços, sem duplicata;
- a estrutura markdown está íntegra (títulos `##` e `###`, separadores `---`).

Termine com um resumo (`✅ válido` ou a lista de problemas, com a linha de cada um).

## Exemplos

### Adicionar novo squad
```
/taxonomy add SQUADS DATA "Time de Data Science e Analytics"
```

### Listar os squads
```
/taxonomy list SQUADS
```

### Remover um squad que não existe mais
```
/taxonomy remove SQUADS LEGACY
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
