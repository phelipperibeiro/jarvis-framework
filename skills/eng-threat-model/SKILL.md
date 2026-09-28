---
name: eng-threat-model
description: >-
  Produz THREAT_MODEL.md para o projeto corrente. Três modos: bootstrap (deriva o modelo
  do código sem owner), interview (walk com o owner do sistema), bootstrap-then-interview
  (bootstrap primeiro, entrevista refinadora depois). Lê código, histórico git e relatórios
  fornecidos — nunca executa, builda ou faz requests ao alvo. Invocar antes de
  eng.security-audit e eng-security-triage.
argument-hint: "[bootstrap|interview|bootstrap-then-interview] [--fresh]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Bash(git log:*)
  - Bash(find:*)
  - Bash(ls:*)
  - AskUserQuestion
---

# eng-threat-model

Threat model é o **mapa** do sistema: o que pode dar errado, quem faria, e o que protege o sistema.
Scan de vulnerabilidades é o detector de metais — sem o mapa, o detector varre o lugar errado.

**Litmus test:** Se corrigir uma linha de código faz uma entrada desaparecer do modelo, era vulnerabilidade, não ameaça.
Uma ameaça ("attacker achieves RCE via untrusted input parsing") sobrevive a qualquer patch individual.
Uma vulnerabilidade ("buffer overflow em `parser.js:82`") desaparece quando corrigida. Este skill produz **ameaças** — vulnerabilidades aparecem apenas como `evidence` que eleva o score de likelihood.

---

## Step 0 — Fronteira read-only (sempre executa primeiro)

Este skill realiza **análise estática apenas**. Lê código-fonte, histórico git e relatórios de vulnerabilidade fornecidos pelo usuário. **Nunca** builda, executa, fuzza ou modifica o código-alvo. **Nunca** faz requests de rede à infraestrutura do alvo.

Confirme e declare na primeira resposta:
1. O diretório-alvo existe e é um checkout local legível.
2. Nenhum código do alvo será executado nesta sessão.
3. Se solicitado a validar ameaça por execução: declinar e orientar para pipeline de execução dedicado.

---

## Step 1 — Roteamento de modo

Parsear `$ARGUMENTS`:

| Primeiro token | Ação |
|---|---|
| `bootstrap` | Ir para **Seção C** |
| `interview` | Ir para **Seção B** |
| `bootstrap-then-interview` | Ir para **Seção D** |
| vazio ou outro | Perguntar: **"Tem alguém que construiu ou conhece bem este sistema disponível para responder perguntas nesta sessão?"** — Sim + codebase disponível → recomendar `bootstrap-then-interview`. Sim sem codebase → `interview`. Não → `bootstrap`. |

`--fresh`: ignorar `THREAT_MODEL.md` existente e criar do zero.
Sem `--fresh`: se `THREAT_MODEL.md` existe, atualizar (adicionar/corrigir ameaças) sem sobrescrever seções válidas.

---

## Seção A — Schema de output

Antes de escrever qualquer arquivo, reler `docs/SECURITY-ARTIFACTS-SCHEMA.md` seção 1 (THREAT_MODEL.md).
Em sessões longas, o schema pode ser eviccionado da janela — o re-read garante o contrato correto.

---

## Seção B — Modo Interview

Framework de 4 perguntas. Conduzir como conversa, não como formulário.

| Q | Pergunta ao owner | Preenche schema |
|---|---|---|
| Q1 | O que estamos construindo? (o que faz, quem usa, onde roda, quais dados toca) | seções 1, 2, 3 |
| Q2 | O que pode dar errado? (quem atacaria, por onde entraria, o que quereria) | seção 4: id, threat, actor, surface, asset |
| Q3 | O que fazemos a respeito? (controles atuais, o que aceitamos como risco, o que depriorizamos) | seção 4: impact/likelihood/status/controls; seções 5 e 8 |
| Q4 | Fizemos um bom trabalho? (cobriu STRIDE? ranking faz sentido? o que ficou em aberto?) | seção 6 (perguntas abertas); validar cobertura |

**Durabilidade de contexto:** Interview é multi-turno. Não ler blocos grandes no início — ler seção por seção ao precisar. Para sobreviver a compactação, salvar estado em `.security/state/threat-model-interview.json` após cada Q.

**Verificação de evidências (após Q2):** Para cada ameaça mencionada pelo owner, buscar no código evidência que a instancia (função, endpoint, dependência vulnerável). Registrar como `evidence` na tabela — evidência não é a ameaça.

---

## Seção C — Modo Bootstrap

Análise do código sem owner presente. 5 fases em sequência:

**Fase 1 — Recon** (leitura estrutural):
- Ler manifesto do projeto: `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / equivalente
- Listar entry points: `routes/`, `controllers/`, `handlers/`, `api/`, `views/`, `cmd/`
- Listar integrações externas: clientes HTTP, queries de banco, leituras de arquivo, consumidores de fila
- Git log recente: `git log --oneline -50` — procurar commits com "fix", "patch", "vuln", "sec", "auth", "cve"

**Fase 2 — Assets & Entry Points** (seções 2 e 3):
Com base no recon, listar:
- Assets: tudo que vale proteger (dados de usuário, credenciais, integridade do serviço, dados financeiros, segredos de negócio)
- Entry points: onde input não confiável entra (endpoints HTTP, uploads, mensagens de fila, args de CLI, env vars de origem externa)

**Fase 3 — Threat table draft** (seção 4):
Para cada entry point, formular ameaças no nível actor-wants-outcome. Cobertura mínima STRIDE:
- **Spoofing**: autenticação pode ser bypassada?
- **Tampering**: dados em trânsito ou armazenados podem ser alterados?
- **Repudiation**: ações críticas são logadas e não-repudiáveis?
- **Info Disclosure**: dados sensíveis podem ser expostos (resposta de erro, log, cache)?
- **Denial of Service**: input malicioso pode esgotar recursos (CPU, memória, conexões)?
- **Escalation of Privilege**: usuário pode obter mais permissões do que deveria (IDOR, RBAC bypass)?
- **Supply Chain**: dependências externas podem ser comprometidas?

**Fase 4 — Evidências** (seção 4, coluna `evidence`):
Para cada ameaça na tabela:
- Buscar padrão inseguro correspondente no código (queries sem parametrização, eval, exec com input, etc.)
- Buscar no git log patches relacionados a essa superfície
- Se dependência com CVE relevante: registrar CVE ID

Evidência move `likelihood` para cima. Controles existentes movem para baixo. Registrar o **residual** após controles.

**Fase 5 — Gap-fill e depriorizados** (seções 5 e 6):
- Ameaças STRIDE sem cobertura e justificavelmente fora do escopo → seção 5 com `reason`
- Dúvidas não resolvidas pelo código → seção 6 (perguntas abertas para owner futuro)

---

## Seção D — Modo Bootstrap-then-Interview

Recomendado quando owner e codebase estão disponíveis na mesma sessão.

1. Informar o owner: *"Vou ler o código primeiro (~5-10 min) e voltar com um rascunho. Refinamos juntos. Prefere assim ou começar do zero?"* Só prosseguir se aceitar — senão, ir para Seção B (interview puro).
2. Executar Seção C (bootstrap) completo → escrever `THREAT_MODEL.md` rascunho.
3. Continuar para Seção B (interview) com o rascunho como seed:
   - Perguntas abertas da seção 6 do bootstrap viram os prompts Q1-Q4.
   - Owner confirma, corrige e adiciona — não descreve do zero.
4. Sobrescrever `THREAT_MODEL.md` com o modelo refinado. Provenance: `mode: bootstrap-then-interview`.

---

## Step 2 — Escrever output

Ler Seção A antes de escrever. Escrever `.security/outputs/THREAT_MODEL.md` conforme schema de `docs/SECURITY-ARTIFACTS-SCHEMA.md`. Criar `.security/outputs/` se não existir.

Criar `.security/state/` se não existir. Salvar `.security/state/threat-model-meta.json`:

```json
{
  "generated_at": "<ISO-8601>",
  "mode": "<bootstrap|interview|bootstrap-then-interview>",
  "target": "<path>",
  "threat_count": 0,
  "top_threats": ["<T1: descrição>", "<T2: descrição>"]
}
```

---

## Step 3 — Sumário ao usuário

Após escrever o arquivo, exibir:

1. Path do `.security/outputs/THREAT_MODEL.md` gerado.
2. Top 5 ameaças por likelihood × impact (id, descrição em uma linha).
3. Para `bootstrap`: perguntas abertas da seção 6 — seed para entrevista futura ou review manual.
4. Para `interview`: afirmações do owner não verificadas no código — seed para revisão de código.
5. Próximo passo sugerido: *"Execute `/eng.security-audit` para scan de vulnerabilidades guiado pelo threat model."*
