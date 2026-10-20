# Caso varrer

O `/eng.debug` recebeu um **escopo sem sintoma**: pasta, módulo, `--all` ou um pedido como "quais os riscos de…". Aqui o objetivo é achar **suspeitos** (bugs latentes, falhas de segurança, problemas de performance, débito técnico) e priorizá-los, sem mexer em nada. Siga a política de acesso do [`SKILL.md`](../SKILL.md). Usos típicos: entrar num projeto legado, revisão depois de um incidente, check-up periódico, preparação para um refactor grande ou análise de risco antes de uma mudança crítica.

## 1. Escopo

- Confirme o escopo: pasta, módulo, `--all` (todos os repositórios do workspace; em `WORKSPACE_MODE=workspace`, só as subpastas com `.git/`, sem a pasta da IDE, `.jarvis/`, `.vscode/` e `node_modules/`).
- Se não estiver claro, pergunte (uma pergunta por vez): o propósito do módulo, as áreas críticas (autenticação, pagamentos, dados sensíveis), áreas com problemas conhecidos e a prioridade (bugs funcionais, performance, segurança).
- Identifique a stack pelos manifestos (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`…) e pelo `CDD-MIND-MAP.md`, e aplique a regra de especializações da área.

## 2. Sequência ou paralelo

Conte os arquivos de código do escopo (sem dependências instaladas nem arquivos gerados). Com `--all` **ou mais de 200 arquivos**, pergunte com `AskUserQuestion`: **"Varrer em sequência ou em paralelo?"** — **Em sequência (padrão)** / **Em paralelo** (mais rápido; um subagente por categoria, no máximo 4; custo maior em tokens). Abaixo disso, varra em sequência sem perguntar. Em paralelo, cada subagente recebe o escopo, uma categoria e esta política de acesso, e só lê.

## 3. Verificações locais

Teste e lint locais rodam livres (política de acesso): use os comandos que o **projeto já define** (scripts do manifesto, `Makefile`), sem instalar nada. Sem comando definido, registre "não configurado" no relatório. Nada que altere estado, e nada em produção.

## 4. O que procurar

Busque por padrão de risco, na linguagem do projeto, e confirme cada achado lendo o trecho (achado não lido não entra):

| Categoria | Sinais |
|-----------|--------|
| Bugs funcionais | tratamento de erro vazio ou genérico; comparação frouxa onde a linguagem distingue; variável usada antes de ter valor; log de depuração esquecido em código de produção |
| Code smells | funções ou arquivos muito grandes; duplicação; acoplamento alto; complexidade alta |
| Segurança | consulta ou comando montado concatenando entrada; HTML montado com entrada sem sanitizar; segredo no código; endpoint sem autenticação |
| Performance | consultas dentro de laços (N+1); listas sem paginação; laços aninhados sobre dados grandes; recursos abertos sem fechar ou ouvintes sem remover |
| Débito técnico | TODO, FIXME e HACK; código comentado; dependências desatualizadas ou com vulnerabilidade conhecida (pela ferramenta do projeto) |
| Arquitetura | separação de responsabilidades, estrutura de pastas, modularidade, consistência de padrões |

## 5. Classificar e priorizar

| Categoria | Descrição |
|-----------|-----------|
| `BUG-CRÍTICO` | Afeta produção, segurança ou causa perda de dados |
| `BUG-ALTO` | Quebra funcionalidade importante |
| `BUG-MÉDIO` | Comportamento inesperado não crítico |
| `BUG-BAIXO` | Caso de borda, problema visual menor |
| `CODE-SMELL` | Código difícil de manter |
| `DÉBITO-TÉCNICO` | Código desatualizado, falta de testes |
| `SEGURANÇA` | Vulnerabilidade potencial |
| `PERFORMANCE` | Lentidão ou uso excessivo de recursos |

**Severidade** = impacto × probabilidade × esforço de correção (cada um de 1 a 5).

| Prioridade | Critério |
|------------|----------|
| P0 | Severidade ≥ 60, `BUG-CRÍTICO` ou `SEGURANÇA` |
| P1 | Severidade ≥ 40, `BUG-ALTO` |
| P2 | Severidade ≥ 20, `BUG-MÉDIO` ou `CODE-SMELL` |
| P3 | Severidade < 20, `BUG-BAIXO` ou `DÉBITO-TÉCNICO` |

Não relate falso positivo sem validar, nem severidade sem análise. Com mais de 100 suspeitos, detalhe P0 e P1 e liste o resto num anexo, sugerindo varrer por áreas.

## 6. Relatório

Grave o relatório no template `templates/engineering/bug-audit-report-template.md`:

- com chave: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/bug-audit-report.md`;
- sem chave: calcule **uma vez** o nome `bug-audit-{AAAAMMDD-HHMMSS}`, guarde-o e use-o em todos os arquivos e na mensagem final: `$SESSIONS_DIR/eng/{nome}/bug-audit-report.md`.

Cada suspeito P0 e P1 (e os demais, se o usuário pedir) traz o **card pronto**, estruturado com a base `eng-qa` (tema 14, Gestão de Testes e de Defeitos): título, tipo, prioridade, labels, comportamento atual × esperado, localização, impacto e sugestão de correção. O comando **não abre** os cards.

## 7. Depois do relatório

Ofereça com `AskUserQuestion` investigar um suspeito (os P0 primeiro): o escolhido segue no [caso investigar](caso-investigar.md), no mesmo comando, e ganha o próprio `debug-report.md`. Sugira abrir os cards P0 e P1 no board e priorizar os P2 e P3 no backlog.
