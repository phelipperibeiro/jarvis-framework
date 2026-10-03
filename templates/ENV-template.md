# =============================================================================
# ENV.md — contexto do workspace para o Jarvis
# =============================================================================
# Copiado para $IDE/ENV.md pelo /init-jarvis.
# Valores entre [colchetes] são opções — escolha UMA e apague o resto.
# Deixe em branco o que não usar. Não coloque tokens/segredos no chat.
# =============================================================================


# --- Workspace e identidade --------------------------------------------------
# Workspace = a pasta que contém $IDE/. Não é o nome de um repo.
# Vazio: o CLI usa o nome dessa pasta. Preencha só se quiser outro slug.
#
#   meu-app/                    ← um git aqui
#   ├── .windsurf/ENV.md
#   ├── .jarvis/sessions/
#   └── .git/
#
#   workspace-squad/            ← vários gits nas subpastas
#   ├── .windsurf/ENV.md
#   ├── .jarvis/sessions/
#   ├── repo-api-1/
#   └── repo-frontend/
#
# WORKSPACE_REPOS = allowlist opcional. Vazio = todas as subpastas com .git/.
WORKSPACE=
WORKSPACE_REPOS=
USER=

# Limite de autonomia da IA neste workspace (60–100). 80 = a IA executa até 80%.
MAX_AI_EXECUTION_PERCENTAGE=80

# Context-Driven Development — deixe true. O warm-up calibra o comportamento.
ENABLE_CDD=true


# --- Organização (obrigatório — opções vêm do taxonomy.md) -------------------
SQUAD=[CORE, SUPPORT]
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

# Pastas de produto (derivadas das de cima — em geral não precisa mexer)
PROD_FOLDER_NAME=product
PROD_RULES=$RULES_FOLDER/$PROD_FOLDER_NAME
PROD_FLOWS=.$IDE/$FLOWS_FOLDER
PROD_TEMPLATES=.$IDE/$TEMPLATES_FOLDER/$PROD_FOLDER_NAME
PROD_DOCS=$DOCS_FOLDER/$PROD_FOLDER_NAME


# --- Especializações de stack ------------------------------------------------
# Skills especializados que o Jarvis carrega junto com o skill base de cada área.
# Lista de nomes de skill separados por vírgula. Ex: eng-backend-golang,eng-backend-nestjs
# Vazio = só o skill base (eng-backend / eng-frontend). A variável precisa EXISTIR, mesmo vazia.
BACKEND_SPECIALIZATIONS=
FRONTEND_SPECIALIZATIONS=


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


# --- Tech Analyst (opcional) -------------------------------------------------
# Project key do board de triagem N2 (cards que chegam ao Tech Analyst).
TASK_MANAGER_HUBS_BOARD=


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
# Usado pelo skill /report-issue. Alias: JARVIS_GITLAB_PROJECT.
# Token: GitLab .npmrc | GitHub gh auth / GITHUB_TOKEN | Bitbucket BITBUCKET_TOKEN.
JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework


# --- Central docs (opcional) -------------------------------------------------
# Repo de documentação canônica (PRD, FRD, ARD, RFC). Em branco = desligado.
CENTRAL_DOCS_REPO=
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=main
# Revisores padrão dos MRs (separados por vírgula).
CENTRAL_DOCS_REVIEWERS=
# TTL do cache opcional (redis-cli, se existir). 3600 = 1 hora.
CENTRAL_DOCS_CACHE_TTL=3600
