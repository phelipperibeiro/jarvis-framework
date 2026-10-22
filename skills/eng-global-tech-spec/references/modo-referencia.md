# Modo referência — especificação técnica de referência

> Usado pelo `/eng.build-tech-spec` quando a entrada é um documento normativo sem card de origem.
> 📤 **Template**: `$IDE/templates/engineering/ref-spec-template.md` · **Saída**: `$ENG_DOCS/SPEC/SPEC-###-{slug}.md`

---

## Quando usar

Uma **especificação técnica de referência** é um documento normativo: diz como as implementações devem ser feitas. Exemplos: um contrato entre serviços, uma convenção de nomes, a topologia de uma mensageria, o perfil de adaptação de uma spec conceitual, as fases de adoção de um padrão.

| Ela… | Quem faz isso, se não ela |
|------|---------------------------|
| **não** deriva de um card | o modo card (Tech Spec de épico ou história) |
| **não** decide trade-off | o RFC (`/eng.create-rfc`) |
| **não** desenha a arquitetura | o ARD (`/eng.create-ard`) |
| **não** quebra em subtarefas nem cria cards | o modo card e o `/eng.breakdown-subtasks` |

Se a conversa mostrar que existe um card de origem, volte ao workflow e siga o modo card.

---

## 1. Triagem

Pergunte **uma coisa por vez**, com `AskUserQuestion` quando houver opções:

1. **Tema e escopo normativo:** o que a spec rege e o que fica de fora.
2. **Áreas envolvidas** (backend, frontend, qa, data, automation, platform): a resposta alimenta o Passo 2 do workflow, que carrega o skill base e as especializações de cada área.
3. **Origem:** "Há RFC ou ARD de origem?" — **Sim (informe o ID ou o caminho)** / **Não**.

Não invente nada que o usuário não disse: o que faltar vira pergunta.

## 2. Checagem de RFC

- **Com RFC/ARD de origem:** registre o ID em `related` e siga. Cada decisão da spec deve caber no que a origem já decidiu.
- **Sem origem:** aplique os critérios abaixo. Eles são os da Fase 1.5 do modo card **sem** "Vai virar padrão reutilizável": esse critério sai porque ser um padrão reutilizável é a natureza deste documento. Não o recoloque, ou toda spec de referência exigiria RFC.

| Critério | Aplica? |
| -------- | ------- |
| Impacta **mais de uma squad** | ( ) Sim / ( ) Não |
| Altera **arquitetura**, **padrões técnicos** ou **infra** | ( ) Sim / ( ) Não |
| Introduz **nova dependência crítica** (serviço, lib, vendor) | ( ) Sim / ( ) Não |
| Afeta **custo recorrente** (cloud, APIs, licenças) | ( ) Sim / ( ) Não |
| Muda **SLA, SLO ou contratos técnicos** | ( ) Sim / ( ) Não |
| Pode gerar **lock-in** ou dívida técnica relevante | ( ) Sim / ( ) Não |
| Envolve **dados sensíveis / compliance** | ( ) Sim / ( ) Não |

Se algum for "Sim", mostre os critérios que se aplicam e pergunte:

```
A: Criar uma RFC agora (/eng.create-rfc)
B: Vincular a uma RFC existente (informe o ID/caminho)
C: Prosseguir sem RFC (justifique o motivo)
```

Registre a resposta no documento (seção "Contexto" e, se houver, `related`).

## 3. Investigação

Só leitura:

- O RFC/ARD de origem (`$ENG_DOCS/RFC/`, `$ENG_DOCS/ARD/`) e as specs que já existem em `$ENG_DOCS/SPEC/` (para não contradizer nem duplicar).
- O código que a spec vai reger: como o projeto faz hoje, nomes, contratos e padrões existentes. A spec aponta exemplos reais.
- **Contratos de API externa:** procure primeiro no repositório (`$ENG_DOCS/swagger/`, `$ENG_DOCS/openapi/`, `**/*swagger*.{yaml,yml,json}`, `**/*openapi*.{yaml,yml,json}`); sem contrato, pergunte ao usuário; sem resposta, registre `[A DEFINIR — contrato pendente com {time/parceiro}]`. Nunca crie paths, schemas ou payloads fictícios.

## 4. Conteúdo

Preencha o `ref-spec-template.md`:

1. **Contexto:** por que a spec existe e de onde parte.
2. **Escopo normativo:** o que rege e o que não rege.
3. **Decisões resolvidas:** cada uma com a **origem** (RFC-xxx, ARD-xxx ou "resolvida aqui"). Uma decisão "resolvida aqui" que escolhe entre alternativas com trade-off relevante deve voltar à Checagem de RFC.
4. **Contratos e convenções:** específicos, com nomes reais e exemplos.
5. **Critérios de aderência:** verificáveis; dizem se uma implementação segue a spec.
6. **Fases de implementação:** só se a adoção tiver ordem. Sem subtarefas nem estimativas.
7. **Versionamento:** major quebra a aderência; minor acrescenta sem quebrar; patch corrige texto.

**Sem subtarefas e sem board:** este modo não quebra em subtarefas, não cria cards e não comenta no $TASK_MANAGER.

## 5. Apresentação e aprovação

Apresente um resumo (escopo, decisões resolvidas e origem de cada uma, contratos principais, critérios de aderência) e **aguarde a aprovação do usuário** antes de salvar. Itere se ele pedir mudanças.

## 6. Salvar

- **Caminho:** `$ENG_DOCS/SPEC/SPEC-###-{slug}.md`, com `{slug}` em kebab-case, sem acentos.
- **Número:** se `$ENG_DOCS/SPEC/` existir e tiver arquivos no padrão `SPEC-###-*.md`, use o maior `###` + 1; senão, `001`. Crie a pasta se não existir.
- **Frontmatter:** `id`, `name`, `version` (`1.0.0` na criação), `status` (`proposed` na criação), `related`, datas, `author` e `reviewers`.
- É um **documento de trabalho**: fica em `$ENG_DOCS` (`docs/jarvis/`) e **não** é publicado no Central docs, como RFC e ARD.

Ao terminar, exiba:

```
✅ Especificação de referência criada!

📄 Documento: $ENG_DOCS/SPEC/SPEC-{###}-{slug}.md
🏷️ Versão: 1.0.0 · Status: proposed
🔗 Origem: {RFC-xxx | ARD-xxx | sem origem (checagem de RFC: {resultado})}
📐 Decisões resolvidas: {N} ({M} resolvidas aqui)

📌 Próximos passos:
- Revisar com {reviewers} e mudar o status para approved
- Implementações que seguirem a spec citam o SPEC-{###} (ex.: no architecture.md do /eng.start)
- Mudou a regra? Atualize a versão (SemVer) e o histórico de revisões
```
