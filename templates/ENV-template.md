# =============================================================================
# ENV.md — contexto do workspace para o Jarvis
# =============================================================================
# Copiado para $IDE/ENV.md pelo /jarvis-init.
# Valores entre [colchetes] são opções — escolha UMA e apague o resto.
# Deixe em branco o que não usar. Não coloque tokens/segredos no chat.
# =============================================================================


# --- Workspace e identidade --------------------------------------------------
# Workspace = a pasta que contém $IDE/. Não é o nome de um repo.
# Vazio: o CLI usa o nome dessa pasta. Preencha só se quiser outro slug.
#
#   meu-app/                    ← a raiz é um repositório (WORKSPACE_MODE=project)
#   ├── .windsurf/ENV.md
#   ├── .jarvis/sessions/
#   └── .git/
#
#   workspace-squad/            ← a raiz NÃO é repositório; 1 ou mais subpastas com .git
#   ├── .windsurf/ENV.md          (WORKSPACE_MODE=workspace)
#   ├── .jarvis/sessions/
#   ├── repo-api-1/
#   └── repo-frontend/
#
# WORKSPACE_REPOS = allowlist opcional. Vazio = todas as subpastas com .git/.
# WORKSPACE_MODE = workspace | project (detectado pelo /jarvis-init e pelo upgrade).
#   workspace: a raiz não tem .git e há 1+ subpastas com .git/ (não depende do número de repos).
#   project:   a raiz tem .git. O git já delimita o que é código.
WORKSPACE=
WORKSPACE_REPOS=
WORKSPACE_MODE=
USER=

# Limite de autonomia da IA neste workspace (60–100). 80 = a IA executa até 80%.
MAX_AI_EXECUTION_PERCENTAGE=80

# Context-Driven Development — deixe true. Os comandos eng.* calibram o comportamento pelo CDD.
ENABLE_CDD=true


# --- Organização (obrigatório — opções vêm do taxonomy.md) -------------------
SQUAD=[CORE]
HUB=[AI, FRONTEND, BACKEND, QA, DATA, FULLCYCLE]
AREA=[ENGINEERING, PRODUCT]
POSITION=[JUNIOR, PLENO, SENIOR, TECH LEAD, SPECIALIST, PM, TPM, GPM, CTO, GENERALIST]


# --- IDE e pastas ------------------------------------------------------------
# Qual IDE este ENV.md alimenta. FLOWS_FOLDER: workflows (maioria) ou commands (Claude).
IDE=[windsurf, claude, cursor, codex, opencode, gemini, antigravity]
DOCS_FOLDER=docs
FLOWS_FOLDER=[workflows se IDE != claude | commands se IDE = claude]
TEMPLATES_FOLDER=templates
RULES_FOLDER=.$IDE/rules

# Sessões de trabalho — relativo à pasta do workspace (a que contém $IDE/), não ao cwd.
# jarvis init cria .jarvis/sessions/{eng,prod,qa} e adiciona .jarvis/ ao .gitignore.
#   $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
#   $SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/
#   $SESSIONS_DIR/qa/
# Cookie/HTTP session (auth) NÃO é esta pasta.
SESSIONS_DIR=.jarvis/sessions

# Documentos de trabalho gerados pelos comandos (PRD, FRD, épicos, ARD, RFC, SPEC, QA, swagger,
# robôs, C4…): sempre em $DOCS_FOLDER/jarvis/, nos dois modos de trabalho, com docs/jarvis/
# no .gitignore (o /jarvis-init garante). O que foi implementado vai para o Central docs.
JARVIS_DOCS=$DOCS_FOLDER/jarvis
# Engenharia: ARD/, RFC/, qa/, swagger/, openapi/, robots/, c4/
ENG_DOCS=$JARVIS_DOCS/engineering

# Pastas de produto (derivadas das de cima — em geral não precisa mexer)
PROD_FOLDER_NAME=product
PROD_RULES=$RULES_FOLDER/$PROD_FOLDER_NAME
PROD_FLOWS=.$IDE/$FLOWS_FOLDER
PROD_TEMPLATES=.$IDE/$TEMPLATES_FOLDER/$PROD_FOLDER_NAME
PROD_DOCS=$JARVIS_DOCS/$PROD_FOLDER_NAME

# Discoveries (rascunhos de ideia, anteriores ao PRD) — fora de product/ (em geral não precisa mexer)
DISCOVERIES_FOLDER_NAME=discoveries
DISCOVERIES_DOCS=$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME

# Modo de condução dos comandos de produto (prod.*) e do eng.create-ard.
#   product-led      = para PMs: fluxo direto, sem explicações extras (padrão se vazio)
#   developer-guided = para devs e futuros PMs: uma pergunta por vez, explica cada termo e etapa
# Perguntado sempre pelo /jarvis-init. Para trocar, rode o /jarvis-init ou edite aqui.
PROD_MODE=

# Estilo dos artefatos gerados (commits, PRs, comentários e documentos).
#   ai-generated    = como hoje: metadados, links de rastreabilidade e padrões da ferramenta (padrão)
#   human-generated = nada publicado leva marca de IA; todo documento gerado oferece a versão {nome}.public.md
# Perguntado pelo /jarvis-init. Trocou à mão? Rode /jarvis-init upgrade (copia ou remove a rule do estilo).
ARTIFACT_STYLE=ai-generated


# --- Especializações por área -------------------------------------------------
# Skills especializados que o Jarvis carrega junto com o skill base de cada área.
# Lista de nomes de skill separados por vírgula. Ex: eng-backend-golang,eng-backend-nestjs
# Vazio = só o skill base de cada área (eng-backend, eng-frontend, eng-qa,
# eng-data, eng-automation, eng-platform). Toda variável precisa EXISTIR,
# mesmo vazia — ver rules/engineering/eng.specializations-rules.md.
# QA_SPECIALIZATIONS vem com eng-qa-planner por padrão: é a única especialização de QA hoje
# e cobre planejamento/gap de cobertura, útil pra quase todo projeto. Remova se não quiser.
BACKEND_SPECIALIZATIONS=
FRONTEND_SPECIALIZATIONS=
QA_SPECIALIZATIONS=eng-qa-planner
DATA_SPECIALIZATIONS=
AUTOMATION_SPECIALIZATIONS=
PLATFORM_SPECIALIZATIONS=


# --- Task manager (opcional) -------------------------------------------------
# Board de cards. Vazio = freelance: sem Jira/Linear/etc.
# Nesse caso o workflow pergunta um número de controle próprio (TASK_MANAGER_KEY)
# e usa isso na pasta da sessão e no nome da branch.
# URL base para links nos alertas (ex: https://empresa.atlassian.net).
TASK_MANAGER=[jira, linear, github, asana]
TOKEN_TASK_MANAGER=
TASK_MANAGER_URL_BASE=


# --- Controle de versão (opcional) -------------------------------------------
# Token NÃO vai aqui: GitLab → .npmrc; GitHub → gh auth ou GITHUB_TOKEN;
# Bitbucket → BITBUCKET_TOKEN.
VERSION_CONTROL=[gitlab, github, bitbucket]


# --- Mensageria (opcional) ---------------------------------------------------
MESSAGE_BROKER=[rabbitmq, kafka, sqs]
MESSAGE_BROKER_URL_API=
MESSAGE_BROKER_API_AUTH=


# --- Banco de dados (opcional) -----------------------------------------------
DATABASE=[mysql, postgres, mongodb]
USER_DATABASE=
PASSWORD_DATABASE=
HOST_DATABASE=
PORT_DATABASE=


# --- Chat / comunicador (opcional) -------------------------------------------
# slack: BOT_TOKEN + SIGNING_SECRET + APP_TOKEN (Socket Mode)
# discord: BOT_TOKEN (Bot) + ALERTS_CHANNEL = ID do canal
# teams: BOT_TOKEN = URL do Incoming Webhook (SIGNING/APP vazios)
MESSAGE_COMUNICATOR=[slack, discord, teams]
MESSAGE_COMUNICATOR_BOT_TOKEN=
MESSAGE_COMUNICATOR_SIGNING_SECRET=
MESSAGE_COMUNICATOR_APP_TOKEN=
ALERTS_CHANNEL=


# --- Object storage (opcional) -----------------------------------------------
OBJECT_STORAGE=[aws_s3, gcs, azure_blob]
TOKEN_OBJECT_STORAGE=


# --- Observabilidade (opcional) ----------------------------------------------
OBSERVABILITY=[sentry, datadog, grafana]
TOKEN_OBSERVABILITY=
OBSERVABILITY_ORG=


# --- SMTP (opcional) ---------------------------------------------------------
SMTP=[google, ses, sendgrid]


# --- RTK — Token Killer (opcional) -------------------------------------------
# Proxy CLI em Rust que comprime output de shell (economia 60–90% de tokens).
# Instale com: cargo install rtk (requer Rust).
# false = a rule RTK não é copiada para $IDE/rules/.
RTK_ENABLED=false


# --- Advisor (opcional) ------------------------------------------------------
# Modelos oferecidos quando o usuário escolhe usar o Advisor no início do eng.start,
# separados por vírgula. Até 4 viram opções da pergunta; o resto fica em "Outro".
# Vazio ou ausente = o Advisor usa "Sonnet 5.5" (fallback).
# Tradução para a IDE pela família (primeira palavra, em minúsculas: Sonnet → sonnet,
# Opus → opus, Fable → fable). No Claude Code só a família é respeitada: "Opus 5.5"
# e "Opus 5" abrem o mesmo modelo; remova um deles se quiser só opções distintas.
ADVISOR_MODELS="Sonnet 5.5,Opus 5.5,Opus 5,Fable 5.1"


# --- Data Engineering (só se HUB=DATA) ---------------------------------------
# Obrigatório quando HUB=DATA. Omitir o bloco inteiro se o HUB for outro.
DATA_ORCHESTRATOR=[airflow, prefect, dagster, glue-scheduler]
DATA_ETL_TOOL=[aws_glue, dbt, spark, pandas]
DATA_QUALITY_TOOL=[great_expectations, soda, deequ]
DATA_LAKE=[aws_s3, gcs, azure_adls]
DATA_QUERY_ENGINE=[aws_athena, bigquery, redshift, trino]
DATA_BI_TOOL=[metabase, looker, superset, power_bi]
# Vazio se não houver warehouse dedicado.
DATA_WAREHOUSE=[redshift, snowflake, bigquery]
DATA_REPO=[data-pipelines, etl-jobs, analytics-pipelines]


# --- Code quality (opcional) -------------------------------------------------
# Análise estática / quality gate. Em branco = sem MCP de code quality.
CODE_QUALITY_TOOL=[sonarqube, codeclimate, deepsource]
# URL da instância (self-hosted).
CODE_QUALITY_URL=
CODE_QUALITY_TOKEN=


# --- QA / suíte de testes (opcional) -----------------------------------------
# Caminho relativo à raiz do projeto.
# Cypress E2E: cypress | e2e | tests/e2e
# Unit/integração: tests | test | src/__tests__
TEST_FOLDER=


# --- QA / release sign-off (opcional) ----------------------------------------
# Branches que exigem sign-off QA antes do deploy (vírgula, aceita glob).
# Em branco = validação no CI desligada.
QA_SIGNOFF_BRANCHES=main,release/*
# Validade do sign-off em horas. Mais antigo que isso o CI rejeita.
QA_SIGNOFF_MAX_AGE=24


# --- Reportar bug no próprio Jarvis (opcional) ------------------------------
# URL ou path curto do repo do framework (ex: https://github.com/phelipperibeiro/jarvis-framework).
# Usado pelo skill /jarvis-report-issue. Alias: JARVIS_GITLAB_PROJECT.
# Token: GitLab .npmrc | GitHub gh auth / GITHUB_TOKEN | Bitbucket BITBUCKET_TOKEN.
JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework


# --- Central docs -------------------------------------------------------------
# O registro do que FOI IMPLEMENTADO: um documento completo por funcionalidade e um registro
# por entrega, gerados pelo /eng.spec-consolidate depois de cada PR. Ligado por padrão.
# Nunca dentro do versionamento de um repositório de código.
#   CENTRAL_DOCS_STORAGE: filesystem (s3 e gdrive virão nas issues #144 e #145); vazio = desligado
#   CENTRAL_DOCS_LOCATION: pasta do Central docs, relativa à pasta do workspace ou absoluta.
#     Padrão do /jarvis-init: ./central-docs (modo workspace, no .gitignore do workspace)
#     ou docs/jarvis/central-docs (projeto único, coberto por docs/jarvis/ no .gitignore).
#   Se a pasta for um clone de um repositório de documentação (tem .git): git pull antes
#   de ler e branch + commit + push + PR ao publicar. Sem .git: grava direto na pasta.
CENTRAL_DOCS_STORAGE=filesystem
CENTRAL_DOCS_LOCATION=./central-docs
# Só quando a pasta tem .git: branch lida no pull e branch base dos PRs.
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=main
# Revisores padrão dos PRs (separados por vírgula; vão na descrição).
CENTRAL_DOCS_REVIEWERS=
