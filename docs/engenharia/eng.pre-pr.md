# `/eng.pre-pr` — rever lacunas antes do PR

Workflow: `workflows/engineering/eng.pre-pr.md` · Regras: `rules-on-demand/engineering/eng.pre-pr-rules.md`

## Em uma frase

Revê a branch atrás de lacunas (produto, código, testes, segurança, documentação) e gera o **`gate-checklist.md`** na sessão, com um semáforo, para você decidir o que ajustar antes do PR.

## O que é

É a revisão de qualidade que fica entre o [`eng.work`](./eng.work.md) e o [`eng.pr`](./eng.pr.md). Ela avalia **só as mudanças da sua branch** em relação à branch base e aciona agentes e skills especializados conforme o que a branch tocou. **Ela só aponta:** não corrige código, não escreve testes, não atualiza documentação e não publica nada.

## Quando usar

- Quando a implementação terminou e você quer chegar ao PR sem surpresa
- Depois de qualquer correção grande que mexeu na branch

## Quando **não** usar

- Você está em `main`, `master`, `develop`, `staging` ou `homolog` → bloqueado
- Quer só criar o MR → [`eng.pr`](./eng.pr.md) (mas o `eng.pre-pr` deve vir antes)
- Quer só revisar código de outra pessoa → [`eng.review`](./eng.review.md)

## Como funciona

O comando percorre "gates" de revisão. Alguns sempre rodam, outros só quando a branch pede:

| Gate | Quando |
|---|---|
| Alinhamento com os docs do projeto (`prod.pm-checker`) | Sempre |
| Revisão de código (`eng.dev-code-reviewer`) | Sempre |
| Lacunas de cobertura de testes (`test-planner`) | Sempre |
| Requisitos não funcionais: performance, segurança, quality gates (`test-architect`) | Se a feature tiver requisitos assim |
| Testes automatizados nas mudanças (`eng-qa` + especialização registrada) | Sempre |
| Revisão de interface: TypeScript, tokens, acessibilidade (`eng.frontend.agent`) | Se houver mudança de UI |
| Usabilidade: estados vazios, carregando, mensagens de erro (`eng.ux-designer`) | Se houver nova feature de UI ou mudança de fluxo |
| Documentação desatualizada (`eng.docs-writer`, sem editar) | Sempre |
| Revisão de segurança (checklist inline: sanitização, auth guards, headers, secrets, `npm audit`) | Se tocar auth, sessões, inputs, CORS, CSP, permissões ou endpoints públicos |


## O resultado

Sempre termina com o arquivo **`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/gate-checklist.md`**:

1. **Semáforo:** 🟢 pronto para PR, 🟡 pode abrir com notas, 🔴 há bloqueadores
2. **Lacunas por área**, cada uma com: o que é, onde (`arquivo:linha`), por que importa, sugestão, severidade e a coluna **Decisão**, que você preenche (Ajustar / Não ajustar + motivo)
3. **Evidências** (comandos rodados e resultados) e o **PR Brief**, que o `eng.pr` aproveita

Depois, pergunta **Sim / Não**: publicar o relatório, com as suas decisões, como comentário na issue/card? Sem board, ou com Não, ele fica só na sessão. E **espera sua permissão** antes do `eng.pr`.

## Perguntas que ele faz

- **No fim:** "Seguir para o `/eng.pr`?" → **Parar aqui para ajustar (como hoje)** ou **Seguir para o `/eng.pr`** (com lacunas a ajustar, a opção avisa quantas são).

## Regras que importam

- Ao dizer "testes passando", o comando mostra **qual comando rodou e o resultado**
- Segurança: nenhum secret no diff, `npm audit` sem vulnerabilidade alta ou crítica e lockfile atualizado
- Se o PR tocar áreas sensíveis, recomenda o label `security` e a revisão de segurança antes do merge

## Próximo passo típico

[`eng.pr`](./eng.pr.md)
