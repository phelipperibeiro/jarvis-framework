# `/prod.spec.breakdown` — quebrar uma especificação grande

Workflow: `workflows/product/prod.spec.breakdown.md`  
Skill usual: `prod-specs` (template `prod-breakdown-template.md`)

## Em uma frase

Pega uma especificação **grande demais para executar** e fatia em partes gerenciáveis (épicos, histórias, entregas incrementais) **sem perder o objetivo**.

## O que é (universo de produto)

Product Managers e Product Owners fazem *breakdown* o tempo todo:

- Um Documento de Requisitos de Produto “módulo financeiro” não cabe numa sprint
- Um Documento de Requisitos Funcionais com 40 fluxos não vira uma única história
- Entregar valor cedo exige **fatias verticais** (pedaços usáveis), não só camadas técnicas (“primeiro só o banco”)

Breakdown ≠ esclarecimento.  
Esclarecimento tira dúvida; breakdown **divide trabalho**.

## Quando usar

- Documento macro ou funcional ficou “monolito”
- Time pergunta “por onde começamos?”
- Você precisa de milestones / releases parciais
- Antes de criar vários épicos à mão

## Quando **não** usar

- Spec ainda ambígua → [`clarify`](./prod.spec.clarify.md) primeiro
- Já está no tamanho de uma história → [`issue`](./prod.spec.issue.md)
- Só quer renomear seções → edite o documento; não precisa do comando

## Exemplo

> Documento de Requisitos de Produto de “Central de notificações” com push, e-mail, in-app, preferências e admin.

1. `/prod.spec.breakdown` apontando para o arquivo
2. Agente propõe fatias, por exemplo:
   - Épico A: in-app + preferências básicas
   - Épico B: e-mail transacional
   - Épico C: push + admin
3. Você valida ordem de valor (o que aprende mais cedo com usuários?)
4. Gera [`épicos`](./prod.spec.epic.md) e depois [`histórias`](./prod.spec.issue.md)

## Como o framework te favorece

- Mantém vínculo com o documento pai em `$PROD_DOCS`
- Evita o anti-padrão “tudo no mesmo card”
- Prepara o terreno para `/eng.plan` por fatia

## Dica de Product Owner

Prefira fatias que um usuário **perceba**. “Migrar tabela X” sozinho raramente é breakdown de produto — é tarefa técnica que deve apoiar uma história de valor.

## Próximo passo típico

[`epic`](./prod.spec.epic.md) e/ou [`issue`](./prod.spec.issue.md) → `/eng.start` na primeira fatia
