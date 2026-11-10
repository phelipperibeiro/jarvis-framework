# Exemplo de execução do /jarvis-init

## Exemplo de Execução

**Usuário**: `/jarvis-init`

**Agente** *(resolve identidade local — ENV.md / git / SO)*:
```
✅ Identidade: joao@example.com
   USER será gravado no ENV.md.

📋 Vamos configurar o ambiente do framework.

Pergunta 1: Workspace detectado: `{pasta}`. Usar esse nome?
```

*[Uma pergunta por vez, aguardando resposta...]*

```
Pergunta 2: Qual IDE você está usando?
[mostrar opções em texto numerado]

Pergunta 3: Qual o nome do seu squad?
[mostrar opções do taxonomy em texto numerado]

Pergunta 4: Qual o limite de execução da AI? (60-100)

Pergunta 5: Qual sua senioridade padrão?
[AskUserQuestion: junior | pleno | senior, sem opção sugerida]

Pergunta 6: Alguma área com senioridade diferente do padrão?
[texto numerado: 0 = nenhuma; 1 a 6 = backend, frontend, qa, data, automation, platform]

Pergunta 7 (só se escolheu alguma área): Qual sua senioridade em {área}?
[AskUserQuestion: junior | pleno | senior, uma pergunta por área escolhida]

Pergunta 8: Modo dos comandos de produto?
[AskUserQuestion: Product-Led | Developer-Guided, sem opção sugerida]

Pergunta 9: Estilo dos artefatos?
[AskUserQuestion: AI-Generated (padrão) | Human-Generated]

Pergunta 10 (opcional): Usa board de cards? jira/github/gitlab ou Nenhum (freelance) → descoberta da CLI e variáveis (Passo 4)
```

**Agente**: *(cria ENV.md + `$SESSIONS_DIR/{eng,prod}` (padrão `.jarvis/sessions`), valida Context7, cria AGENTS.md e confirma)*
