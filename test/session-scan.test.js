// Testes da varredura de sessões do /eng.daily-report (session-scan.js). Rode com: npm run test:filtro
// Fuso fixo: os casos de virada de dia (UTC → local) não podem depender da máquina.
process.env.TZ = "America/Sao_Paulo";

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ALLOWED_DAYS,
  DAILY_SINCE,
  parseDays,
  buildWindow,
  localDate,
  reportFileName,
  redactEmails,
  parseDaily,
  sessionInfo,
  needsAlert,
  scanSessions,
} from "../bin/lib/core/session-scan.js";

const NOW = new Date(2026, 9, 17, 10, 0, 0); // 2026-10-17, 10h local

const DAILY = `---
# comentário que não é chave
task_key: "#163"
card_url: https://github.com/org/repo/issues/163
pr: "#164 https://github.com/org/repo/pull/164"
branch: fix/ciclo
---

# Daily — #163

> Registro pessoal.

## 2026-10-17

### Descrição detalhada

Revisei as perguntas do ciclo. Contato: alguem@example.com.

**Referências:** card #163

### Timesheet

\`#163 — Revisão das perguntas do ciclo (PR #164)\`

## 2026-10-12

### Descrição detalhada

Início da investigação.

### Timesheet

\`\`\`
#163 — Investigação inicial
\`\`\`
`;

function withSessions(sessions, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-session-scan-"));
  try {
    for (const [key, files] of Object.entries(sessions)) {
      mkdirSync(join(root, key), { recursive: true });
      for (const [name, content] of Object.entries(files)) {
        writeFileSync(join(root, key, name), content);
      }
    }
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const arch = (date, issue) =>
  `# Architecture: x\n\n> **Criado em:** ${date}  \n> **Issue:** ${issue}  \n`;

test("parseDays: padrão 7, valores aceitos e recusa do resto", () => {
  assert.deepEqual(parseDays(undefined), { days: 7 });
  for (const n of ALLOWED_DAYS) assert.deepEqual(parseDays(String(n)), { days: n });
  const r = parseDays("10");
  assert.match(r.error, /Janela inválida: 10/);
  assert.match(r.error, /1, 3, 7, 15, 30, 60/);
  assert.ok(parseDays("abc").error);
  assert.ok(parseDays("0").error);
});

test("buildWindow: calendário local incluindo hoje, em ordem decrescente", () => {
  assert.deepEqual(buildWindow(1, NOW), {
    from: "2026-10-17",
    to: "2026-10-17",
    dates: ["2026-10-17"],
  });
  const w7 = buildWindow(7, NOW);
  assert.equal(w7.dates.length, 7);
  assert.equal(w7.from, "2026-10-11");
  assert.equal(w7.dates[0], "2026-10-17");
});

test("buildWindow: atravessa a virada de mês", () => {
  const w = buildWindow(3, new Date(2026, 10, 1, 9, 0, 0));
  assert.deepEqual(w.dates, ["2026-11-01", "2026-10-31", "2026-10-30"]);
});

test("localDate usa o fuso local, não UTC", () => {
  // 01:00 UTC de 17/10 = 22:00 de 16/10 em Brasília
  assert.equal(localDate(new Date("2026-10-17T01:00:00Z")), "2026-10-16");
});

test("reportFileName: data e janela no nome", () => {
  assert.equal(reportFileName("2026-10-17", 7), "daily-report-2026-10-17-7d.md");
});

test("redactEmails troca e-mails e preserva o resto", () => {
  assert.equal(redactEmails("fale com a.b@x.com.br hoje"), "fale com [e-mail removido] hoje");
  assert.equal(redactEmails(null), null);
});

test("parseDaily: frontmatter, seções por data, timesheet em crase ou bloco de código", () => {
  const d = parseDaily(DAILY);
  assert.equal(d.taskKey, "#163");
  assert.equal(d.cardUrl, "https://github.com/org/repo/issues/163");
  assert.equal(d.pr, "#164 https://github.com/org/repo/pull/164");
  assert.equal(d.branch, "fix/ciclo");
  assert.deepEqual(
    d.sections.map((s) => s.date),
    ["2026-10-17", "2026-10-12"]
  );
  assert.equal(d.sections[0].timesheet, "#163 — Revisão das perguntas do ciclo (PR #164)");
  assert.equal(d.sections[1].timesheet, "#163 — Investigação inicial");
  assert.match(d.sections[0].description, /Revisei as perguntas/);
  assert.match(d.sections[0].description, /\[e-mail removido\]/);
  assert.doesNotMatch(d.sections[0].description, /example\.com/);
  assert.doesNotMatch(d.sections[0].description, /Timesheet/);
});

test("sessionInfo: Criado em e título da linha Issue", () => {
  withSessions(
    {
      154: {
        "architecture.md": arch("2026-10-16", "#154 — prod.spec.discovery: entrevista fluida"),
        ".timestamp_start": "2026-10-16T05:12:26Z\n",
      },
    },
    (root) => {
      const info = sessionInfo(join(root, "154"));
      assert.equal(info.date, "2026-10-16");
      assert.equal(info.dateSource, "architecture");
      assert.equal(info.activity, "prod.spec.discovery: entrevista fluida");
      assert.equal(info.issueKey, "#154");
      assert.equal(info.hasPullRequest, false);
    }
  );
});

test("sessionInfo: só .timestamp_start, convertido de UTC para o dia local", () => {
  withSessions(
    { 200: { ".timestamp_start": "2026-10-15T01:00:00Z\n", "plan.md": "# Plano do relatório\n" } },
    (root) => {
      const info = sessionInfo(join(root, "200"));
      assert.equal(info.date, "2026-10-14");
      assert.equal(info.dateSource, "timestamp_start");
      assert.equal(info.activity, "Plano do relatório");
    }
  );
});

test("sessionInfo: sem fonte de data usa a modificação da pasta; título genérico do architecture é ignorado", () => {
  withSessions({ 300: { "architecture.md": "# Architecture: 300\n\ntexto\n" } }, (root) => {
    const info = sessionInfo(join(root, "300"));
    assert.equal(info.dateSource, "mtime");
    assert.equal(info.activity, null);
  });
});

test("sessionInfo: número do PR tirado do pull-request.md", () => {
  withSessions(
    {
      400: {
        "architecture.md": arch("2026-10-10", "#400"),
        "pull-request.md": "# feat(cli): algo\n\nhttps://github.com/org/repo/pull/401\n",
      },
    },
    (root) => {
      const info = sessionInfo(join(root, "400"));
      assert.equal(info.prNumber, "#401");
      assert.equal(info.hasPullRequest, true);
      assert.equal(info.activity, "feat(cli): algo");
    }
  );
});

test("needsAlert: regra da Decisão 2", () => {
  assert.equal(needsAlert({ hasDaily: true, hasPullRequest: true, date: "2026-10-16" }), false);
  assert.equal(needsAlert({ hasDaily: false, hasPullRequest: false, date: DAILY_SINCE }), true);
  assert.equal(needsAlert({ hasDaily: false, hasPullRequest: false, date: "2026-10-14" }), false);
  assert.equal(needsAlert({ hasDaily: false, hasPullRequest: true, date: "2026-10-06" }), true);
});

test("scanSessions: dias em ordem decrescente, alertas filtrados e janela respeitada", () => {
  withSessions(
    {
      163: { "daily.md": DAILY, "pull-request.md": "# fix\n" },
      154: { "architecture.md": arch("2026-10-16", "#154 — discovery") },
      111: { "architecture.md": arch("2026-10-06", "#111 (filha da #83)") }, // antiga, sem PR: sem alerta
      120: {
        "architecture.md": arch("2026-10-12", "#120 — antiga com PR"),
        "pull-request.md": "# feat: x\n",
      },
      500: { "architecture.md": arch("2026-09-01", "#500 — fora da janela") },
    },
    (root) => {
      const r = scanSessions(root, { days: 7, now: NOW });
      assert.equal(r.fileName, "daily-report-2026-10-17-7d.md");
      assert.deepEqual(r.window, { from: "2026-10-11", to: "2026-10-17" });
      assert.equal(r.sessionsScanned, 5);
      assert.deepEqual(
        r.byDate.map((d) => d.date),
        ["2026-10-17", "2026-10-12"]
      );
      assert.equal(r.byDate[0].tasks[0].key, "163");
      assert.deepEqual(
        r.alerts.map((a) => a.key),
        ["154", "120"]
      );
      assert.equal(r.sessionsInWindow, 3);
    }
  );
});

test("scanSessions: N=1 só traz hoje", () => {
  withSessions({ 163: { "daily.md": DAILY } }, (root) => {
    const r = scanSessions(root, { days: 1, now: NOW });
    assert.deepEqual(
      r.byDate.map((d) => d.date),
      ["2026-10-17"]
    );
  });
});

test("scanSessions: pasta inexistente vira aviso, sem erro", () => {
  const r = scanSessions(join(tmpdir(), "jarvis-nao-existe-xyz"), { days: 3, now: NOW });
  assert.equal(r.sessionsScanned, 0);
  assert.equal(r.warnings.length, 1);
});
