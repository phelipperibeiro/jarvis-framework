# Caso investigar

O `/eng.debug` recebeu um **sintoma concreto**: chave ou URL do card, mensagem de erro, stack trace ou "X acontece quando Y". Aqui o objetivo é achar a causa de **um** bug e propor a correção, sem mexer em nada. Siga o método e a política de acesso do [`SKILL.md`](../SKILL.md).

## 1. Coletar o sintoma

- **Card:** se `TASK_MANAGER` estiver preenchido, leia o card no board (só leitura). Sem acesso, peça ao usuário para colar o conteúdo. Nunca comente no card.
- Do card ou da mensagem, registre: título, passos para reproduzir, ambiente (local, staging, produção), serviços citados, identificador de correlação (correlation ID ou request ID) e logs ou stack trace anexados.
- Pergunte só o que falta: identificador de correlação, frequência (sempre, às vezes, uma vez), mudança recente (deploy, feature flag, migração, infraestrutura), logs não anexados.

## 2. Ler o código antes de levantar hipóteses

Obrigatório: hipótese sem leitura de código é especulação.

1. **Ponto de entrada:** com arquivo:linha no stack trace, leia ao redor dessa linha; só com a rota, a fila ou o nome da função, localize o handler buscando pelo nome nos repositórios do workspace.
2. **Leia o fluxo:** quem recebe (handler, consumidor, job), quem processa (serviço, regra de negócio) e o ponto exato do erro (o que a linha faz e que estado espera).
3. **O que procurar:**

| O que procurar | Por que importa |
|----------------|-----------------|
| Tratamento de erro ausente ou genérico | Pode estar engolindo o erro real |
| Chamada a outro serviço sem tempo limite | Bug intermitente por lentidão |
| Operação assíncrona sem espera ou sem tratamento | Condição de corrida ou erro perdido |
| Validação de entrada ausente | Dado inválido chegando na camada errada |
| Dependência de estado externo (cache, banco, outro serviço) | Falha intermitente por estado inconsistente |
| Identificador de correlação não repassado | Rastreio entre serviços vira trabalho manual |

4. **Registre o que leu** (vai para "Código lido" do relatório): arquivo:linha, fluxo e o trecho mais suspeito (até 10 linhas). Sem acesso ao repositório, peça o trecho ao usuário.

## 3. Hipóteses e cruzamento de serviços

- Levante as hipóteses como diz o método do `SKILL.md`.
- **Se o bug cruza serviços** (o usuário cita outro serviço; o stack trace tem URL de outro serviço, nome de fila ou erro de cliente HTTP; funciona isolado e falha no fluxo completo; falha intermitente que some na retentativa) **e** `eng-backend-microservices-trace` está registrada em `BACKEND_SPECIALIZATIONS`: chame-a com `{serviço-de-entrada} {sintoma-ou-chave}`. As hipóteses rankeadas do `ms-trace-report.md` substituem as suas, e a investigação segue pela fronteira de maior risco. Sem a especialização, aplique [`fronteiras-entre-componentes.md`](fronteiras-entre-componentes.md) à mão.

## 4. Plano de investigação e evidências

- Monte um plano incremental e seguro: logs e métricas a observar, consultas sem risco, testes que o usuário pode rodar. Diga sempre o que é só leitura e o que exigiria alterar código, configuração ou dados (e, então, em que ambiente, pela política de acesso).
- A cada evidência, atualize as hipóteses (descartadas, fortalecidas). Ao convergir, explique o mecanismo do bug, por que não aparecia antes (se for o caso) e o impacto em outros fluxos.

## 5. Correção proposta

Só com evidência razoável:

- Descreva a mudança, os componentes afetados e os testes para depois dela.
- Correção arriscada: proponha uma alternativa mais conservadora, um contorno temporário e como fazer deploy e rollback.

## 6. Próximo passo: `/eng.work` ou `/eng.plan`

**Vá direto ao `/eng.work`** só se **tudo** for verdade: uma única correção clara, impacto cirúrgico (um arquivo, uma função), sem risco de efeito colateral, correção trivial (ex.: valor errado, condição invertida). Diga ao usuário que o `/eng.plan` está sendo pulado e por quê.

**Passe pelo `/eng.plan`** se **qualquer** um for verdade: mais de uma abordagem com trade-offs; mais de um componente ou serviço; risco de regressão; causa com decisão de arquitetura; mudança de infraestrutura, banco ou configuração; categoria `BUG-CRÍTICO` ou `SEGURANÇA`. Neste caso, grave também `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md` no template `templates/engineering/architecture-template.md`, na forma curta do tipo `bugfix` (contexto, causa raiz, estado atual e proposto, componentes, riscos, testes) e com as alternativas de correção como **Questões em Aberto**. É esse arquivo que o `/eng.plan` exige.

## 7. Relatório

Grave `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/debug-report.md` no template `templates/engineering/debug-report-template.md`, sempre, com qualquer veredito:

- **Teste de regressão:** descreva, com a base `eng-qa` (tema 5, Automação de Testes) e a especialização de `QA_SPECIALIZATIONS`, se houver, o teste que reproduz o bug (falha antes da correção, passa depois, cobre o caso que causou o bug). Ele é escrito no `/eng.work`.
- **Plano de validação:** testes antes do deploy, passos em staging, o que observar depois (logs com o identificador de correlação, métricas, alertas que deveriam ter disparado).
- **Critério de resolvido:** comportamento confirmado nos passos de reprodução e sem nova ocorrência por 24h (P0), 48h (P1) ou 1 semana (P2).
- **Débitos e melhorias:** observabilidade, tratamento de erro, tempo limite, retentativa, fila de falhas, identificador de correlação (regra de `eng-rules.md`), testes que teriam evitado o bug. Estruture cada um com a base `eng-qa` (tema 14, Gestão de Testes e de Defeitos) como **card pronto** (`DÉBITO-TÉCNICO P{0-3}`, vinculado ao `{TASK_MANAGER_KEY}`). Separe o que entra na correção atual do que fica para depois.
