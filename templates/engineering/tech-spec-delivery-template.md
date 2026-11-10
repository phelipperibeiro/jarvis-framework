# Tech Spec — Formatos de Entrega

> Template com os formatos usados no fim do `eng.build-tech-spec`: descrição da subtarefa no board (resumo ou passo a passo), comentário na história original, mensagem de entrega e um exemplo preenchido, além do diagrama do fluxo. Substitua os placeholders `{...}`.

## Descrição da subtarefa no board

Fase 7.2 do workflow, nível **Resumo (como hoje)**. Use este formato na descrição de cada subtarefa criada no Jira pela `acli` (ou entregue ao usuário para copiar e colar no board).

```markdown
## Descrição

{Descrição técnica detalhada}

## Arquivos a Modificar/Criar

- `path/to/file1.py` - [Modificação] - {Descrição}
- `path/to/file2.tsx` - [Criação] - {Descrição}

## Critérios de Aceitação

- [ ] {Critério 1}
- [ ] {Critério 2}

## Testes Requeridos

- [ ] Teste unitário: {descrição}
- [ ] Teste de integração: {descrição}

## Dependências

{SUBTASK-XXX / Nenhuma}

## Referência

Tech Spec: [Link para tech-spec.md]
```

## Descrição da subtarefa no board, passo a passo

Fase 7.2 do workflow, nível **Passo a passo para quem executa sem perguntar**. A descrição é um tutorial: quem pega o card implementa seguindo-a, sem perguntar. Preencha todas as seções; caminhos reais do projeto; código completo, sem `...` nem `// resto do código`.

````markdown
# SUBTASK-XXX: [{STACK}] {Título específico e acionável}

**Depende de:** {SUBTASK-XXX / Nenhuma} · **Desbloqueia:** {SUBTASK-XXX / Nenhuma} · **Paralela com:** {SUBTASK-XXX / Nenhuma}

## O que você vai fazer

{2 a 3 frases: o que existirá quando a subtarefa terminar}

## Por que e onde se encaixa

{O motivo de negócio ou técnico e como esta fatia se conecta às outras e à funcionalidade final}

**Pré-requisitos:**
- [ ] {Subtarefa anterior concluída, ambiente, acesso}

## Arquivos de referência (copie o padrão)

- `{caminho/arquivo-parecido}` — use como base para {o quê} (sem arquivo parecido no projeto: "nenhum parecido no projeto")

## Arquivos a criar/modificar

| Arquivo | Ação | O que muda |
|---|---|---|
| `{caminho/arquivo}` | Criar / Modificar | {descrição} |

## Passo a passo

### Passo 1: {título}

**O que fazer:** {explicação}

```{linguagem}
// {caminho/do/arquivo}
{código completo}
```

**Por que assim:** {o que cada parte importante faz e por quê}

**Como validar este passo:** {comando ou verificação}

### Passo 2: {título}

{mesma estrutura; quantos passos forem necessários}

## Testes

```{linguagem}
// {caminho/do/arquivo-de-teste}
{código completo dos testes}
```

| Cenário | Input | Output esperado |
|---|---|---|
| {caminho feliz} | {input} | {output} |
| {erro} | {input inválido} | {erro esperado} |

**Como rodar:** `{comando dos testes desta subtarefa}`

## Checklist de conclusão

- [ ] Código conforme os passos, sem log de depuração nem `TODO` sem issue
- [ ] Testes passando; lint e build sem erros
- [ ] Critérios de aceitação da subtarefa atendidos

## Riscos e armadilhas

- ⚠️ {risco e como evitar}
- ❌ {erro comum e por que é errado}

## Referência

Tech Spec: [Link para tech-spec.md], seção {SUBTASK-XXX}
````

## Comentário na história original

Fase 7.4 do workflow. Comentário a registrar na história (STORY-XXX) depois de criar as subtarefas, pelo `/eng-global-task-comment`, que mostra o texto e pergunta (regra de ouro).

```
Tech Spec criada: [Link para tech-spec.md]

Subtarefas criadas:
- SUBTASK-001: {Nome}
- SUBTASK-002: {Nome}
- SUBTASK-003: {Nome}
...

Total de subtarefas: {X}
Estimativa total: {Y horas}
```

## Mensagem de entrega

Fase 8.2 do workflow. O que entregar ao usuário ao final.

```
✅ Tech Spec criada com sucesso!

📄 Documento Local: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/tech-spec.md
📎 {Anexada na issue: {STORY-XXX} | A anexar pela pessoa (orientado: GitHub/GitLab, sem a CLI, CLI que não anexa ou acesso manual) | Não anexada (só na sessão; sem o Sim) | Sem issue (freelance)}

📋 Resumo:
- História: {STORY-XXX} - {Título}
- Fases: {X fases}
- Subtarefas: {Y subtarefas}
- Estimativa total: {Z horas}

📝 Subtarefas ({resumo | passo a passo}): $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/subtarefas.md

🔗 Subtarefas {criadas no Jira pela acli | entregues em template para criação manual (outros boards, sem a CLI, com acesso manual, sem o Sim ou sem board)}:
- SUBTASK-001: {Nome} (P0, 6h)
- SUBTASK-002: {Nome} (P1, 4h)
- SUBTASK-003: {Nome} (P1, 8h)
...

⚠️ Riscos Principais:
- {Risco 1}
- {Risco 2}

📌 Próximos Passos Sugeridos:
1. Revisar e aprovar a Tech Spec
2. Atribuir subtarefas ao time
3. Iniciar desenvolvimento pela Fase 1
4. Monitorar progresso e atualizar plan.md
```

## Exemplo de output final

Exemplo preenchido da mensagem de entrega (fictício).

```markdown
✅ Tech Spec para STORY-456 criada com sucesso!

📄 **Documento Local**: $SESSIONS_DIR/eng/story-456/tech-spec.md
📎 **Anexada na issue**: STORY-456

📊 **Resumo**:

- **História**: STORY-456 - Implementar autenticação de usuários
- **Fases**: 3 fases (Backend, Frontend, Testes)
- **Subtarefas**: 5 subtarefas
- **Estimativa total**: 26 horas

🔗 **Subtarefas criadas no Jira**:   ← ou "entregues em template"

- SUBTASK-101: [BACKEND] Criar endpoint POST /api/auth/register (P0, 6h)
- SUBTASK-102: [BACKEND] Criar endpoint POST /api/auth/login (P0, 6h)
- SUBTASK-103: [BACKEND] Criar endpoint POST /api/auth/logout (P1, 4h)
- SUBTASK-104: [FRONTEND] Criar tela de login integrada à API (P1, 6h)
- SUBTASK-105: [QA] Testes E2E do fluxo de autenticação (P2, 4h)

⚠️ **Riscos Principais**:

- JWT secret precisa estar em variável de ambiente
- Performance de bcrypt pode impactar tempo de login (mitigado com salt rounds = 10)

📐 **Decisões Arquiteturais**:

- Escolhido JWT em vez de sessões (stateless, escalável)
- Bcrypt para hash de senhas (padrão da indústria)
- Rate limiting em login (proteção contra brute force)

📌 **Próximos Passos**:

1. ✅ Revisar tech spec (aguardando sua aprovação)
2. Atribuir SUBTASK-101 a 103 para desenvolvedor backend
3. Atribuir SUBTASK-104 para desenvolvedor frontend
4. Iniciar pelo backend - SUBTASK-101 e 102
5. Configurar variáveis de ambiente em staging/prod

🎯 **Pronto para iniciar desenvolvimento!**
```

## Fluxo resumido

Visão geral do fluxo do workflow, do modo e do tipo de documento (épico ou história) até a entrega. O Reference Spec não usa este arquivo: o fluxo dele está em `skills/eng-global-tech-spec/references/reference-spec.md`.

```
┌─────────────────────────────────────────────────────────┐
│ MODO: Delivery Spec ou Reference Spec?                  │
│    (pelos argumentos ou pergunta)                       │
│    └─ Reference Spec → reference-spec.md                │
│       → $ENG_DOCS/SPEC/ (sem subtarefas e sem board)    │
└─────────────────────────────────────────────────────────┘
                          ↓ Delivery Spec
┌─────────────────────────────────────────────────────────┐
│ 0. DETECÇÃO DO TIPO                                     │
│    └─ Épico ou História? (inferir ou perguntar)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 1. ENTENDIMENTO                                         │
│    └─ Ler card, fazer perguntas, validar contexto      │
│    └─ História com tech-spec.md pronta? atalho → 7B    │
└─────────────────────────────────────────────────────────┘
                          ↓
           ┌──────────────┴──────────────┐
           ▼                             ▼
   ┌───────────────┐             ┌───────────────┐
   │    ÉPICO      │             │   HISTÓRIA    │
   ├───────────────┤             ├───────────────┤
   │ 2A. Investig. │             │ 2B. Investig. │
   │    arquit.    │             │    codebase   │
   ├───────────────┤             ├───────────────┤
   │ 3A. Proposta  │             │ 2.5B. Compl.  │
   │    arquit.    │             ├───────────────┤
   ├───────────────┤             │ 3B. Proposta  │
   │ 4A. Doc       │             ├───────────────┤
   │ tech-spec-    │             │ 4B. Subtaref. │
   │ arch.md       │             ├───────────────┤
   └───────────────┘             │ 5B. Riscos    │
                                 ├───────────────┤
                                 │ 6B. Doc       │
                                 │ tech-spec.md  │
                                 ├───────────────┤
                                 │ 7B. Nível +   │
                                 │ subtarefas.md │
                                 │ + $TASK_MGR   │
                                 ├───────────────┤
                                 │ 8B. Entrega   │
                                 └───────────────┘
```

---

**Notas para o agente**:
- Este arquivo só traz formatos: o passo a passo do Delivery Spec está em `skills/eng-global-tech-spec/references/delivery-spec.md` (o workflow `eng.build-tech-spec.md` faz o gate, a triagem de modo e as áreas).
- Mantenha os placeholders `{...}` até ter os dados reais; não invente links, estimativas nem ids.
