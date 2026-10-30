# Overlay de empresa (`COMPANY_PROFILE` e `/jarvis-fork`)

> Para quem usa o Jarvis em mais de uma empresa, ou numa empresa com processo próprio (de onde nasce a branch, como se entrega, quais gates valem, campos do MR). Issue [#199](https://github.com/phelipperibeiro/jarvis-framework/issues/199).

## O problema

O `jarvis init` copia o framework inteiro para a pasta da IDE (`.claude/`, `.cursor/`…), e o `jarvis init --upgrade` sobrescreve essa cópia. Quem edita um workflow ali para seguir o processo da empresa perde o ajuste no próximo upgrade. A **stack** já tinha um encaixe (as especializações, `BACKEND_SPECIALIZATIONS` etc.); o **processo** não tinha.

## A ideia

Um **overlay por empresa**: uma pasta que espelha a estrutura do core e contém **só o que a empresa substituiu**. O core continua intacto no pacote instalado; o overlay guarda os forks; o upgrade do core não apaga nada do overlay.

```
.claude/
├── overlays/
│   ├── stark-industries/        # o overlay padrão: todo workspace tem (vazio até o primeiro fork)
│   └── acme/                    # o overlay de uma empresa, se COMPANY_PROFILE=acme
│       ├── skills/eng-global-pr/SKILL.md          # fork: mesmo caminho e nome do core
│       ├── templates/pull-request.md
│       └── rules-on-demand/engineering/eng.pr-rules.md
├── rules/
│   ├── company-overlay-rules.md                   # a rule de precedência (do core, sempre)
│   └── …                                           # rules do core, ou do overlay quando há fork
└── ENV.md                                          # COMPANY_PROFILE=acme
```

Vocabulário: **core** é o motor do Jarvis (pacote instalado); **overlay** é a camada da empresa; **fork** é um arquivo do core copiado para o overlay, no mesmo caminho e nome, com carimbo de origem (`forked_from`, `forked_at`) no frontmatter; `stark-industries` é o perfil default, um overlay como qualquer outro.

## `COMPANY_PROFILE`

A chave do `ENV.md` nunca fica vazia. Nasce como `stark-industries`; um nome próprio (letras minúsculas, números e hífen; não pode ser o nome de uma pasta do core) aponta para o overlay da empresa. O `/jarvis-init` pergunta (default primeiro) e o `jarvis init --upgrade` pergunta no terminal ao acrescentar a chave num ENV antigo (Enter, `--yes` ou sem terminal = default). Chave vazia ou inválida é tratada como default, com aviso.

## Como o fork passa a valer: dois resolvers

| Tipo | Quem resolve | Quando | Como |
|---|---|---|---|
| workflows, skills, agents, templates, rules-on-demand lidas por caminho | a rule `company-overlay-rules.md` | na chamada | antes de seguir o artefato, o agente confere `$IDE/overlays/{COMPANY_PROFILE}/{tipo}/{mesmo caminho}`; existe → segue o do overlay |
| `rules/` e `rules-on-demand/` (a cópia da IDE) | o sync do `jarvis init` e o Passo 8 do `/jarvis-init` | na instalação e no upgrade | copiam por cima de `$IDE/rules/` a versão do overlay, com a linha `> Overlay: {perfil} (forked_from …)` no topo |

Por que dois: a IDE carrega `rules/` inteira no início da sessão, antes de qualquer comando; um "se existe overlay, leia o outro" em prosa não tira a rule do core do contexto. Então rules são resolvidas quando são copiadas. O resto é chamado por nome ou lido por caminho, e a prosa resolve.

Precedência: **overlay > especialização de stack > core.**

## O que o `init`/`upgrade` fazem (e não fazem) com o overlay

- Leem `overlays/{perfil}/rules/` e `rules-on-demand/` para o RuleResolver.
- Criam a pasta vazia do perfil ativo se ela não existir. É a **única** escrita em `overlays/`.
- **Nunca** gravam, alteram ou apagam arquivo dentro de `overlays/`. Quem escreve é só o `jarvis fork`.

Trocar de empresa é mudar o `COMPANY_PROFILE` e rodar `jarvis init --upgrade` (para as rules). Vários overlays podem coexistir na pasta; um está ativo.

## `/jarvis-fork` (a conversa) e `jarvis fork` (a mecânica)

A skill `/jarvis-fork {artefato}` não copia um arquivo: ela ajuda a achar **onde** o comando do core não está servindo. Ouve a dor (uma pergunta por vez, lendo as sessões recentes antes), aponta a seção do core com link, propõe o menor ajuste (variável do `ENV.md` que já resolve > fork de um arquivo pequeno > fork do fluxo inteiro) com a conta de linhas e tokens, simula o efeito e só grava com **"Gravar no overlay?" = Sim**. No fim, pergunta o **alcance**: apenas desta empresa, estender para o core (abre uma melhoria pelo `/jarvis-report-issue`, só com dados da dor, sem nome de cliente) ou "ainda não sei" (candidato a core no `--list`).

O CLI por baixo:

| Comando | O que faz |
|---|---|
| `jarvis fork {nome} [--candidate]` | Copia do core instalado para o overlay, no mesmo caminho e nome, com carimbo. `{nome}` é workflow, skill ou agente (como no `jarvis map`) ou `rules/…`, `rules-on-demand/…`, `templates/…`. Rule e rule-on-demand são recopiadas na IDE na hora |
| `jarvis fork --list` | O que está forkado: caminho, tipo, carimbo, `(sem carimbo)`, candidato a core, tipo não resolvido. **Não compara** com o core |
| `jarvis fork {nome} --update [--diff]` | Recarimba o fork com a versão atual do core (o conteúdo não muda). Com `--diff`, mostra antes o diff fork × core **atual** (linhas 🔴 são possível mudança de contrato: sessão, `ENV.md`, template, CLI). Não existe cópia da versão em que o fork foi feito; o que trazer é decisão da pessoa |
| `jarvis fork {nome} --delete` | Remove o fork; rule volta à versão do core na IDE |

## O que fica fora (por enquanto)

Multi-squad no mesmo workspace, overlay instalado de um repositório git por URL, geração assistida do overlay a partir da wiki, extension points no core ("soma" em vez de "substitui"), `jarvis map` marcando o que veio do overlay, `scripts/` no overlay. A métrica que decide o próximo passo é a lista do `--list`: fork que todo cliente faz é extension point que falta no core.
