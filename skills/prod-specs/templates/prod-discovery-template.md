---
id: {discovery-001}
name: {nome dessa ideia}
status: {in_review enquanto o rascunho existe | cancelled se o veredito for do_not_proceed}
verdict: {vazio durante a entrevista | proceed | investigate_more | do_not_proceed}
created_at: {YYYY-MM-DD}
updated_at: {YYYY-MM-DD}
created_by: {nome de quem criou esse doc}
last_editor: {nome de quem editou por último}
---

# {id}: {name}

> **Este documento é um rascunho.** Ele registra o que se sabe, o que é hipótese e o que ainda é lacuna sobre uma ideia. Não define tarefas, histórias, critérios de aceitação, estimativas nem escopo fechado, e nada aqui é verdade absoluta. Quando um PRD, FRD, épico ou issue for criado a partir dele, o documento novo é a fonte da verdade.
>
> Nunca registre credenciais, tokens nem dados pessoais de clientes neste arquivo: ele é versionado.

## Ideia

{O que é a ideia, em poucas frases, e para quem ela é. Use as palavras do usuário; não acrescente o que ele não disse.}

## Problema

{Declare o problema, não a solução. Responda, sempre que souber:}

- **Qual é o problema?** {a dor, o que não funciona hoje}
- **Quem sofre com ele?** {quem e em que situação}
- **Qual a evidência de que ele existe?** {dado, relato ou observação; se não houver, diga "sem evidência"}
- **Como se resolve hoje?** {a alternativa atual, mesmo que seja uma gambiarra}
- **Por que agora?** {o que torna isto relevante neste momento}
- **Como saberemos que funcionou?** {sinais de sucesso, sem metas fechadas}

## Hipóteses

{Uma tabela única com tudo o que precisaria ser verdade para a ideia funcionar: requisitos iniciais e suposições. Requisitos são hipóteses de alto nível, sem critério de aceitação. Destaque as de importância alta e certeza baixa: são as primeiras a validar e alimentam as perguntas em aberto.}

| Hipótese | Tipo | Importância | Certeza | Origem | Como validar |
|---|---|---|---|---|---|
| {o que precisaria ser verdade} | {problema, requisito, usuário, técnica ou negócio} | {alta, média ou baixa} | {alta, média ou baixa} | {dado, observação ou suposição} | {como confirmar ou descartar} |

## Viabilidade

{Um sinal indicativo por lente, com a justificativa e as lacunas que o sustentam. É uma leitura inicial, não um desenho técnico nem uma estimativa. Um rascunho de abordagem técnica pode aparecer, sempre como hipótese a validar e nunca como decisão de arquitetura.}

| Lente | Sinal | Justificativa e lacunas |
|---|---|---|
| **Valor:** alguém vai querer e usar? | {alto, médio ou baixo} | {por quê; o que ainda não se sabe} |
| **Usabilidade:** as pessoas conseguem usar? | {alto, médio ou baixo} | {por quê; o que ainda não se sabe} |
| **Técnica:** dá para construir com o que temos? | {alto, médio ou baixo} | {por quê; o que ainda não se sabe} |
| **Negócio:** funciona para o negócio (custo, prazo, risco)? | {alto, médio ou baixo} | {por quê; o que ainda não se sabe} |

## Alternativas e riscos

{Inclua sempre "não fazer nada" e "usar algo que já existe", além das opções levantadas.}

| Alternativa | Prós | Contras |
|---|---|---|
| {não fazer nada} | {prós resumidos} | {contras resumidos} |
| {usar algo existente} | {prós resumidos} | {contras resumidos} |
| {outra opção} | {prós resumidos} | {contras resumidos} |

**Riscos e dependências:**

- {risco ou dependência, com quem pode confirmar}

## Perguntas em aberto

{O que ainda precisa ser validado, com quem e como. Comece pelas hipóteses de importância alta e certeza baixa.}

- [ ] {pergunta} — quem responde: {pessoa ou área}

## Veredito

{Uma recomendação, não uma aprovação. Escolha uma e justifique em poucas linhas:}

- **proceed** (seguir): vale especificar. O problema parece real e não há lacuna crítica aberta
- **investigate_more** (investigar mais): há lacuna crítica; liste o que falta. Uma lacuna crítica nunca dá `proceed`
- **do_not_proceed** (não seguir): informe o motivo; o `status` passa a `cancelled` e o arquivo fica como registro da decisão

**Veredito:** {proceed | investigate_more | do_not_proceed}

**Motivo:** {justificativa}

## Próximo passo sugerido

{Sempre preencha, qualquer que seja o veredito. É só uma sugestão: o agente oferece usar este documento como insumo, mas nunca executa o comando sozinho, e você pode escolher outro caminho ou parar aqui.}

- **Comando recomendado:** {/prod.spec.prd (e depois /prod.spec.breakdown), /prod.spec.frd, /prod.spec.issue, retomar este discovery ou arquivar a ideia}
- **Motivo:** {por que esse caminho}
- **Alternativa:** {outro caminho possível, se houver}

## Histórico das sessões

{Um registro por sessão de entrevista, em ordem cronológica.}

| Data | O que foi coberto | Observações |
|---|---|---|
| {YYYY-MM-DD} | {temas cobertos nesta sessão} | {o que ficou pendente} |
