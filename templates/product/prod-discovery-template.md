---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador único, em sequência (ex.: discovery-001). Vai no nome do arquivo e nos campos related_* de outros documentos.
id: {discovery-001}

# Nome curto do documento. Vai no título e, em kebab-case, no nome do arquivo.
name: {nome dessa ideia}

# Situação do rascunho. O discovery tem ciclo próprio (rules/product/prod-rules.md).
# Opções: in_review (rascunho em andamento ou concluído) | cancelled (o veredito foi do_not_proceed)
status: {in_review | cancelled}

# Recomendação do discovery: vale seguir com essa ideia? Fica vazio durante a entrevista.
# Opções: proceed (vale especificar) | investigate_more (há lacuna crítica) | do_not_proceed (não seguir; status passa a cancelled)
verdict: {vazio durante a entrevista | proceed | investigate_more | do_not_proceed}

# Tamanho da ideia; define quantas perguntas a entrevista faz.
# Opções: small (trabalho já claro, até 2) | bounded (funcionalidade num produto existente, até 5) | broad (várias entregas, até 8)
size: {small | bounded | broad}

# Datas de criação e da última alteração (YYYY-MM-DD).
created_at: {YYYY-MM-DD}
updated_at: {YYYY-MM-DD}

# Quem criou o documento e quem o editou por último (USER do ENV.md).
created_by: {nome de quem criou esse doc}
last_editor: {nome de quem editou por último}
---

# {id}: {name}

> **Rascunho.** Registra o que se sabe, o que é suposição e o que ainda é lacuna sobre uma ideia. Não define tarefas, histórias, critérios de aceitação nem estimativas. Um PRD, FRD, épico ou issue criado a partir dele é a fonte da verdade. Nunca registre credenciais, tokens nem dados pessoais de clientes.

## Entendimento

{A ideia em uma frase, nas palavras do usuário, e para quem ela é.}

| Dito por você | Suposição (origem) | Lacuna (quem responde) |
|---|---|---|
| {fato informado pelo usuário} | {o que precisa ser verdade; origem: dado, observação ou suposição} | {o que falta saber; marque **crítica** se mudar o veredito} |

## Problema

- **Dor:** {o que não funciona hoje, sem falar de solução}
- **Quem sofre:** {quem e em que situação}
- **Evidência:** {dado, relato ou observação; se não houver, "sem evidência"}
- **Como se resolve hoje:** {a alternativa atual, mesmo que seja uma gambiarra}
- **Por que agora:** {o que torna isto relevante neste momento}
- **Sinal de sucesso:** {como saberemos que funcionou, sem metas fechadas}

## Abordagens

| Abordagem | Prós | Contras |
|---|---|---|
| {a menor coisa que funciona} | {…} | {…} |
| {outra opção} | {…} | {…} |
| {não fazer / usar algo existente} | {…} | {…} |

**Recomendação:** {qual abordagem e por quê, em 1–2 frases} · **Riscos e dependências:** {com quem pode confirmar}

## Scorecard

| Lente | Nota | Justificativa |
|---|---|---|
| **Valor:** alguém vai querer e usar? | {forte, adequado, fraco ou desconhecido} | {uma linha} |
| **Usabilidade:** as pessoas conseguem usar? | {…} | {…} |
| **Técnica:** dá para construir com o que temos? | {…} | {…} |
| **Negócio:** custo, prazo e risco fazem sentido? | {…} | {…} |

## Veredito

**Veredito:** {proceed | investigate_more | do_not_proceed}

**Motivo:** {justificativa curta. Lacuna crítica aberta ou lente crítica "desconhecido" nunca dá `proceed`. Com `do_not_proceed`, o `status` passa a `cancelled`.}

## Próximo passo sugerido

- **Comando** (só uma sugestão, nunca executado sozinho): {ex.: /prod.spec.issue discovery-001 · /prod.spec.frd discovery-001 · /prod.spec.prd discovery-001 (e depois /prod.spec.breakdown) · retomar este discovery · arquivar}
- **Motivo:** {por que esse caminho}
- **Alternativa:** {outro caminho, se houver}

## Histórico

| Data | Perguntas | O que ficou pendente |
|---|---|---|
| {YYYY-MM-DD} | {N de até M} | {lacunas abertas} |
