> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all | ARTIFACT_STYLE: human-generated

# Artifact Style Rules (human-generated)

## Objetivo

Com `ARTIFACT_STYLE=human-generated` no `ENV.md`, nada do que o Jarvis publica leva marca de IA, e todo documento gerado oferece uma versão humanizada para repassar a clientes ou stakeholders.

## Escopo

Esta rule só é copiada para `$IDE/rules/` quando o perfil tem `ARTIFACT_STYLE=human-generated` (eixo do `Applies to`, Passo 8 do `/jarvis-init`). Vale para todo comando e para pedidos fora de workflow.

## Regras

### Obrigatório

1. **Publicado pelo Jarvis: sempre sem marcas, sem perguntar.**
   - Vale para: mensagem de commit, título e descrição do PR/MR, comentário no card, issue aberta (ex.: `jarvis-report-issue`).
   - Esta rule **prevalece** sobre instruções de atribuição da IDE: não inclua `Co-Authored-By` de ferramenta nem "Generated with …".
   - Antes do push, o `eng.pr` confere e limpa o que a IDE tiver posto (Fase 3 do `eng.pr`).
2. **Documento gerado: grava o padrão e pergunta.**
   - Vale para todo `.md` que um comando grava, inclusive os de sessão: PRD, FRD, épico, história, discovery, ARD, RFC, tech spec, Central docs, `architecture.md`, `plan.md`, `context.md`, `daily.md` (e a linha de timesheet), `gate-checklist.md`, `pull-request.md`.
   - Depois de gravar o documento padrão (como hoje), pergunte com `AskUserQuestion`: **"Quer a versão humanizada deste documento?"** (**Não**, padrão / **Sim**).
   - Com Sim, grave `{nome}.public.md` **ao lado** do original, passando no checklist abaixo. O original continua como fonte da verdade.
   - Central docs (`feature-*`, `delivery-*`): o `.public.md` fica ao lado da consolidação, na sessão, e **não** é publicado.
3. **Checklist "sem marcas de IA"** (versão humanizada e tudo o que é publicado). Não pode ter:
   - `Co-Authored-By` de ferramenta, "Generated with …" ou links para a ferramenta;
   - menções a IA, Claude ou outros modelos, assistente, agente, sub-agente ou Advisor;
   - `recommended_model` nem comentários de frontmatter dirigidos à IA;
   - "Reportado por: IA" ou qualquer autoria atribuída à ferramenta.
4. **Estilo da versão humanizada:** texto corrido de pessoa para pessoa. Parágrafos onde cabe parágrafo; lista só quando há itens; sem emojis de status em excesso; sem fórmulas como "Em resumo", "Vale ressaltar". Mantenha o conteúdo, as decisões e os links úteis ao leitor (issue, PR, card).

### Proibido

- Alterar o documento original para gerar a versão humanizada.
- Publicar commit, PR, comentário ou issue com qualquer item do checklist.
- Reescrever commits já enviados ao remoto.
- Contar `{nome}.public.md` na sequência de IDs (`prd-{id}`, `discovery-{id}`…) ou incluí-lo em índices.

### Recomendado

- Com vários documentos gerados no mesmo comando, uma pergunta só, listando os documentos.

## Exceções

- Com `ARTIFACT_STYLE=ai-generated` (ou vazio), esta rule não existe na sessão e nada muda.

## Referências

- `templates/ENV-template.md` (`ARTIFACT_STYLE`)
- `skills/jarvis-init/SKILL.md` (Pergunta 9 e Passo 8)
- `workflows/engineering/eng.pr.md` (conferência antes do push)
- `rules/AGENTS.md` (eixo `ARTIFACT_STYLE` do `Applies to`)
