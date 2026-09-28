import { cardUrl } from "../vcs/api.js";

function env(name) {
  return String(process.env[name] || "").trim();
}

function taskManager() {
  return env("TASK_MANAGER").toLowerCase() || "jira";
}

async function commentJira(cardKey, message) {
  const base = env("TASK_MANAGER_URL_BASE").replace(/\/$/, "");
  const token = env("TOKEN_TASK_MANAGER");
  const email = env("USER");
  if (!base || !token) {
    throw new Error(
      "Jira: preencha TASK_MANAGER_URL_BASE e TOKEN_TASK_MANAGER no ENV.md",
    );
  }
  const auth = email
    ? `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`
    : `Bearer ${token}`;
  const res = await fetch(`${base}/rest/api/3/issue/${cardKey}/comment`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      body: {
        version: 1,
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: message }],
          },
        ],
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Jira ${res.status}: ${await res.text()}`);
  }
}

async function commentLinear(cardKey, message) {
  const token = env("TOKEN_TASK_MANAGER");
  if (!token) throw new Error("Linear: preencha TOKEN_TASK_MANAGER no ENV.md");
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation($id: String!, $body: String!) {
        commentCreate(input: { issueId: $id, body: $body }) { success }
      }`,
      variables: { id: cardKey, body: message },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Linear: ${JSON.stringify(json.errors || json)}`);
  }
}

async function commentGithub(cardKey, message) {
  const token =
    env("TOKEN_TASK_MANAGER") || env("GITHUB_TOKEN") || env("GH_TOKEN");
  const base = env("TASK_MANAGER_URL_BASE").replace(/\/$/, "");
  if (!token || !base) {
    throw new Error(
      "GitHub Issues: TASK_MANAGER_URL_BASE (https://github.com/org/repo) e TOKEN_TASK_MANAGER/GITHUB_TOKEN",
    );
  }
  const path = new URL(base).pathname.replace(/^\/+|\/+$/g, "");
  const number = String(cardKey).replace(/^#/, "");
  const res = await fetch(
    `https://api.github.com/repos/${path}/issues/${number}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: message }),
    },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
}

async function commentAsana(cardKey, message) {
  const token = env("TOKEN_TASK_MANAGER");
  if (!token) throw new Error("Asana: preencha TOKEN_TASK_MANAGER no ENV.md");
  const res = await fetch(`https://app.asana.com/api/1.0/tasks/${cardKey}/stories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { text: message } }),
  });
  if (!res.ok) throw new Error(`Asana ${res.status}: ${await res.text()}`);
}

const cardKey = process.argv[2];
const message = process.argv.slice(3).join(" ");

if (!cardKey || !message) {
  console.error("Uso: comment.js <TASK_MANAGER_KEY> <mensagem>");
  process.exit(1);
}

const tm = taskManager();
try {
  if (tm === "linear") await commentLinear(cardKey, message);
  else if (tm === "github") await commentGithub(cardKey, message);
  else if (tm === "asana") await commentAsana(cardKey, message);
  else await commentJira(cardKey, message);

  const url = cardUrl(tm, env("TASK_MANAGER_URL_BASE"), cardKey);
  console.log(`💬 Comentário adicionado em ${cardKey} (${tm})`);
  if (url !== cardKey) console.log(`   ${url}`);
} catch (err) {
  console.error(`⚠️ Não foi possível comentar no card ${cardKey}: ${err.message}`);
  process.exit(2);
}
