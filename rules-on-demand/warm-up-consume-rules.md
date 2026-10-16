> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Consumo do warm-up

## Objetivo

Levar um aquecimento do `/warm-up` (`$SESSIONS_DIR/warm-ups/{apelido}/warm-up.md`) para a sessão da tarefa. Lida pelo `/eng.start` e pelos `/prod.spec*` só quando a pasta `warm-ups/` tiver aquecimentos.

## Regras

### Obrigatório

1. **Listar** `$SESSIONS_DIR/warm-ups/*/warm-up.md`. Nenhum: siga o comando sem perguntar nada.
2. **Perguntar** com `AskUserQuestion`: **"Usar um aquecimento do warm-up?"**, uma opção por apelido (até 3, os mais recentes, com repositórios e data), mais **Não usar**.
3. **Gravar** o conteúdo do escolhido, num bloco `## Warm-up ({apelido})`, no `context.md` da sessão:
   - engenharia: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md`, depois do `/jarvis-context-detect` (acrescente; não substitua o `CONTEXT_PROFILE`);
   - produto: `$SESSIONS_DIR/prod/{id do documento}/context.md` (ex.: `prd-001`, `discovery-002`), ou `$SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/` se a chave foi informada. Grave quando o comando já tiver definido o id.
4. **Apagar** a pasta `$SESSIONS_DIR/warm-ups/{apelido}/` depois de gravar.
5. **Usar** o bloco como contexto da tarefa: repositórios e áreas ativas (carregue só as especialidades dessas áreas), recorte do Central docs, entregas recentes e versões das ferramentas. Não refaça o que o aquecimento já trouxe.

### Proibido

- Usar um aquecimento sem a escolha do usuário
- Apagar a pasta antes de gravar o bloco no `context.md`
- Copiar para o `context.md` tokens, e-mails ou valores do `ENV.md`

## Referências

- `workflows/warm-up.md`: quem gera o aquecimento
- `templates/warm-up-template.md`: formato do aquecimento
