# Regras de Segurança por Etapa

Seções de `rules/engineering/eng-security-rules.md` que só valem dentro de um comando; o resto daquela rule continua carregado em toda sessão.

---

## Fase: eng.start (Arquitetura)

Ao definir a arquitetura de uma feature, o agente DEVE incluir no `architecture.md`:

1. **Dados sensiveis** — listar PII, dados financeiros e credenciais envolvidas na feature
2. **Superficie de ataque** — mapear endpoints publicos vs. autenticados
3. **Modelo de auth** — definir como autenticacao e autorizacao se aplicam (JWT, session, OAuth, RBAC)
4. **Integracoes externas** — listar e validar que usam TLS; documentar retry e fallback
5. **Estrategia de sanitizacao** — se a feature recebe inputs de usuario, documentar como serao validados

> Se a feature nao envolve nenhum destes pontos, registrar explicitamente: "Sem superficie de seguranca identificada".

---

## Fase: eng.pre-pr (Validacao)

O agente DEVE incluir no checklist de pre-PR as seguintes verificacoes de seguranca:

- [ ] **Secrets scan**: nenhum token, senha ou API key no diff
- [ ] **Dependencias**: `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] **Lockfile**: commitado e atualizado
- [ ] **Inputs**: todo endpoint novo ou alterado valida inputs com schema
- [ ] **Auth guard**: todo endpoint novo tem guard (ou `@Public()` explicito com justificativa)
- [ ] **Outputs**: erros nao vazam detalhes internos

Se o PR toca em areas sensiveis (auth, sessions, RBAC, CORS, CSP, permissoes), o agente DEVE:
1. Registrar no PR Brief do `gate-checklist.md` que o PR leva o label `security` e orientar a pessoa a adiciona-lo ao PR (o Jarvis nao altera o PR no vendor sem perguntar, regra de ouro; o `jarvis vcs create-merge` nao poe label)
2. Seguir o gate de seguranca inline do `eng.pre-pr` (sanitizacao, auth guards, headers, secrets scan, `npm audit`) antes do merge
