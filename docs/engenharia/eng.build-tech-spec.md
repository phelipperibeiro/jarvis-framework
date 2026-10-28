# `/eng.build-tech-spec` — Delivery Spec (a partir de um card) ou Reference Spec

Workflow: `workflows/engineering/eng.build-tech-spec.md` · Skill: `skills/eng-global-tech-spec/` · Regras: `rules-on-demand/engineering/eng.tech-spec-rules.md` · Templates: `templates/engineering/tech-spec-template.md` (Delivery Spec) e [`ref-spec-template.md`](../../templates/engineering/ref-spec-template.md) (Reference Spec)

## Em uma frase

Tem dois modos: transforma um épico ou uma história do board em uma **Tech Spec** (decisões justificadas, plano, riscos, testes e, para histórias, subtarefas prontas para virar cards) ou escreve uma **especificação técnica de referência**, o documento normativo que diz como as implementações devem ser feitas.

## O que é

- **Delivery Spec:** a Tech Spec é o documento técnico auto-contido de um card: um desenvolvedor deve conseguir executá-la sem precisar perguntar. Ela **é salva na sessão** (`.jarvis/sessions/eng/{card}/tech-spec.md`); anexá-la ao card é opcional e só acontece depois de mostrar o que vai e perguntar (regra de ouro); sem o Sim, ela fica só na sessão.
- **Reference Spec:** um documento normativo (contrato entre serviços, convenção de nomes, topologia, perfil de adaptação de uma spec, fases de adoção) que **não** deriva de card, **não** decide trade-off (isso é do RFC) e **não** desenha a arquitetura (isso é do ARD). Não tem subtarefas. Fica em `docs/jarvis/engineering/SPEC/SPEC-###-{nome}.md`, numerado como RFC e ARD, e é versionado com SemVer.

> **Quem pode rodar:** `POSITION` igual a `TECH LEAD`, `HEAD`, `CTO`, `SPECIALIST` ou `SENIOR`. O `GENERALIST` sempre passa: em time pequeno ele acumula todos os papéis (ver `taxonomy.md`). Com outro cargo no `ENV.md`, o comando responde "Acesso Negado", lista os cargos aceitos e para.

## Quando usar

- Antes de implementar uma história ou épico que precisa de especificação técnica detalhada (Delivery Spec)
- Quando o time quer subtarefas bem definidas para distribuir o trabalho (Delivery Spec)
- Quando um RFC ou ARD já decidiu o rumo e falta o documento que fixa contratos, convenções e fases (Reference Spec)

## Quando **não** usar

- Você quer o fluxo enxuto de planejamento de uma tarefa → [`eng.start`](./eng.start.md)
- Só quer detalhar as fatias de uma Tech Spec que já existe → [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md)
- A decisão ainda está em discussão → [`eng.create-rfc`](./eng.create-rfc.md)
- Você vai desenhar a arquitetura → [`eng.create-ard`](./eng.create-ard.md)

## Como funciona

1. **Cargo:** confere o `POSITION` (acima).
2. **Modo:** com URL, ID ou texto de card, segue no Delivery Spec sem perguntar, como sempre. Com a descrição de um documento normativo, segue no Reference Spec. Sem argumentos (ou se ficar ambíguo), pergunta se há card de origem.
3. **Áreas (dentro do modo, depois de ler o card ou da triagem):** identifica as áreas da spec (backend, frontend, qa, data, automation, platform) e carrega o skill base de cada uma mais as especializações registradas no `ENV.md` (regra `eng.specializations-rules.md`). Assim a spec segue as convenções do projeto, e não padrões genéricos.
4. **Executa o modo**, lendo só o arquivo dele (`skills/eng-global-tech-spec/references/`); o passo 3 acontece no começo desse arquivo.

**Delivery Spec: épico → Tech Spec arquitetural**

Entendimento do card, validação de necessidade de RFC (8 critérios), investigação arquitetural, proposta (decisões, desenho, contratos, riscos), apresentação a você e geração do `tech-spec-arch.md`. **Não quebra em subtarefas**, porque a quebra em histórias vem de Produto.

**Delivery Spec: história → Tech Spec de implementação**

Entendimento do card, validação de RFC, investigação do codebase, **avaliação de complexidade**, proposta arquitetural, quebra em subtarefas, riscos e considerações, criação do `tech-spec.md`, criação das subtarefas no board só depois da pergunta (ou um template para você criar) e validação final.

**Reference Spec**

Triagem (escopo, áreas e se há RFC ou ARD de origem), checagem de RFC (sem origem, 7 dos 8 critérios: "padrão reutilizável" sai porque é a natureza do documento), investigação só de leitura, conteúdo pelo template (escopo normativo, decisões resolvidas com a origem de cada uma, contratos e convenções, critérios de aderência, fases e versionamento), aprovação e gravação em `docs/jarvis/engineering/SPEC/`. É documento de trabalho: não vai para o Central docs.

## Regras que importam

- **Nunca inventa dados**; se não souber, pergunta
- Toda decisão tem justificativa; no Delivery Spec, com pelo menos duas alternativas consideradas
- Toda Tech Spec documenta riscos com mitigação
- No Delivery Spec, subtarefas são **fatias verticais completas** (endpoint inteiro, modal inteiro, tela inteira) e nunca fatias horizontais (só enum, só repository, só DTO)
- No Reference Spec, cada decisão aponta a origem (RFC, ARD ou "resolvida aqui"), para que uma decisão nova não passe escondida
- **Links clicáveis:** requisitos, documentos e código citados na spec viram links relativos ao arquivo (`rules-on-demand/doc-links-rules.md`)

## Próximo passo típico

- **Delivery Spec:** [`eng.start`](./eng.start.md) em cada subtarefa. Se as fatias forem para pessoas diferentes ou para quem precisa de um passo a passo (ex.: time com juniores), rode antes o [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md): ele não gera a spec, só detalha cada fatia.
- **Reference Spec:** revisar a spec com os revisores e mudar o status para `approved`; as implementações que a seguirem citam o `SPEC-###`.
