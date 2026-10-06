/**
 * @fileoverview Constantes globais do sistema
 * @module config/constants
 */

/** @constant {string} Nome do pacote NPM */
export const CLI_NAME = "jarvis-framework";

/** @constant {string} Nome do arquivo de lock */
export const LOCK_FILE = "jarvis-lock.json";

/**
 * Diretórios que devem ser sincronizados do framework para a IDE
 * @constant {ReadonlyArray<string>}
 */
export const SYNC_DIRS = Object.freeze([
  "agents",
  "skills",
  "workflows",
  "templates",
  "rules",
  "rules-on-demand",
  "scripts",
]);

/**
 * Caminhos que saíram do framework e são removidos das instalações que atualizam.
 * Lista explícita, relativa à pasta da IDE (ex.: `.claude/`): o `init` nunca varre
 * nem apaga nada fora dela. Para uma remoção futura, acrescente o caminho aqui.
 * Inclui as pastas dos skills renomeados para o padrão de áreas (`<prefixo>-<área>-...`).
 * @constant {ReadonlyArray<string>}
 */
export const OBSOLETE_PATHS = Object.freeze([
  "skills/prod-specs/references",
  "skills/prod-specs/templates",
  "skills/prod-specs/rules",
  // Tech Analyst (removido): skill, agente e o comando, que é achatado na pasta de workflows de cada IDE
  "skills/eng-tech-analyst",
  "agents/engineering/eng.tech-analyst.agent.md",
  "workflows/eng.ta.atendimento.md",
  "commands/eng.ta.atendimento.md",
  "steering/eng.ta.atendimento.md",
  "steering/skills/skill-eng-tech-analyst.md",
  // churn-audit e lovable-prompt-generator (removidos)
  "skills/churn-audit",
  "skills/lovable-prompt-generator",
  "steering/skills/skill-churn-audit.md",
  "steering/skills/skill-lovable-prompt-generator.md",
  "skills/eng-nestjs",
  "skills/eng-rabbitmq",
  "skills/eng-arch-c4",
  "skills/eng-ms-trace",
  "skills/eng-microfrontend",
  "skills/eng-design-system",
  "skills/eng-cybersecurity",
  "skills/eng-threat-model",
  "skills/eng-performance-engineer",
  "skills/eng-pr",
  "skills/eng-jira-comment",
  "skills/eng-task-comment",
  "skills/eng-docs-write",
  "skills/eng-browser-extension-builder",
  "skills/prod-specs",
  "skills/prod-specs-update",
  "skills/prod-roadmap-report",
  "skills/init-jarvis",
  "skills/context-detect",
  "skills/report-issue",
  "skills/docs-central",
  "skills/docs-index",
  // eng.downstream-flow-rules (removida): processo de board de um time, acoplado a Jira
  "rules/engineering/eng.downstream-flow-rules.md",
  // rules de uma etapa só: saíram de rules/ (carregada no início) para rules-on-demand/ (lida pelo workflow)
  "rules/engineering/eng.start-rules.md",
  "rules/engineering/eng.plan-rules.md",
  "rules/engineering/eng.work-rules.md",
  "rules/engineering/eng.pr-rules.md",
  "rules/engineering/eng.pre-pr-rules.md",
  "rules/engineering/eng.tech-spec-rules.md",
  "rules/engineering/eng.breakdown-subtasks-rules.md",
  // Consolidação de QA (removidos): área QA ficou só com eng-qa (base) e eng-qa-planner
  "skills/eng-qa-test-plan",
  "skills/eng-qa-gate",
  "skills/eng-qa-cypress-e2e",
  "skills/eng-qa-dev-guide",
  "skills/eng-qa-exploratory",
  "skills/eng-qa-bug-report",
  "skills/eng-qa-quality-report",
  "skills/eng-qa-testsprite",
  "skills/eng-qa-a11y-audit",
  "skills/eng-qa-graphql-contract",
  "skills/eng-qa-e2e-spec-writer",
  "skills/eng-qa-e2e",
  "skills/eng-qa-unit-test",
  "workflows/engineering/qa/eng.qa-dev-quality-guide.md",
  "workflows/engineering/qa/eng.qa-e2e-test-generation.md",
  "workflows/engineering/qa/eng.qa-exploratory-session.md",
  "workflows/engineering/qa/eng.qa-quality-gate-validation.md",
  "workflows/engineering/qa/eng.qa-quality-report.md",
  "rules/engineering/qa/eng.qa.exploratory-session-rules.md",
  "rules/engineering/qa/eng.qa.quality-gate-scoring-rules.md",
  "rules/engineering/qa/eng.qa.tech-spec-validation-criteria-rules.md",
  "templates/engineering/qa/eng.qa.quality-gate-examples-template.md",
  "templates/engineering/qa/eng.qa.quality-gate-report-template.md",
  "templates/engineering/qa/qa.cypress-test-template.md",
  "templates/engineering/qa/qa.exploratory-session-template.md",
  "templates/engineering/qa/qa.quality-report-template.md",
  // Descontinuação da área security (removidos): segurança de app fica em eng-backend/eng-frontend,
  // segurança de infra e fundamentos entram em eng-platform ou em PLATFORM_SPECIALIZATIONS
  "skills/eng-security-cybersecurity",
  "skills/eng-security-threat-model",
  "skills/eng-security-triage",
  "skills/eng-security-patch",
  "agents/engineering/eng.cybersecurity.agent.md",
  "workflows/engineering/eng.security-review.md",
  "workflows/engineering/eng.security-incident.md",
  "workflows/engineering/eng.security-audit.md",
  "workflows/engineering/eng.security-pipeline.md",
  // eng-automation-robot-builder (removido): conversão de fluxo manual em robô Playwright
  // via Stagehand — sem skill de substituição hoje
  "skills/eng-automation-robot-builder",
  // eng-ai-engineer (removido): virou a base neutra eng-ai (padrão eng-backend, com references/)
  "skills/eng-ai-engineer",
  // Consolidação de data (removidos): área data ficou só com a base eng-data (padrão eng-backend)
  "skills/eng-data-engineer",
  "skills/eng-data-bi",
  "skills/eng-data-debug",
  "skills/eng-data-onboard",
  "skills/eng-data-orchestrator",
  // eng-global-browser-extension-builder (removido): sem uso real no framework
  "skills/eng-global-browser-extension-builder",
  // eng-devops-performance-engineer (removido): profiling, load testing/chaos e cache
  // multi-camada entraram no eng-platform (temas 14, 15, 16)
  "skills/eng-devops-performance-engineer",
  // eng-frontend-design-system e eng-frontend-microfrontend (removidos): princípios agnósticos
  // entraram na base eng-frontend (temas 13, 14)
  "skills/eng-frontend-design-system",
  "skills/eng-frontend-microfrontend",
  // rules/AGENTS.md e rules/product/README.md (issue #84): conteúdo de autoria movido
  // para docs/estrutura/rules.md; rules/product/README.md era órfão, sem referências
  "rules/AGENTS.md",
  "rules/product/README.md",
  // eng.bump-rules.md, eng.docs-scraping-rules.md e eng.rpa-rules.md (issue #86): rules de
  // uma etapa só saíram de rules/ (carregada no início) para rules-on-demand/ (lida pelo
  // workflow); eng.docs-scraping-rules.md foi fundida como seção 6 de eng.rpa-rules.md
  "rules/engineering/eng.bump-rules.md",
  "rules/engineering/eng.docs-scraping-rules.md",
  "rules/engineering/rpa/eng.rpa-rules.md",
]);

/**
 * Arquivos da raiz que devem ser sincronizados
 * @constant {ReadonlyArray<string>}
 */
export const SYNC_ROOT_FILES = Object.freeze(["taxonomy.md", "AGENTS.md", "members.md"]);

/**
 * Mapeamento de model do Jarvis para formato OpenCode (provider/model-id)
 * @constant {Readonly<Record<string, string>>}
 */
export const OPENCODE_MODEL_MAP = Object.freeze({
  // Anthropic — shorthands usados no Jarvis
  opus: "anthropic/claude-opus-4-6",
  sonnet: "anthropic/claude-sonnet-4-6",
  haiku: "anthropic/claude-haiku-4-5-20250414",
  // Anthropic — IDs completos
  "claude-opus-4-6-20250529": "anthropic/claude-opus-4-6",
  "claude-sonnet-4-6-20250514": "anthropic/claude-sonnet-4-6",
  "claude-sonnet-4-20250514": "anthropic/claude-sonnet-4-6",
  "claude-haiku-4-5-20250414": "anthropic/claude-haiku-4-5-20250414",
  // OpenAI
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gpt-4.1": "openai/gpt-4.1",
  "gpt-4.1-mini": "openai/gpt-4.1-mini",
  "gpt-4.1-nano": "openai/gpt-4.1-nano",
  o3: "openai/o3",
  "o3-mini": "openai/o3-mini",
  "o4-mini": "openai/o4-mini",
  // Google
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.0-flash": "google/gemini-2.0-flash",
});

/**
 * Permissões padrão para agents OpenCode
 * @constant {Readonly<Record<string, string>>}
 */
export const OPENCODE_DEFAULT_PERMISSIONS = Object.freeze({
  edit: "allow",
  bash: "allow",
  read: "allow",
  glob: "allow",
  grep: "allow",
  task: "allow",
});

/**
 * Campos de frontmatter Jarvis-only que devem ser removidos para OpenCode commands
 * @constant {ReadonlyArray<string>}
 */
export const OPENCODE_STRIP_FIELDS = Object.freeze([
  "auto_execution_mode",
  "rules_file",
  "template_file",
  "model_tier",
  "model_justification",
  "recommended_model",
  "env_file",
  "globs",
]);

/**
 * Campos de frontmatter Jarvis-only que devem ser removidos para steering files Kiro
 * @constant {ReadonlyArray<string>}
 */
export const KIRO_STRIP_FIELDS = Object.freeze([
  "trigger",
  "auto_execution_mode",
  "rules_file",
  "template_file",
  "model_tier",
  "model_justification",
  "recommended_model",
  "env_file",
  "globs",
  "agent",
  "allowed-tools",
  "disable-model-invocation",
  "compatibility",
  "license",
  "metadata",
  "argument-hint",
]);

/**
 * Mapeamento de HUB Jarvis para fileMatchPattern do Kiro
 * Usado para gerar steering files de rules com inclusion: fileMatch
 * @constant {Readonly<Record<string, string>>}
 */
export const KIRO_HUB_FILE_PATTERNS = Object.freeze({
  FRONTEND: "**/*.tsx,**/*.ts,**/*.jsx,**/*.js,**/*.css,**/*.scss",
  BACKEND: "**/*.ts,**/*.js",
  QA: "**/*.test.ts,**/*.spec.ts,**/*.cy.ts,**/*.test.js,**/*.spec.js",
  DATA: "**/*.py,**/*.sql,**/*.ipynb",
  AI: "**/*.ts,**/*.py",
});
