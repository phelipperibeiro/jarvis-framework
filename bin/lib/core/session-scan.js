// Varredura das sessões de engenharia para o /eng.daily-report: junta as seções `## AAAA-MM-DD`
// dos `daily.md` por dia e aponta as sessões que deveriam ter `daily.md` e não têm.
// Só lê: não escreve nas sessões nem cria o relatório (quem escreve é o workflow).
// As datas são sempre do calendário LOCAL (o `.timestamp_start` é gravado em UTC).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const ALLOWED_DAYS = [1, 3, 7, 15, 30, 60];
export const DEFAULT_DAYS = 7;

// Dia em que o `daily.md` passou a existir (gerado pelo eng.pr). Sessões sem `daily.md` que
// começaram antes disso só geram alerta se chegaram ao eng.pr (têm `pull-request.md`).
export const DAILY_SINCE = "2026-10-15";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Valida a janela. Sem valor: o padrão (7). */
export function parseDays(value) {
  if (value === undefined || value === null || value === "" || value === true)
    return { days: DEFAULT_DAYS };
  const n = Number(String(value).trim());
  if (!ALLOWED_DAYS.includes(n)) {
    return {
      error: `Janela inválida: ${value}. Valores aceitos: ${ALLOWED_DAYS.join(", ")}`,
    };
  }
  return { days: n };
}

/** `AAAA-MM-DD` no fuso local (sem `toISOString`, que é UTC). */
export function localDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hoje e os `days - 1` dias anteriores, do mais recente para o mais antigo. */
export function buildWindow(days, now = new Date()) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    dates.push(localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return { from: dates[dates.length - 1], to: dates[0], dates };
}

export function reportFileName(today, days) {
  return `daily-report-${today}-${days}d.md`;
}

export function redactEmails(text) {
  return typeof text === "string" ? text.replace(EMAIL_RE, "[e-mail removido]") : text;
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function unquote(value) {
  const v = value.trim();
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

/** Frontmatter `chave: valor` simples (ignora comentários). */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (!m) return { data, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = unquote(kv[2]);
  }
  return { data, body: text.slice(m[0].length) };
}

/** Primeira linha não vazia depois de `### Timesheet`, sem crases nem cercas de código. */
function extractTimesheet(section) {
  const m = section.match(/^###\s+Timesheet\s*$([\s\S]*?)(?=^###?\s|(?![\s\S]))/m);
  if (!m) return null;
  const line = m[1]
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !/^```/.test(l));
  return line ? line.replace(/^`+|`+$/g, "").trim() : null;
}

function extractDescription(section) {
  const m = section.match(/^###\s+Descrição detalhada\s*$([\s\S]*?)(?=^###\s|(?![\s\S]))/m);
  return m ? m[1].trim() : "";
}

/**
 * Lê um `daily.md`: frontmatter (`task_key`, `card_url`, `pr`, `branch`) e uma entrada por
 * seção `## AAAA-MM-DD`, com a descrição detalhada e a linha de timesheet.
 */
export function parseDaily(text) {
  const { data, body } = parseFrontmatter(text);
  const sections = [];
  const parts = body.split(/^##\s+(\d{4}-\d{2}-\d{2})\s*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({
      date: parts[i],
      description: redactEmails(extractDescription(parts[i + 1])),
      timesheet: redactEmails(extractTimesheet(parts[i + 1])),
    });
  }
  return {
    taskKey: data.task_key || null,
    cardUrl: data.card_url || null,
    pr: data.pr || null,
    branch: data.branch || null,
    sections,
  };
}

function firstHeading(text) {
  const m = text && text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

/** Linha `Issue:` do cabeçalho do architecture.md (com ou sem negrito e `>`). */
function issueLine(text) {
  const m = text && text.match(/^[>\s]*\**Issue:\**\s*(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function prNumberFrom(text) {
  if (!text) return null;
  const m = text.match(/\/(?:pull|merge_requests)\/(\d+)/) || text.match(/\b(?:PR|MR)\s*#(\d+)/);
  return m ? `#${m[1]}` : null;
}

/**
 * Data e atividade de uma sessão sem `daily.md`, só com fontes locais (o vendor fica com o
 * workflow). Ordem da data: `Criado em:` > `.timestamp_start` (UTC → local) > modificação da pasta.
 */
export function sessionInfo(dir) {
  const arch = readText(join(dir, "architecture.md"));
  const plan = readText(join(dir, "plan.md"));
  const pr = readText(join(dir, "pull-request.md"));

  let date = null;
  let dateSource = null;
  const created = arch && arch.match(/Criado em:\**\s*(\d{4}-\d{2}-\d{2})/);
  if (created) {
    date = created[1];
    dateSource = "architecture";
  }
  if (!date) {
    const ts = (readText(join(dir, ".timestamp_start")) || "").trim();
    const parsed = ts ? new Date(ts) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
      date = localDate(parsed);
      dateSource = "timestamp_start";
    }
  }
  if (!date) {
    date = localDate(statSync(dir).mtime);
    dateSource = "mtime";
  }

  const issue = issueLine(arch);
  const issueKey = issue ? (issue.match(/#\d+|\b[A-Z][A-Z0-9]+-\d+\b/) || [null])[0] : null;
  const issueTitle = issue ? (issue.match(/\s[—–-]\s+(.+)$/) || [null, null])[1] : null;
  const archTitle = firstHeading(arch);
  const usefulArchTitle =
    archTitle && !/^architecture(\.md)?\s*[:—-]?\s*[#\w-]*$/i.test(archTitle) ? archTitle : null;

  const activity = issueTitle || firstHeading(plan) || firstHeading(pr) || usefulArchTitle || null;

  return {
    date,
    dateSource,
    activity: redactEmails(activity),
    issueKey,
    prNumber: prNumberFrom(pr),
    hasPullRequest: pr !== null,
  };
}

/** Sessão sem `daily.md` gera alerta se chegou ao eng.pr ou começou depois do `daily.md` existir. */
export function needsAlert({ hasDaily, hasPullRequest, date }) {
  if (hasDaily) return false;
  return hasPullRequest || date >= DAILY_SINCE;
}

const byKey = (a, b) => a.key.localeCompare(b.key, "pt-BR", { numeric: true });

/**
 * Varre `sessionsDir` (o `$SESSIONS_DIR/eng`) e devolve o que entra na janela.
 * @param {string} sessionsDir
 * @param {{ days?: number, now?: Date }} [options]
 */
export function scanSessions(sessionsDir, { days = DEFAULT_DAYS, now = new Date() } = {}) {
  const window = buildWindow(days, now);
  const inWindow = new Set(window.dates);
  const warnings = [];
  const perDate = new Map();
  const alerts = [];
  const touched = new Set();

  let keys = [];
  if (existsSync(sessionsDir)) {
    keys = readdirSync(sessionsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } else {
    warnings.push(`pasta de sessões não encontrada: ${sessionsDir}`);
  }

  for (const key of keys) {
    const dir = join(sessionsDir, key);
    const dailyText = readText(join(dir, "daily.md"));

    if (dailyText !== null) {
      const daily = parseDaily(dailyText);
      for (const s of daily.sections) {
        if (!DATE_RE.test(s.date) || !inWindow.has(s.date)) continue;
        if (!perDate.has(s.date)) perDate.set(s.date, []);
        perDate.get(s.date).push({
          key,
          taskKey: daily.taskKey,
          cardUrl: daily.cardUrl,
          pr: daily.pr,
          branch: daily.branch,
          description: s.description,
          timesheet: s.timesheet,
        });
        touched.add(key);
      }
      continue;
    }

    const info = sessionInfo(dir);
    if (!inWindow.has(info.date)) continue;
    if (!needsAlert({ hasDaily: false, hasPullRequest: info.hasPullRequest, date: info.date }))
      continue;
    if (info.dateSource === "mtime")
      warnings.push(`sessão ${key}: data tirada da modificação da pasta (sem outra fonte)`);
    alerts.push({ key, ...info });
    touched.add(key);
  }

  const byDate = [...perDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, tasks]) => ({ date, tasks: tasks.sort(byKey) }));
  alerts.sort((a, b) => (a.date === b.date ? byKey(a, b) : a.date < b.date ? 1 : -1));

  return {
    days,
    today: window.to,
    window: { from: window.from, to: window.to },
    fileName: reportFileName(window.to, days),
    sessionsScanned: keys.length,
    sessionsInWindow: touched.size,
    byDate,
    alerts,
    warnings,
  };
}
