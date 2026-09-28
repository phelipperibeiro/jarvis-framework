---
description: Gerencia o arquivo taxonomy.md de forma segura (CRUD de opções organizacionais)
---

# taxonomy

Gerencia o arquivo `taxonomy.md` que define as opções válidas para SQUAD, HUB, POSITION e AREA.

## Uso

Este command invoca o skill `taxonomy-manager` para operações CRUD seguras:

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

## Sintaxe

```
Skill("taxonomy-manager", "$ARGUMENTS")
```

Onde `$ARGUMENTS` é um dos formatos:
- `list <CATEGORIA>`
- `add <CATEGORIA> <NOME> <DESCRIÇÃO>`
- `update <CATEGORIA> <NOME> <NOVA_DESCRIÇÃO>`
- `remove <CATEGORIA> <NOME>`
- `validate`

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

✅ Backup automático antes de modificações
✅ Validação de formato (MAIÚSCULAS, sem espaços)
✅ Confirmação para ações destrutivas
✅ Preservação da estrutura markdown

## Após Modificações

Depois de adicionar/remover opções:
1. Execute `/init-jarvis` - as novas opções aparecem automaticamente
2. Não é necessário reiniciar o Claude ou a IDE
3. Projetos existentes continuam funcionando

> **Documentação completa**: Ver `.claude/skills/taxonomy-manager/SKILL.md`
