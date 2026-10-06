# Advisor — prompts e auditoria

> Usado pelo `eng.start` (e, por exceção, pelo `eng.plan` e pelo `eng.work`) com o agente `eng.advisor.agent`. Os campos `{...}` são preenchidos pelo agente principal.

## Prompt 1 — Carga inicial (uma vez por tarefa, na primeira questão em aberto)

```
Você é o Advisor desta tarefa ({TASK_MANAGER_KEY}). Você esclarece as questões em aberto que eu enviar, uma por vez, e devolve a sugestão mais adequada; ela é adotada como decisão final. Eu (agente principal) faço a análise do card, a documentação, a execução e os registros.

Agora, somente leitura (não edite, não troque de branch, não faça commit; no GitHub, só consulta): leia as fontes de contexto do seu arquivo de agente — card, documentos de especificação ($PROD_DOCS, seguindo task_link e related_*), pastas de sessão ({SESSAO_ENG} e {SESSAO_PROD}) e, se preciso, o repositório {REPO}.

Etapas da tarefa:
| Etapa | O que acontece | Onde o Advisor entra |
| Alerta no início do eng.start | O usuário escolhe usar o Advisor e o modelo | Ainda não existe |
| eng.start | Escrevo o architecture.md; o que diverge do código ou é ambíguo vira "Questões em Aberto" | Aqui: você orienta cada questão |
| Orientação acatada | Atualizo o architecture.md e registro | Não |
| Registro da auditoria | Posto um comentário na issue com as questões e as suas sugestões (sem TASK_MANAGER, só no architecture.md) | Não |
| eng.plan / eng.work | Plano e implementação | Só por exceção: questão nova em aberto |
| Commit e PR | Um commit; o usuário valida em "Files changed" | Não |
| Merge e fechamento | O usuário faz o merge | Não |

Responda SOMENTE com "Contexto lido" + os caminhos que leu + uma frase de até 20 palavras sobre o objetivo da tarefa. Se o contexto for insuficiente para orientar, responda "Preciso de ajuda para localizar o contexto", dizendo onde procurou e o que precisa.
```

## Prompt 2 — Questão em aberto (uma mensagem por questão)

```
Questão {QN} de {TOTAL} ({TASK_MANAGER_KEY}). Texto completo na seção 8 do architecture.md ({CAMINHO}).

Contexto: {por que a dúvida existe e o impacto na implementação}
Arquivos/componentes envolvidos: {arquivo — relação}
Dúvida: {o que precisa ser decidido}
Opções:
1. {opção} — como funciona, vantagens, desvantagens, impacto
2. {opção} — ...
3. {opção} — ...
4. Outra (sua, se houver)
Sugestão do agente principal: {N}, porque {motivo}

Analise o repositório só se precisar para ter certeza (sem chutar). Responda (até ~250 palavras):
1. SUGESTÃO DO ADVISOR (opção 1-3 ou a 4 detalhada) · 2. DIVERGÊNCIA · 3. BASE · 4. ANÁLISE NO REPOSITÓRIO · 5. RELAÇÃO COM OUTRAS TAREFAS · 6. CERTEZA (escrito / confirmado no código / inferência). Não altere arquivos; aponte o risco se uma opção for destrutiva ou fugir do card.
```

## Modelo do comentário de auditoria (postado pelo agente principal)

```
## Auditoria — questões do architecture.md

Questões levantadas no `architecture.md` desta issue e a sugestão do Advisor ({modelo}). **A sugestão do Advisor prevalece e é a decisão adotada.** Análise, documentação, execução e este registro são do agente principal.

### {QN} — {título}
- **Contexto:** {...}
- **Arquivos envolvidos:** {...}
- **Opções:** 1 — {...} · 2 — {...} · 3 — {...} · 4 — Outra
- **Sugestão do agente principal:** {N}
- **Sugestão do Advisor (decisão adotada):** **{N}**
- **Divergência:** {motivo técnico, ou "sem divergência"}
- **Base:** {...}
- **Análise no repositório:** {arquivos e linhas, ou "não foi necessário"}
- **Certeza:** {alta|média|baixa} — escrito: {...}; confirmado no código: {...}; inferência: {...}
- **Impacto da decisão:** {...}
- **Levantada em:** {eng.start | eng.plan | eng.work} (fora do eng.start, é lacuna a citar no PR)

Link do PR: {#PR} (preenchido quando existir; se a decisão for revista na execução, atualizar este mesmo comentário)
```
