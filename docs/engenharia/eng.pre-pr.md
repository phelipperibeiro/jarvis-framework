# `/eng.pre-pr` — validar antes do PR

Workflow: `workflows/engineering/eng.pre-pr.md` · Regras: `rules/engineering/eng.pre-pr-rules.md`

## Em uma frase

Faz a checagem final da branch (código, testes, documentação e segurança) e termina com um **semáforo** dizendo se já dá para abrir o PR.

## O que é

É a revisão de qualidade que fica entre o [`eng.work`](./eng.work.md) e o [`eng.pr`](./eng.pr.md). Ela avalia **só as mudanças da sua branch** em relação à branch base e aciona agentes e skills especializados conforme o que a branch tocou.

## Quando usar

- Quando a implementação terminou e você quer chegar ao PR sem surpresa
- Depois de qualquer correção grande que mexeu na branch

## Quando **não** usar

- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → bloqueado
- Quer só criar o MR → [`eng.pr`](./eng.pr.md) (mas o `eng.pre-pr` deve vir antes)
- Quer só revisar código de outra pessoa → [`eng.review`](./eng.review.md)

## Como funciona

O comando percorre "gates". Alguns sempre rodam, outros só quando a branch pede:

| Gate | Quando |
|---|---|
| Documentação central (ARD, RFC) | Se `CENTRAL_DOCS_REPO` estiver configurado |
| Alinhamento com os docs do projeto (`prod.pm-checker`) | Sempre |
| Revisão de código (`eng.dev-code-reviewer`) | Sempre |
| Lacunas de cobertura de testes (`test-planner`), com testes escritos se as lacunas forem críticas | Sempre |
| Requisitos não funcionais: performance, segurança, quality gates (`test-architect`) | Se a feature tiver requisitos assim |
| Testes automatizados nas mudanças (TestSprite, frontend e/ou backend) | Sempre |
| Revisão de interface: TypeScript, tokens, acessibilidade (`eng.frontend.agent`) | Se houver mudança de UI |
| Usabilidade: estados vazios, carregando, mensagens de erro (`eng.ux-designer`) | Se houver nova feature de UI ou mudança de fluxo |
| Atualização de documentação (`eng.docs-writer`) | Sempre |
| Revisão de segurança ([`eng.security-review`](./eng.security-review.md)) | Se tocar auth, sessões, inputs, CORS, CSP, permissões ou endpoints públicos |

Se algum gate levar a mudança de código, o comando **repete** a revisão técnica e os testes.

## O resultado

Sempre termina com:

1. **Semáforo:** 🟢 pronto para PR, 🟡 pode abrir com ressalvas documentadas, 🔴 bloqueado (com a lista do que impede)
2. **Bloqueadores e pendências**, com follow-ups
3. **PR Brief** para colar no PR: o que mudou, como testar, evidências, docs atualizadas, riscos
4. Comentário no card com o status, quando há board
5. **Espera sua permissão explícita** antes de você seguir para o `eng.pr`

## Regras que importam

- Ao dizer "testes passando", o comando mostra **qual comando rodou e o resultado**
- Segurança: nenhum secret no diff, `npm audit` sem vulnerabilidade alta ou crítica e lockfile atualizado
- Se o PR tocar áreas sensíveis, recomenda o label `security` e a revisão de segurança antes do merge

## Próximo passo típico

[`eng.pr`](./eng.pr.md)
