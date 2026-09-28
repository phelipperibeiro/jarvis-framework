---
trigger: always_on
env_file: "@/ENV.md"
---

> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# RTK — Token-Efficient Bash Commands

Quando `RTK_ENABLED=true` no ENV.md, use o prefixo `rtk` em chamadas Bash para reduzir
60-90% dos tokens consumidos por outputs de shell.

---

## Regra de uso

**Antes de executar qualquer comando Bash**, verificar se RTK está disponível:

```bash
which rtk 2>/dev/null
```

- Se RTK estiver no PATH: usar `rtk <comando>` em vez do comando direto
- Se RTK **não** estiver no PATH: executar o comando original sem alteração

**Fallback gracioso**: nunca falhar por causa do RTK. Se `rtk` não estiver
instalado ou retornar erro, executar o comando original.

---

## Comandos reescritos

Todos os comandos de shell devem ser prefixados com `rtk`:

```bash
# Exemplos de reescrita
rtk git status          # em vez de: git status
rtk git diff            # em vez de: git diff
rtk git log             # em vez de: git log
rtk ls -la              # em vez de: ls -la
rtk npm test            # em vez de: npm test
rtk npm run build       # em vez de: npm run build
rtk cat package.json    # em vez de: cat package.json
```

O RTK comprime o output automaticamente — o comportamento do comando não muda.

---

## Meta-comandos RTK (usar diretamente)

Estes comandos são do próprio RTK e devem ser usados sem proxy:

```bash
rtk gain              # Exibir analytics de economia de tokens
rtk gain --history    # Histórico de uso com economia por comando
rtk discover          # Analisar histórico do Claude Code para oportunidades perdidas
rtk proxy <cmd>       # Executar comando sem filtro (debug)
```

---

## Quando NÃO usar RTK

- Comandos interativos que precisam de input do usuário
- Pipes complexos onde a compressão pode afetar o resultado
- Quando o comando original precisa de output exato (ex: parsing JSON)
- Se `which rtk` falhar — usar o comando original silenciosamente
