> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras de Especializações por Área

## Objetivo

Fazer todo comando `eng.*` carregar o **skill base** da área mais as **especializações** que o projeto registrou no `ENV.md`, e avisar a pessoa quando algo falta.

## Escopo

Vale para qualquer comando `eng.*` e seus agentes, ao iniciar um trabalho que seja claramente de uma destas áreas. Se o trabalho envolve mais de uma, aplique a regra a cada uma. Se não é de nenhuma, não carregue nada.

| Área | Indicadores de quando se aplica |
|------|----------------------------------|
| backend | APIs, autenticação, workers, banco de dados, servidor |
| frontend | Componentes, interface, estilos, estado |
| qa | Testes, cobertura, quality gates, planejamento de testes |
| data | Pipelines, ETL/ELT, modelagem, contratos de dados, qualidade de dados |
| automation | RPA (robôs, automação de browser/fluxos de trabalho), web scraping, crawling, parsing |
| platform | Infraestrutura, cloud, IaC, contêineres, CI/CD, observabilidade, SRE, segurança de infra, FinOps |

| Área | Variável no `ENV.md` | Skill base |
|------|----------------------|------------|
| backend | `BACKEND_SPECIALIZATIONS` | `eng-backend` |
| frontend | `FRONTEND_SPECIALIZATIONS` | `eng-frontend` |
| qa | `QA_SPECIALIZATIONS` | `eng-qa` |
| data | `DATA_SPECIALIZATIONS` | `eng-data` |
| automation | `AUTOMATION_SPECIALIZATIONS` | `eng-automation` |
| platform | `PLATFORM_SPECIALIZATIONS` | `eng-platform` |

## Regras

### Obrigatório

1. **Leia a variável** da área no `$IDE/ENV.md`.
2. **Variável ausente** (a chave não existe, diferente de vazia): **interrompa o comando** e exiba:
   `⚠️ A variável {VAR} não existe no ENV.md. Execute /jarvis-init e escolha Upgrade (C) para acrescentá-la. O comando foi interrompido.`
3. **Lista vazia:** siga só com o skill base e exiba:
   `ℹ️ Sem especialização registrada para {área}. Usando só a skill base ({base}).`
4. **Lista com itens:** carregue o skill base e, para **cada item**:
   - nome fora de `^[a-z0-9][a-z0-9-]*$` (inclui `/`, `..` e maiúsculas): ignore o item e exiba
     `⚠️ O item "{item}" de {VAR} tem caracteres inválidos (use letras minúsculas, números e hífen). Item ignorado.`
   - `$IDE/skills/{item}/SKILL.md` não existe: exiba
     `⚠️ O item "{item}" de {VAR} não corresponde a um skill instalado em $IDE/skills/. Instale o skill ou corrija a lista. Seguindo com o neutro e os demais itens.`
   - existe: leia o `SKILL.md` e aplique-o junto com o skill base.
5. **Informe** o que foi carregado: `✅ Skills carregados ({área}): {base} (base), {itens carregados}`.
6. As especializações **somam-se** ao skill base; nenhuma o substitui.

### Formato da lista

- Itens **separados por vírgula**: `eng-backend-golang,eng-backend-nestjs`.
- **Leia** com ou sem colchetes, espaços e aspas (`a,b`, `[a,b]`, `[ a , b ]`, `["a","b"]`).
- Ao **gravar**, escreva sempre separado por vírgula, sem colchetes.

### Proibido

- Criar ou alterar a variável por conta própria.
- Seguir só com o skill base quando a variável está **ausente**.
- Carregar skills que não estão na lista.
- Aceitar item com caminho (`/`, `..`) ou fora do padrão de nome.

### Recomendado

- Citar na mensagem o nome da variável e do item.
- Com vários itens, carregar todos.

## Exceções

- `ai`, `devops`, `global` e `product` ainda não têm lista — fora do escopo desta regra até que apareça necessidade real (evolução futura).
- Skills dessas áreas não passam por esta regra.
- A área `security` foi descontinuada (2026-10-05): não existe mais skill própria nem lista. Segurança de infraestrutura e fundamentos de segurança da informação entram em `PLATFORM_SPECIALIZATIONS`; segurança de código de aplicação já é padrão embutido em `eng-backend`/`eng-frontend`. Ver `skills/security-skills-deleted.md`.

## Referências

- `eng-rules.md`: validação do `ENV.md` (lista presente, mesmo vazia).
- `eng.skills-rules.md`: área obrigatória nos skills e aviso de skill inexistente (o nome citado em uma lista que não existe também segue o aviso de lá).
- `skills/jarvis-create-specialization/SKILL.md`: criação de uma especialização a partir do código do projeto e registro na lista.
- `skills/jarvis-list-specializations/SKILL.md`: consulta das especializações instaladas e registradas.
- `templates/ENV-template.md`: seção "Especializações de stack".
