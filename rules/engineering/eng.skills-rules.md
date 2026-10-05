> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras de Skills: área obrigatória e nome inexistente

## Objetivo

Garantir que todo skill instalado tenha uma área reconhecida e avisar a pessoa, na hora, quando algo pede um skill que não existe.

## Escopo

Vale para todo comando `eng.*` e seus agentes, **ao iniciar**. A pasta de skills considerada é `$IDE/skills/`.

**Áreas reconhecidas:** `qa`, `data`, `ai`, `frontend`, `backend`, `security`, `automation`, `devops`, `global`, `product`.

## Regras

### Obrigatório

1. **Bloqueio, primeiro.** Leia só o frontmatter de cada `$IDE/skills/*/SKILL.md`:

   ```bash
   for f in $IDE/skills/*/SKILL.md; do
     awk -v f="$f" 'BEGIN{fm=0} /^---[[:space:]]*$/{fm++; next}
       fm==1 && /^name:/{n=$2}
       fm==1 && /^[[:space:]]+area:/{a=$2}
       END{printf "%s|area=%s\n", n, a}' "$f"
   done
   ```

   Se algum skill tem `area` vazia ou fora das áreas reconhecidas, **interrompa o comando** e exiba:
   `⛔ Skills instalados sem área (metadata.area): {lista}. Marque a área de cada um (ou remova o skill) e execute o comando de novo. O comando foi interrompido.`
2. **Aviso de nome inexistente.** Quando o usuário, um workflow, um agente ou uma das listas (`BACKEND_SPECIALIZATIONS`, `FRONTEND_SPECIALIZATIONS`) pedir um skill cujo `$IDE/skills/{nome}/SKILL.md` não existe, exiba na hora:
   `⚠️ O skill "{nome}" não existe em $IDE/skills/. Use /jarvis-list-specializations para ver os nomes atuais e corrija a referência. Seguindo sem ele.`
   e **siga sem esse skill** (em backend e frontend, com o skill base e os demais itens).

### Proibido

- Pular o bloqueio ou seguir como se o skill sem área estivesse marcado
- Corrigir sozinho o nome, a área ou a lista do `ENV.md`
- Usar um skill que não existe, nem adivinhar um nome parecido

### Recomendado

- Na mensagem do bloqueio, listar cada skill pelo nome da pasta
- No aviso, citar o nome exatamente como foi pedido

## Exceções

- Só Claude Code e Cursor são suportados. Em IDEs com outra pasta de skills (por exemplo, Kiro e Codex), o bloqueio e o aviso podem não funcionar.
- O comando `/jarvis-init` e a consulta `/jarvis-list-specializations` não passam pelo bloqueio (são como a pessoa descobre e corrige o problema).

## Referências

- `eng.specializations-rules.md`: listas de especializações e carregamento por área
- `skills/jarvis-list-specializations/SKILL.md`: consulta do que está instalado e registrado
- `skills/AGENTS.md`: áreas reconhecidas e padrão de nomes
