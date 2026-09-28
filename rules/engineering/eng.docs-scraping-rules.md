> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Eng Docs Scraping Rules — Documentação de Robôs de Scraping

## Objetivo

Definir o padrão de documentação técnica para robôs de scraping do projeto.

## Escopo

Aplicável sempre que um robô novo for implementado, um bug estrutural for resolvido, ou descobertas relevantes sobre o site-alvo forem feitas.

---

## Regras

### Obrigatório

#### Localização

- Sempre criar em `docs/engineering/robots/{robot-tag}-robot.md`
- Exemplos: `docs/engineering/robots/ba-robot.md`, `docs/engineering/robots/sp-robot.md`

#### Conteúdo obrigatório

Todo arquivo `{robot-tag}-robot.md` deve conter:

| Seção | O que documentar |
|---|---|
| **Visão Geral** | O que o robô coleta e o que **não** coleta (limitações por design) |
| **Fluxo de Execução** | Sequência de chamadas HTTP com URLs completas de cada etapa |
| **Fontes de Dados** | Cada fonte (PDF, HTML, API) com mapeamento de campos/colunas |
| **Campos Extraídos** | Tabela por `situation` (ex: IMPOSTA vs AGUARDANDO IMPOSICAO) — quais campos existem em cada uma e a fonte |
| **Limitações Conhecidas** | Campos indisponíveis na fonte do DETRAN/órgão — documentar por que não é possível extrair |
| **Histórico de Bugs** | Bugs resolvidos com referência ao Jira key, sintoma, causa e fix aplicado |
| **Checklist de Troubleshooting** | Tabela: sintoma → causa provável → ação |

#### Quando atualizar

- Ao implementar um robô novo
- Ao resolver qualquer bug estrutural (ex: campo retornando vazio, matching falho)
- Ao fazer descobertas relevantes sobre o comportamento do site-alvo (ex: estrutura de colunas HTML, campos disponíveis por situação de multa)
- Sempre referenciar o Jira key no histórico de bugs

### Proibido

- ❌ Criar em `docs/robots/` — pasta incorreta, usar `docs/engineering/robots/`
- ❌ Omitir a seção de **Limitações Conhecidas** — é fundamental para evitar que outros devs tentem implementar algo impossível
- ❌ Omitir o **Histórico de Bugs** — descobertas custam tempo; documentar evita retrabalho

### Recomendado

- Chamar `/docs-index` após criar ou atualizar qualquer `{robot-tag}-robot.md` para manter o índice atualizado
- Incluir o índice de colunas da tabela HTML (com numeração `[0]`, `[1]`, etc.) sempre que for inspecionado via log

---

## Exceções

Nenhuma — todo robô deve ter sua documentação, independente do tamanho ou complexidade.

## Referências

- `docs/engineering/robots/{robot-tag}-robot.md` — referência de implementação completa
