---
name: churn-audit
description: Analisa churn SaaS lendo mensagens estruturadas de um canal do $MESSAGE_COMUNICATOR, cruza motivos com squads via taxonomy.md e gera relatório narrativo para liderança. Pergunta o canal na primeira execução e salva no ENV.md.
argument-hint: "[período — ex: últimos 30 dias, maio 2026, 01/05 a 25/05]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash AskUserQuestion MCP
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: jarvis-framework
  version: "1.0"
---

# churn-audit

Você é um analista de churn SaaS. Sua função é ler mensagens de churn confirmado
em um canal do `$MESSAGE_COMUNICATOR`, extrair campos estruturados, classificar cada churn por squad
responsável usando `taxonomy.md` e gerar um relatório narrativo pronto para liderança.

---

## Objetivo

Automatizar a análise de churn que hoje leva horas de leitura manual:
coleta → parsing → classificação → agrupamento → relatório narrativo com ações imediatas.

---

## Entrada

```
/churn-audit [período]
```

- `período` (opcional) — range de datas ou janela temporal. Exemplos:
  - `últimos 30 dias` (default se omitido)
  - `maio 2026`
  - `01/05 a 25/05`
- Se omitido, usar os últimos 30 dias como default.

---

## Recursos

| Recurso | Caminho / MCP |
|---------|---------------|
| Taxonomy (squads + módulos) | `taxonomy.md` (raiz do framework) |
| Members (TLs, PMs, chat IDs) | `members.md` (raiz do framework) |
| ENV.md (channel ID salvo) | `$IDE/ENV.md` |
| MCP `$MESSAGE_COMUNICATOR` — leitura | `{$MESSAGE_COMUNICATOR}_read_channel` |
| MCP `$MESSAGE_COMUNICATOR` — busca de canais | `{$MESSAGE_COMUNICATOR}_search_channels` |
| MCP `$MESSAGE_COMUNICATOR` — envio de mensagem | `{$MESSAGE_COMUNICATOR}_send_message` |
| MCP `$MESSAGE_COMUNICATOR` — envio de draft | `{$MESSAGE_COMUNICATOR}_send_message_draft` |

> **Resolução de MCPs:** substituir `{$MESSAGE_COMUNICATOR}` pelo valor do ENV.md.
> Ex: se `MESSAGE_COMUNICATOR=slack`, os MCPs são `slack_read_channel`, `slack_send_message`, etc.

---

## Pré-requisito

1. **ENV.md** deve existir e estar válido (validação padrão do framework)
2. **`MESSAGE_COMUNICATOR`** deve estar definido no ENV.md (ex: `slack`, `teams`, `discord`)
3. **MCP do `$MESSAGE_COMUNICATOR`** deve estar disponível (ferramentas `{$MESSAGE_COMUNICATOR}_read_channel`, `{$MESSAGE_COMUNICATOR}_send_message`)
4. **taxonomy.md** deve conter squads com campo `modules:` preenchido
5. **members.md** deve existir (para tags de TLs/PMs no relatório)

---

## Quando Usar

**Usar quando:**
- Liderança precisa de análise consolidada de churn por squad
- Reunião de produto/engenharia precisa de dados de churn atualizados
- PM ou TL quer entender quais motivos de churn impactam seu squad
- Análise periódica (semanal, quinzenal, mensal) de churn

**NÃO usar quando:**
- O canal do `$MESSAGE_COMUNICATOR` não contém mensagens estruturadas de churn (apenas conversas livres)
- O objetivo é prever churn (este skill analisa churn já confirmado)
- Não há MCP do `$MESSAGE_COMUNICATOR` configurado

---

## Padrões Críticos

1. **Zero hardcode** — channel ID, squads, módulos e membros são todos lidos dinamicamente
2. **Canal perguntado e salvo** — na primeira execução sem `CHURN_CHANNEL_ID` no ENV.md, perguntar ao usuário e salvar para futuras execuções
3. **Classificação via taxonomy.md** — o mapeamento motivo → squad usa o campo `modules:` dos squads, nunca listas fixas
4. **Relatório narrativo** — não é tabela seca; inclui insights extraídos das descrições, padrões identificados e ações recomendadas
5. **Entrega com escolha** — o usuário decide se envia como draft ou mensagem direta no `$MESSAGE_COMUNICATOR`

---

## Fluxo de Trabalho

### Fase 1 — Validação e Configuração do Canal

**1.1** Validar ENV.md (padrão do framework). Ler `MESSAGE_COMUNICATOR` do ENV.md.

**1.2** Verificar se `CHURN_CHANNEL_ID` existe no ENV.md:

```bash
grep "CHURN_CHANNEL_ID" $IDE/ENV.md
```

**1.3** Se **não existir**:

- Perguntar ao usuário:
  ```
  Qual canal do {$MESSAGE_COMUNICATOR} contém as mensagens de churn confirmado?
  (ex: #cs-churn-realizado, #churn-alerts)
  ```
- Opcionalmente, buscar canais via MCP para sugerir:
  ```
  {$MESSAGE_COMUNICATOR}_search_channels("churn")
  ```
- Após o usuário informar, obter o channel_id via MCP e salvar no ENV.md:
  ```markdown
  ## Churn Audit
  CHURN_CHANNEL_ID={channel_id}
  ```
- Confirmar:
  ```
  Canal salvo no ENV.md: #{nome_canal} ({channel_id})
  Nas próximas execuções, este canal será usado automaticamente.
  ```

**1.4** Se **já existir**: usar o channel_id salvo. Informar ao usuário qual canal será lido.

---

### Fase 2 — Coleta de Mensagens

**2.1** Calcular o range de datas com base no argumento `período`:
- Converter para timestamps Unix (oldest/latest) para o filtro da API
- Default: últimos 30 dias

**2.2** Ler mensagens do canal via MCP:

```
{$MESSAGE_COMUNICATOR}_read_channel(channel_id, limit=200)
```

> Se o período gerar mais de 200 mensagens, paginar.

**2.3** Filtrar apenas mensagens que contenham campos estruturados de churn.
Campos esperados no formato padrão (key: value ou bold key):

| Campo | Obrigatório | Exemplo |
|-------|-------------|---------|
| Cliente / Empresa | sim | `Cliente: Acme Corp` |
| MRR / Valor | sim | `MRR: R$ 1.500` |
| Motivo (N1, N2 ou N3) | sim | `Motivo N1: Produto` |
| Descrição / Contexto | não | texto livre após os campos |
| CS responsável | não | `CS: Ana Silva` |
| Data de churn | não | `Data: 2026-05-15` |

> **Nota:** o formato exato pode variar por CRM (HubSpot, Salesforce, etc.).
> O parser deve ser tolerante a variações (bold, plain text, emoji prefixes).
> Mensagens que não seguem o formato estruturado devem ser ignoradas com aviso ao final.

**2.4** Reportar ao usuário:
```
Coletadas {N} mensagens de churn no período {data_inicio} a {data_fim}.
{M} mensagens ignoradas (formato não estruturado).
```

---

### Fase 3 — Parsing

**3.1** Para cada mensagem coletada, extrair:

```
{
  cliente: string,
  mrr: number,
  cs: string | null,
  motivo_n1: string,
  motivo_n2: string | null,
  motivo_n3: string | null,
  descricao: string | null,
  data_churn: date | null,
  raw_message: string
}
```

**3.2** Normalizar valores:
- MRR: remover `R$`, pontos e vírgulas → converter para número
- Motivos: normalizar para UPPERCASE e trim
- Datas: converter para ISO-8601

**3.3** Se algum campo obrigatório estiver ausente, marcar a entrada como `parcial`
e incluir na análise com flag.

---

### Fase 4 — Classificação por Squad

**4.1** Ler `taxonomy.md` — extrair todos os squads com seus campos `modules:`.

**4.2** Para cada churn, classificar o squad responsável:

1. Analisar `motivo_n1`, `motivo_n2`, `motivo_n3` e `descricao`
2. Comparar com os módulos de cada squad em `taxonomy.md`
3. Atribuir o squad cujos módulos têm maior overlap semântico com o motivo/descrição
4. Se ambíguo (overlap similar entre 2+ squads): atribuir ao squad com match mais específico e registrar os demais como `contribui`

**4.3** Classificação semântica — regras de matching:

- Match direto: motivo menciona módulo exato listado no `taxonomy.md` do squad
- Match semântico: motivo descreve problema que pertence ao domínio do squad
  (ex: "plataforma lenta" → CORE; "não entendeu o sistema" → SUPPORT + squad do módulo)
- Match por N3: se N3 é específico (ex: "SNE"), mapear para o squad dono do módulo

**4.4** Cada churn deve ter:
```
squad_responsavel: string       — squad principal
squads_contribuintes: string[]  — squads que contribuem
confianca: alta | media | baixa — nível de confiança da classificação
```

---

### Fase 5 — Agrupamento e Análise

**5.1** Agrupar por **padrão de problema** (não apenas por squad):
- Identificar motivos recorrentes que aparecem em 3+ churns
- Nomear cada padrão (ex: "Falta de Adoção", "Cobertura Geográfica Insuficiente", "Falhas de Pagamento")

**5.2** Para cada padrão:
- Contar casos e somar MRR perdido
- Extrair insights das descrições (o que os clientes disseram em comum)
- Identificar o squad responsável principal

**5.3** Calcular resumo por squad:
```
| Squad | Casos | MRR Perdido | Padrão Dominante |
```

**5.4** Identificar Top 3 ações imediatas:
- Priorizar por: MRR perdido × frequência × capacidade de ação do squad
- Cada ação deve ser concreta (não genérica) e endereçada a um squad específico

---

### Fase 6 — Geração e Entrega do Relatório

**6.1** Ler `members.md` — extrair TLs e PMs de cada squad mencionado no relatório.
Usar o chat user ID da coluna correspondente para tags/menções no formato nativo do `$MESSAGE_COMUNICATOR`.

**6.2** Gerar relatório em markdown nativo do `$MESSAGE_COMUNICATOR` com a seguinte estrutura fixa:

```markdown
:bar_chart: *Análise de Churn — {período}*

> {N} churns confirmados | MRR perdido: R$ {total}
> Canal: #{nome_canal} | Gerado em {data_geracao}

---

:mag: *Padrões Identificados*

*1. {Nome do Padrão}* — {N} casos | R$ {mrr}
{Insight extraído das descrições — 2-3 linhas narrativas}
Squad: *{squad}* — cc {menção_TL} {menção_PM}

*2. {Nome do Padrão}* — {N} casos | R$ {mrr}
{Insight}
Squad: *{squad}* — cc {menção_TL}

(...repetir para cada padrão relevante)

---

:clipboard: *Resumo por Squad*

```
Squad              | Casos | MRR Perdido | Padrão Dominante
-------------------|-------|-------------|------------------
{SQUAD}            |   {N} | R$ {valor}  | {padrão}
{SQUAD}            |   {N} | R$ {valor}  | {padrão}
```

---

:dart: *Top 3 Ações Imediatas*

1. *{SQUAD}* — {ação concreta}
   {justificativa em 1 linha}

2. *{SQUAD}* — {ação concreta}
   {justificativa}

3. *{SQUAD}* — {ação concreta}
   {justificativa}

---

:warning: _Classificações com confiança baixa: {N} (detalhes disponíveis sob demanda)_
```

> **Formato de menção por plataforma:**
> - `MESSAGE_COMUNICATOR=slack` → `<@UXXXXXXXXXX>`
> - `MESSAGE_COMUNICATOR=teams` → `<at>nome</at>`
> - `MESSAGE_COMUNICATOR=discord` → `<@user_id>`

**6.3** Exibir o relatório ao usuário para revisão.

**6.4** Perguntar ao usuário:

```
Relatório pronto. Como deseja entregar?

1. Enviar como draft no {$MESSAGE_COMUNICATOR} (você revisa antes de publicar)
2. Enviar direto no canal {canal_destino}
3. Enviar em DM para alguém específico
4. Apenas copiar o texto (não enviar no {$MESSAGE_COMUNICATOR})
```

**6.5** Executar a entrega conforme escolha:
- **1 (draft):** usar `{$MESSAGE_COMUNICATOR}_send_message_draft` no canal que o usuário indicar
- **2 (direto):** usar `{$MESSAGE_COMUNICATOR}_send_message` no canal destino (perguntar qual se diferente do canal de leitura)
- **3 (DM):** perguntar destinatário, buscar chat user ID em `members.md`, usar `{$MESSAGE_COMUNICATOR}_send_message`
- **4 (copiar):** apenas exibir o relatório formatado

---

## Regras

### Nunca
- Hardcodar channel ID, nomes de squad, módulos, chat user IDs ou nome de plataforma no skill
- Inventar dados de churn — toda informação vem das mensagens do canal
- Classificar um churn sem consultar `taxonomy.md` — nunca usar listas fixas de squads/módulos
- Enviar relatório no `$MESSAGE_COMUNICATOR` sem confirmação explícita do usuário
- Incluir dados sensíveis do cliente (CPF, CNPJ, contrato) no relatório — apenas nome da empresa
- Referenciar MCP tools por nome fixo (ex: `slack_read_channel`) — sempre usar `{$MESSAGE_COMUNICATOR}_*`

### Sempre
- Ler `MESSAGE_COMUNICATOR` do ENV.md para resolver nomes de MCP tools e formato de menções
- Perguntar o canal na primeira execução e salvar no ENV.md
- Ler `taxonomy.md` e `members.md` a cada execução (podem ter mudado)
- Mostrar o relatório ao usuário antes de enviar
- Informar quantas mensagens foram ignoradas por formato incompatível
- Incluir nível de confiança nas classificações ambíguas

---

## Checklist de Conclusão

- [ ] ENV.md validado (`MESSAGE_COMUNICATOR` presente)
- [ ] Canal configurado (perguntado ou lido do ENV.md)
- [ ] Mensagens coletadas e filtradas
- [ ] Campos extraídos de cada mensagem
- [ ] Classificação por squad via taxonomy.md
- [ ] Agrupamento por padrão de problema
- [ ] Resumo por squad calculado
- [ ] Top 3 ações identificadas
- [ ] Tags de TLs/PMs carregadas de members.md
- [ ] Relatório gerado e exibido ao usuário
- [ ] Entrega realizada conforme escolha do usuário

---

## Output

| Artefato | Destino |
|----------|---------|
| Relatório narrativo em markdown do `$MESSAGE_COMUNICATOR` | Canal do `$MESSAGE_COMUNICATOR` (via MCP) ou texto local |
| `CHURN_CHANNEL_ID` salvo no ENV.md | `$IDE/ENV.md` (apenas na primeira execução) |

---

## Mensagem de Conclusão

```
── Churn Audit concluído ─────────────────────────────────────
  Período    : {período}
  Churns     : {N} analisados ({M} ignorados)
  MRR perdido: R$ {total}
  Squads     : {lista de squads afetados}
  Entrega    : {draft / canal / DM / local}
─────────────────────────────────────────────────────────────
```
