---
description: Validação de segurança para realizar um pull request ou merge request
auto_execution_mode: 3
env_file: "@/ENV.md"
rules_file: "$IDE/rules/engineering/eng.pre-pr-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Revisão multi-agente requer coordenação, análise de código, validação de testes e verificação de conformidade
---

# pre-pr

Estamos nos aproximando de finalizar o trabalho nesta branch e nos preparar para um solicitação de integração. Agora, é hora de fazer verificações finais e limpezas para assegurar que estamos alinhados com nossos convenções e objetivos.

## Skills recomendados

- **eng-qa-test-plan**: para avaliar cobertura de testes e identificar gaps antes do PR.
  - Arquivo: `$IDE/skills/eng-qa-test-plan/SKILL.md`
- **eng-qa-testsprite**: para executar testes automatizados e validar cobertura com TestSprite MCP.
  - Arquivo: `$IDE/skills/eng-qa-testsprite/SKILL.md`
- **eng-docs-write**: para atualizar documentação baseada nas mudanças da branch.
  - Arquivo: `$IDE/skills/eng-docs-write/SKILL.md`
- **docs-index**: para atualizar o índice de documentação quando necessário.
  - Arquivo: `$IDE/skills/docs-index/SKILL.md`
- **eng-performance-engineer**: para validar thresholds de performance e analisar regressões quando a feature tiver requisitos não-funcionais de latência, throughput ou escalabilidade.
  - Arquivo: `$IDE/skills/eng-performance-engineer/SKILL.md`
- **eng-frontend**: para validar implementação de componentes React, performance de UI e acessibilidade (WCAG 2.1 AA).
  - Arquivo: `$IDE/skills/eng-frontend/SKILL.md`
- **eng-design-system**: para auditar conformidade do código com tokens e componentes do design system.
  - Arquivo: `$IDE/skills/eng-design-system/SKILL.md`
- **eng-microfrontend**: quando a branch envolver shell app ou remotes em Module Federation.
  - Arquivo: `$IDE/skills/eng-microfrontend/SKILL.md`
- **eng-cybersecurity**: quando a branch tocar em auth, sessions, inputs, CORS, CSP, permissões ou adicionar dependências novas.
  - Arquivo: `$IDE/skills/eng-cybersecurity/SKILL.md`

<arguments>
#$ARGUMENTS
</arguments>

## Fase 0.5: Comentário no card — Início

Pular se `TASK_MANAGER` estiver vazio (freelance).

Ao iniciar o pre-PR, registrar:

```
/eng-task-comment {TASK_MANAGER_KEY} 🔍 [Jarvis] Iniciando validação pre-PR - bateria de testes e revisão de código
```

> Usa o skill `/eng-task-comment`. Não bloquear se falhar.

---

## Regras de Execução

- **Escopo**: avalie apenas as mudanças desta branch em relação ao branch base (ex.: `main`/`master`).
- **Evidências**: sempre que mencionar “testes/validações passando”, inclua quais comandos foram usados e o resultado (ou descreva smoke tests manuais quando não houver suíte).
- **Revalidação**: se qualquer gate levar a mudanças no código, reexecute no mínimo:
  - Gate 2 (revisão técnica)
  - Gate 3 (testes/validações)

## Gates

### Gate 0: Verificar Documentação Central (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md:

**Passo 1:** Detectar mudanças arquiteturais no diff da branch
```bash
git diff main...HEAD | grep -E "(class|interface|schema|migration|config)" || true
```

**Passo 2:** Se mudanças arquiteturais detectadas:
- Verificar se ARD local existe em `./docs/engineering/`
- Comparar com ARD do central-docs (se existir)
- Se desatualizado ou novo:
  - Perguntar: "Publicar ARD atualizado no central-docs?"
  - Se sim: executar `jarvis docs publish --file <path> --tipo ard --feature <slug>`

**Passo 3:** Se novos contratos/APIs criados:
- Verificar se há RFC relacionado
- Se não: sugerir criar RFC para decisões arquiteturais

**Comportamento:**
- Se `CENTRAL_DOCS_REPO` vazio → pular silenciosamente
- Não bloquear PR por docs desatualizados (apenas avisar)

---

1. Invoque o agente [prod.pm-checker]($IDE/agents/product/prod.pm-checker.md) para verificar se a branch está alinhada com os docs do projeto, documentação de produto e de engenharia.
2. Invoque o agente [eng.dev-code-reviewer]($IDE/agents/engineering/eng.dev-code-reviewer.md) para revisar o código e assegurar que está bom para lançar.
3. Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para identificar gaps de cobertura de testes na branch.
4. **Se o test-planner identificar gaps críticos**, invoque o agente [eng.qa.testing-engineer]($IDE/agents/engineering/qa/eng.qa.testing-engineer.md) para escrever os testes faltantes antes de prosseguir.
   - Gaps críticos: funções públicas sem teste, lógica de negócio descoberta, tratamento de erros não validado
   - Gaps aceitáveis (com justificativa): código de infraestrutura, integrações já cobertas por e2e
5. **Se a feature tiver requisitos não-funcionais** (definidos no `architecture.md` ou explícitos na task), invoque o agente [eng.qa.test-architect]($IDE/agents/engineering/qa/eng.qa.test-architect.md) para validar:
   - Testes de performance executados e dentro dos thresholds
   - Testes de segurança passando (RBAC, injection, etc.)
   - Quality gates configurados corretamente
6. Execute o skill [eng-qa-testsprite]($IDE/skills/eng-qa-testsprite/SKILL.md) com `testScope=diff` para validar testes automatizados nas mudanças da branch.
   - Se o projeto tiver frontend: execute com `type=frontend`
   - Se o projeto tiver backend: execute com `type=backend`
   - Se tiver ambos: execute os dois tipos sequencialmente
7. **Se a branch tiver mudanças de interface** (componentes React, design system, micro frontend), invoque o agente [eng.frontend.agent]($IDE/agents/engineering/eng.frontend.agent.md) para validar:
   - TypeScript sem `any`, tokens do design system usados, acessibilidade WCAG 2.1 AA
   - Se micro frontend: contrato de interface atualizado, remote funciona standalone
8. **Se a branch introduzir nova feature de UI ou alterar fluxo de usuário**, invoque o agente [eng.ux-designer.agent]($IDE/agents/engineering/eng.ux-designer.agent.md) para verificar:
   - Empty states, loading states e mensagens de erro em linguagem humana
   - Consistência com padrões visuais existentes no produto
9. Invoque o agente [eng.docs-writer]($IDE/agents/engineering/eng.docs-writer.md) para atualizar a documentação do projeto.
10. **Se a branch tocar em auth, sessions, inputs de usuário, CORS, CSP, permissões ou adicionar endpoints públicos**, executar o workflow [eng.security-review]($IDE/workflows/engineering/eng.security-review.md) como gate de segurança:
   - Revisar sanitização de inputs e queries parametrizadas
   - Verificar auth guards em endpoints novos
   - Validar headers de segurança e configurações de CORS
   - Escanear secrets no diff (`grep` por patterns de tokens/senhas)
   - Verificar `npm audit` sem vulnerabilidades HIGH/CRITICAL
   - Se achados CRITICAL: status **Red** (bloqueador)

Você também precisará lidar com todo o feedback que esses agentes fornecerem e fazer mudanças e correções conforme necessário.

## Checklist final (obrigatório)

- [ ] Não existem bloqueadores abertos (segurança/bugs críticos).
- [ ] Testes e validações relevantes foram executados e passaram (com evidências via eng-qa-testsprite ou manual).
- [ ] Cobertura de testes para mudanças da branch foi avaliada (e gaps críticos tratados ou justificados).
- [ ] Documentação foi revisada/atualizada (listar arquivos alterados) ou foi explicitado por que não foi necessário.
- [ ] Riscos conhecidos e trade-offs foram registrados (e follow-ups criados quando aplicável).

## Saída final (obrigatória)

### 1) Status Pre-PR (Semáforo)

- Green: pronto para PR
- Yellow: pode abrir PR com notas e follow-ups
- Red: não pode abrir PR (listar bloqueadores)

### 2) Bloqueadores e pendências

- Bloqueadores:
- Pendências aceitas (com justificativa):
- Follow-ups (links/IDs):

### 3) PR Brief (para colar no PR)

- Resumo do que mudou:
- Como testar:
- Evidências de testes/validações:
- Docs atualizadas:
- Riscos / trade-offs:

## Comentário no card — Conclusão

Pular se `TASK_MANAGER` estiver vazio (freelance).

Após apresentar o resultado final, registrar:

- Se **Green**: `✅ [Jarvis] Pre-PR concluído com status GREEN - pronto para abrir MR`
- Se **Yellow**: `⚠️ [Jarvis] Pre-PR concluído com status YELLOW - pode abrir MR com ressalvas`
- Se **Red**: `🚫 [Jarvis] Pre-PR concluído com status RED - bloqueadores encontrados, não abrir MR`

```
/eng-task-comment {TASK_MANAGER_KEY} {mensagem_status}
```

---

Uma vez terminado, me avise e peça minha permissão para abrir o Pull Request.