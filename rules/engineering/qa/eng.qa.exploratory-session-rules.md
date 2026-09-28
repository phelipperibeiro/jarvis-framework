# Regras de Sessão de Teste Exploratório — QA Engineering

> **Applies to:** HUB: QA | POSITION: all | AREA: ENGINEERING | SQUAD: all

Convenções para planejamento, execução e documentação de sessões de teste exploratório estruturado.
Carregadas automaticamente pelo `warm-up` quando `HUB=QA`.

---

## 1. Estrutura de Charter

Todo teste exploratório começa com um **charter** — a declaração do objetivo da sessão.

**Formato obrigatório:**

```
Explorar {área/feature/fluxo}
para descobrir {tipo de informação / riscos a validar}
com foco em {dimensão de qualidade}
```

**Exemplos:**

```
Explorar o fluxo de cadastro de veículos
para descobrir comportamentos inesperados em campos opcionais e limites de dados
com foco em robustez e validação de formulário

Explorar a integração de pagamentos após alteração de plano
para descobrir regressões introduzidas pela última release
com foco em consistência de estado e mensagens ao usuário
```

**Regras do charter:**
- Máximo 3 linhas — objetivo claro, não um roteiro detalhado
- Não listar passos no charter — exploração decide o caminho
- Um charter por sessão (sessões paralelas têm charters independentes)

---

## 2. Time-box Padrão

| Tipo de sessão | Duração | Quando usar |
|----------------|---------|-------------|
| Rápida (spot check) | 30 min | Verificação pontual, pós-fix rápido |
| Padrão | 60 min | Feature nova, área de risco moderado |
| Profunda | 90 min | Feature crítica, área de alto risco, pré-release |

**Regras de time-box:**
- Nunca estender uma sessão além do tempo definido — iniciar nova sessão se necessário
- Os primeiros 10 min são de setup e entendimento — não contam como execução
- Registrar hora de início e fim no documento de sessão
- Pausa obrigatória de 15 min entre sessões consecutivas

---

## 3. Classificação de Severidade de Bugs

| Severidade | Label | Critério | Ação imediata |
|------------|-------|----------|---------------|
| **Crítico** | `S1` | Sistema inutilizável, perda de dados, falha de segurança | Reportar imediatamente — não esperar fim da sessão |
| **Alto** | `S2` | Feature principal quebrada, sem workaround óbvio | Reportar ao final da sessão, com evidência |
| **Médio** | `S3` | Feature funciona mas com comportamento incorreto ou inconsistente | Registrar no doc da sessão, criar card após |
| **Baixo** | `S4` | UI incorreta, texto errado, comportamento subótimo mas funcional | Registrar no doc da sessão, agrupar em batch |
| **Melhoria** | `S5` | Não é bug — sugestão de UX ou comportamento melhor | Separar claramente de bugs reais |

**Regras de severidade:**
- Nunca sub-reportar para "não incomodar" — severidade é objetiva, não subjetiva
- Um bug S1 interrompe a sessão e é reportado via canal direto ao time
- Bugs S4 e S5 podem ser agrupados em um card único "ajustes UI/UX — {área}"

---

## 4. Critérios de Parada de Sessão

Encerrar a sessão antes do time-box quando:

| Critério | Ação |
|----------|------|
| Bug S1 encontrado | Interromper, reportar imediatamente, documentar contexto |
| Ambiente instável (falhas de infra, não de software) | Encerrar, registrar causa, reagendar |
| Charter atingido antes do tempo | Encerrar normalmente, registrar cobertura atingida |
| Descoberta muda completamente o escopo | Encerrar, definir novo charter para próxima sessão |

**Nunca encerrar uma sessão sem:**
- Registrar o que foi explorado (mesmo que parcialmente)
- Classificar cada achado com severidade
- Marcar se o charter foi atingido (`completo`, `parcial`, `bloqueado`)

---

## 5. Dimensões de Qualidade para Foco

Ao definir o charter, escolher no máximo 2 dimensões de qualidade:

| Dimensão | O que verificar |
|----------|----------------|
| **Funcionalidade** | O comportamento faz o que a spec diz? |
| **Robustez** | Reage bem a entradas inesperadas, limites, dados faltantes? |
| **Consistência** | Estado do sistema permanece coerente após a ação? |
| **Performance percebida** | Tempos de resposta aceitáveis para o usuário? |
| **Acessibilidade** | Navegação por teclado, leitores de tela, contraste? |
| **Segurança superficial** | Dados expostos indevidamente, autorização correta? |
| **Integração** | Comunicação correta com outros módulos/serviços? |
| **Regressão** | Funcionalidades existentes ainda funcionam após mudança? |

---

## 6. Evidências Obrigatórias

Para cada bug reportado:

```
- Severidade: S{1-5}
- Passos para reproduzir: numerados, a partir do estado inicial
- Comportamento observado: o que aconteceu
- Comportamento esperado: o que deveria acontecer
- Evidência: screenshot, vídeo ou log (obrigatório para S1/S2)
- Ambiente: URL/versão/dados usados no momento do bug
- Reprodutível?: sim / às vezes / não consegui reproduzir novamente
```

---

## 7. Integração com `eng-qa-bug-report`

Ao final de cada sessão, para cada achado S1–S4, acionar o skill `eng-qa-bug-report`:

```
/eng-qa-bug-report create
  --title="{descrição concisa}"
  --severity="S{1-4}"
  --session="{id da sessão}"
  --passos="{passos reproduzidos}"
```

Achados S5 (melhorias) são registrados apenas no doc da sessão — não viram card automaticamente.
