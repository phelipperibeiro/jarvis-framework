# `/eng.create-rfc` — proposta técnica para discussão

Workflow: `workflows/engineering/eng.create-rfc.md` · Playbook: `templates/engineering/RFC-Playbook.md` · Template: `RFC-template.md`

## Em uma frase

Cria ou atualiza um **RFC** (Request for Comments): um documento vivo que abre a discussão de uma decisão técnica cedo, com governança mas sem burocracia.

## O que é

O RFC é um container de decisão. Ele é aberto **ainda na investigação**, sem definir a solução no início, e vai amadurecendo com comentários até virar uma decisão formal. Mantém rastreabilidade entre RFC, PRD, FRD e ARD.

Atalhos:

- `eng.create-rfc new <nome> [--prd <caminho>] [--frd <caminho>] [--ard <caminho>]`
- `eng.create-rfc edit <nome-ou-caminho>`

## Quando usar

- Decisão técnica que afeta vários times ou tem trade-offs importantes
- Quando você quer opiniões técnicas com argumento antes de decidir
- Mudança grande que não deve começar sem uma decisão aceita

## Quando **não** usar

- A decisão é de um só time e cabe num ARD → [`eng.create-ard`](./eng.create-ard.md)
- Você só quer desenhar uma feature pequena → [`eng.light-arch`](./eng.light-arch.md)

## Como funciona

Segue os 5 passos do RFC-Playbook:

| Passo | O que acontece |
|---|---|
| 0 e 0.5 | Define se é novo ou iteração e aplica **versionamento** SemVer (campo `Versão`, regras de `eng.bump-rules.md`) |
| 0.6 | Busca documentação relacionada no central docs, se configurado |
| 1 | **Criação:** preenche o template com `status: Draft`, dono e revisores. Contexto e problema (sem solução), motivação, escopo em discussão, pontos de atenção e riscos com responsável |
| 2 | **Divulgação obrigatória:** gera a mensagem para Slack ou equivalente, com link, data limite para comentários (por exemplo D+5) e lista de revisores. Um RFC que ninguém sabe que existe não vale |
| 3 | **Discussão assíncrona:** os comentários ficam no RFC, não em chats soltos, e toda opinião precisa de argumento técnico |
| 4 | **Decisão formal:** `In Review` quando PRD/FRD existem e `Ready for Decision` ao marcar a decisão, com o checklist de revisão técnica e rastreabilidade (`related_prd`, `related_frd`, `related_ard`) |
| 5 | **Gate para implementação:** preenche a decisão final (status, data, decisores, condições) |

## Regras que importam

- **Regra de ouro:** implementação relevante não começa sem RFC `Accepted`
- O link do RFC é pré-requisito do ARD, e PRs grandes devem referenciá-lo
- Se o RFC for substituído (`Superseded`), o substituto é linkado

## Próximo passo típico

[`eng.create-ard`](./eng.create-ard.md), depois [`eng.start`](./eng.start.md)
