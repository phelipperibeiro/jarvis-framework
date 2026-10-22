---
name: eng-global-tech-spec
description: >
  Método de especificação técnica do /eng.build-tech-spec, em dois modos: Delivery Spec (Tech Spec a
  partir de um épico ou de uma história, com subtarefas de 4h a 1 dia para a história) e Reference
  Spec (especificação técnica normativa, sem card e sem subtarefas: contratos, convenções, perfis
  de spec). Cada modo tem o seu arquivo em references/, lido só quando o modo é escolhido.
  Trigger: Use ao escrever uma Tech Spec a partir de um card ou uma spec técnica de referência.
allowed-tools: Read Grep Glob Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# eng-global-tech-spec

Método para escrever especificações técnicas no Jarvis. O `/eng.build-tech-spec` faz o gate de cargo, a triagem de modo e a carga das especializações; esta skill traz o "como" de cada modo e as regras que valem nos dois.

## Modos

Leia **só** o arquivo do modo escolhido pelo workflow:

| Modo | Quando | Arquivo | Saída |
|------|--------|---------|-------|
| Delivery Spec | Há card de origem (épico ou história) | [references/delivery-spec.md](references/delivery-spec.md) | `$SESSIONS_DIR/eng/{card}/tech-spec-arch.md` (épico) ou `tech-spec.md` com subtarefas (história) |
| Reference Spec | Documento normativo sem card: contrato, convenção de nome, topologia, perfil de adaptação de uma spec, fases de implementação | [references/reference-spec.md](references/reference-spec.md) | `$ENG_DOCS/SPEC/SPEC-###-{slug}.md` (template `ref-spec-template.md`), sem subtarefas |

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Delivery Spec › Fase 1.5 (necessidade de RFC) | `/eng.create-rfc` | Se a Tech Spec atender aos critérios que exigem RFC e o usuário escolher "A: Criar uma RFC agora" |
| Delivery Spec › Caminho A › 2A.2 | `/jarvis-docs-central` | Se `CENTRAL_DOCS_STORAGE` estiver configurado |
| Reference Spec › 2. Checagem de RFC | `/eng.create-rfc` | Sem RFC/ARD de origem, com algum dos 7 critérios "Sim" e a escolha "A: Criar uma RFC agora" |

> As mesmas chamadas estão na tabela do workflow `eng.build-tech-spec`, com as do gate e das áreas.

---

## Regras Importantes

### ⚠️ Nunca Assuma - Sempre Pergunte

- Se informação crítica está faltando → **pergunte ao usuário**
- Se há múltiplas interpretações possíveis → **peça clarificação**
- Se decisão arquitetural tem trade-offs → **discuta com usuário**

### 🎯 Foco em Valor Testável

- Cada subtarefa deve entregar algo **testável e validável**
- Evite subtarefas genéricas como "Implementar backend"
- Prefira subtarefas específicas como "Criar endpoint POST /api/users com validação"

### 📏 Estimativas Realistas

- Subtarefas devem ter **entre 4 horas e 1 dia cada**, como fatias verticais completas
- Se maior que 1 dia → **dividir em duas fatias verticais independentes** (nunca em camadas)
- Se menor que 4h → **agrupar com a próxima** até formar uma fatia vertical completa
- Incluir tempo para testes e documentação

### 🔗 Rastreabilidade

- Toda decisão deve ter **justificativa documentada**
- Links entre documentos devem **funcionar**
- Referências externas devem ser **específicas** (não "veja a documentação")

### 🏗️ Seguir Convenções do Projeto

- Analisar código existente antes de propor novos padrões
- Manter **consistência** com arquitetura atual
- Justificar **qualquer desvio** de padrões estabelecidos

### 📐 Princípios de Documentação

- **Valor do Usuário**: Sempre explicar o "porquê"
- **Contexto Completo**: Documento deve ser auto-contido
- **Terminologia Consistente**: Usar mesmos termos em toda documentação
- **Critérios Testáveis**: Evitar linguagem vaga ("rápido", "fácil")


---

## Boas Práticas

✅ **Fazer:**

- Usar diagramas Mermaid para comunicar arquitetura
- Documentar "por que" das decisões, não só "o que"
- Quebrar em incrementos pequenos e testáveis
- Validar com usuário em cada fase crítica
- Manter rastreabilidade (links, referências)

❌ **Evitar:**

- Assumir requisitos não explícitos
- Criar subtarefas maiores que 1 dia ou fatias horizontais (só enum, só repository, só DTO)
- Pular análise de riscos
- Propor tecnologias sem justificativa
- Documentação vaga ou genérica

