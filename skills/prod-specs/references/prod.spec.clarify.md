---
name: prod.spec.clarify
description: Identificar áreas subespecificadas na especificação da feature atual fazendo até 5 perguntas de esclarecimento altamente direcionadas e incorporando as respostas de volta na spec.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: gpt-4o
model_tier: medium
model_justification: Esclarecimento de specs requer análise estruturada e formulação de perguntas, mas segue processo bem definido
---

## Clarify workflow

Detectar e reduzir ambiguidades ou pontos de decisão ausentes na especificação da feature ativa e registrar os esclarecimentos diretamente no arquivo da spec.

Observação: Este workflow de esclarecimento deve ser executado (e concluído) ANTES da etapa de planejamento. Se o usuário declarar explicitamente que está pulando o esclarecimento (por exemplo, spike exploratório), você pode prosseguir, mas deve avisar que o risco de retrabalho posterior aumenta.

Utilize o que o usuário fornecer analisar em:
<requirement>
#$ARGUMENTS
</requirement>

Etapas de execução:

1. Carregue o arquivo atual da spec. Realize uma varredura estruturada de ambiguidades e cobertura usando esta taxonomia. Para cada categoria, marque o status: Claro / Parcial / Ausente. Produza um mapa de cobertura interno usado para priorização (não divulgue o mapa bruto a menos que nenhuma pergunta seja feita). Analise o arquivo da spec e realize uma cobertura apenas com os itens que estão incluídos na especificação do usuário.

Ao final do processo, peça ao usuário para confirmar o esclarecimento e liste os itens ausentes, perguntando se ele quer esclarecê-los.

Escopo Funcional & Comportamento:
- Principais objetivos do usuário & critérios de sucesso
- Declarações explícitas de fora de escopo
- Diferenciação de papéis / personas dos usuários

Domínio & Modelo de Dados:
- Entidades, atributos, relacionamentos
- Regras de identidade & unicidade
- Transições de ciclo de vida/estado
- Suposições de volume de dados / escala

Interação & Fluxo de UX:
- Jornadas / sequências críticas do usuário
- Estados de erro/vazio/carregamento
- Observações de acessibilidade ou localização

Atributos de Qualidade Não Funcionais:
- Desempenho (latência, metas de throughput)
- Escalabilidade (horizontal/vertical, limites)
- Confiabilidade & disponibilidade (expectativas de uptime e recuperação)
- Observabilidade (logging, métricas, sinais de tracing)
- Segurança & privacidade (authN/Z, proteção de dados, suposições de ameaça)
- Restrições de compliance / regulatórias (se houver)

Integração & Dependências Externas:
- Serviços/APIs externos e modos de falha
- Formatos de importação/exportação de dados
- Suposições de protocolo/versionamento

Casos Limite & Tratamento de Falhas:
- Cenários negativos
- Rate limiting / throttling
- Resolução de conflitos (por exemplo, edições simultâneas)

Restrições & Trade-offs:
- Restrições técnicas (linguagem, armazenamento, hospedagem)
- Trade-offs explícitos ou alternativas rejeitadas

Terminologia & Consistência:
- Termos de glossário canônicos
- Sinônimos evitados / termos obsoletos

Sinais de Conclusão:
- Testabilidade dos critérios de aceitação
- Indicadores mensuráveis de Definition of Done

Diversos / Placeholders:
- Marcadores TODO / decisões não resolvidas
- Adjetivos ambíguos (“robusto”, “intuitivo”) sem quantificação

Para cada categoria com status Parcial ou Ausente, adicione uma oportunidade de pergunta candidata, a menos que:
- O esclarecimento não altere materialmente a estratégia de implementação ou validação
- A informação seja melhor postergada para a fase de planejamento (anote internamente)

3. Gere (internamente) uma fila priorizada de perguntas de esclarecimento candidatas (máximo de 5). IMPORTANTE: Não as apresente todas de uma vez. Aplique estas restrições:
   - Máximo de 10 perguntas no total ao longo de toda a sessão.
   - Cada pergunta deve ser respondida COM:
      - Uma seleção curta de múltipla escolha (2–5 opções distintas, mutuamente exclusivas), OU
      - Uma resposta de uma palavra / frase curta (restrinja explicitamente: “Responda em <=5 palavras”).
   - Inclua apenas perguntas cujas respostas impactem materialmente arquitetura, modelagem de dados, decomposição de tarefas, design de testes, comportamento de UX, prontidão operacional ou validação de compliance.
   - Garanta equilíbrio de cobertura por categoria: tente cobrir primeiro as áreas não resolvidas de maior impacto; evite fazer duas perguntas de baixo impacto quando uma área de alto impacto (por exemplo, postura de segurança) está sem resolução.
   - Exclua perguntas já respondidas, preferências estilísticas triviais ou detalhes de execução de planejamento (a menos que bloqueiem a correção).
   - Priorize esclarecimentos que reduzam risco de retrabalho posterior ou evitem testes de aceitação desalinhados.
   - Se mais de 5 categorias permanecerem sem resolução, selecione as 5 principais pelo critério heurístico (Impacto * Incerteza).

4. Loop de questionamento sequencial (interativo):
    - Apresente EXATAMENTE UMA pergunta por vez.
    - Se estivermos esclarecendo um PRD, não pergunte sobre microinterações. Deixe para esclarecer microinteração apenas na fase de criação de histórias e tarefas.
    - Para perguntas de múltipla escolha:
       - **Analise todas as opções** e determine a **opção mais adequada** com base em:
          - Melhores práticas para o tipo de projeto
          - Padrões comuns em implementações similares
          - Redução de risco (segurança, desempenho, manutenibilidade)
          - Alinhamento com quaisquer metas ou restrições explícitas do projeto visíveis na spec
       - Apresente a **opção recomendada** de forma destacada no topo com uma explicação clara (1-2 frases explicando por que é a melhor escolha).
       - Formate como: `**Recomendado:** Opção [X] - <justificativa>`
       - Em seguida, renderize todas as opções em uma tabela Markdown:

       | Option | Description |
       |--------|-------------|
       | A | <Descrição da Opção A> |
       | B | <Descrição da Opção B> |
       | C | <Descrição da Opção C> (adicione D/E conforme necessário até 5) |
       | Short | Forneça uma resposta curta diferente (<=5 palavras) (Inclua somente se alternativa livre fizer sentido) |

       - Após a tabela, adicione: `Você pode responder com a letra da opção (por exemplo, "A"), aceitar a recomendação dizendo "sim" ou "recomendado", ou fornecer sua própria resposta curta.`
    - Para perguntas de resposta curta (sem opções discretas significativas):
       - Forneça sua **resposta sugerida** com base nas melhores práticas e no contexto.
       - Formate como: `**Sugerido:** <sua resposta proposta> - <breve justificativa>`
       - Depois, escreva: `Formato: Resposta curta (<=5 palavras). Você pode aceitar a sugestão dizendo "sim" ou "sugerido", ou fornecer sua própria resposta.`
    - Após o usuário responder:
       - Se o usuário responder com “sim”, “recomendado” ou “sugerido”, use a recomendação/sugestão previamente apresentada como resposta.
       - Caso contrário, valide se a resposta corresponde a uma opção ou se respeita a restrição de <=5 palavras.
       - Se estiver ambígua, peça um rápido esclarecimento (conta ainda como a mesma pergunta; não avance).
       - Assim que estiver satisfatória, registre-a na memória de trabalho (ainda sem gravar em disco) e avance para a próxima pergunta enfileirada.
    - Pare de fazer perguntas adicionais quando:
       - Todas as ambiguidades críticas forem resolvidas cedo (itens restantes na fila tornam-se desnecessários), OU
       - O usuário sinalizar conclusão (“done”, “good”, “no more”), OU
       - Você atingir 5 perguntas realizadas.
    - Nunca revele previamente perguntas futuras na fila.
    - Se não houver perguntas válidas no início, relate imediatamente que não existem ambiguidades críticas.

5. Integração após CADA resposta aceita (abordagem de atualização incremental):
    - Mantenha uma representação em memória da spec (carregada uma única vez no início) além do conteúdo bruto do arquivo.
    - Para a primeira resposta integrada nesta sessão:
       - Garanta que exista uma seção `## Clarifications` (crie-a logo após a seção contextual/de visão geral de nível mais alto conforme o template da spec, se estiver ausente).
       - Sob ela, crie (se não existir) um subtítulo `### Session YYYY-MM-DD` para hoje.
    - Acrescente imediatamente após a aceitação um item em bullet: `- Q: <pergunta> → A: <resposta final>`.
    - Em seguida, aplique a clarificação diretamente nas seções mais apropriadas:
       - Ambiguidade funcional → Atualize ou adicione um bullet em Requisitos Funcionais.
       - Interação do usuário / distinção de atores → Atualize a subseção de Histórias de Usuário ou Atores (se existir) com o papel, restrição ou cenário esclarecido.
       - Forma de dados / entidades → Atualize o Modelo de Dados (adicione campos, tipos, relacionamentos) preservando a ordem; registre restrições adicionadas de forma sucinta.
       - Restrição não funcional → Adicione/modifique critérios mensuráveis na seção de Não Funcionais / Atributos de Qualidade (converta adjetivos vagos em métricas ou metas explícitas).
       - Caso limite / fluxo negativo → Acrescente um novo bullet em Casos Limite / Tratamento de Erros (ou crie tal subseção se o template tiver placeholder).
       - Conflito de terminologia → Normalize o termo na spec; mantenha o original apenas se necessário adicionando `(anteriormente referido como "X")` uma única vez.
    - Se o esclarecimento invalidar uma afirmação ambígua anterior, substitua essa afirmação em vez de duplicá-la; não deixe texto contraditório.
    - Salve o arquivo da spec APÓS cada integração para minimizar risco de perda de contexto (sobrescrita atômica).
    - Preserve a formatação: não reordene seções não relacionadas; mantenha a hierarquia de headings intacta.
    - Mantenha cada clarificação inserida mínima e testável (evite desvio narrativo).

6. Validação (executada após CADA escrita e no passe final):
   - A sessão de clarificações contém exatamente um bullet por resposta aceita (sem duplicatas).
   - Total de perguntas feitas (aceitas) ≤ 5.
   - Seções atualizadas não contêm placeholders vagos remanescentes que a nova resposta deveria resolver.
   - Nenhuma afirmação anterior contraditória permanece (verifique se alternativas agora inválidas foram removidas).
   - Estrutura Markdown válida; únicos headings novos permitidos: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Insira as sessões de esclarecimento após o bloco de Requisitos.
   - Consistência de terminologia: mesmo termo canônico usado em todas as seções atualizadas.

7. Escreva a spec atualizada de volta em `FEATURE_SPEC`.

8. Informe a conclusão (após o término do loop de perguntas ou encerramento antecipado):
   - Número de perguntas feitas & respondidas.
   - Caminho para a spec atualizada.
   - Seções tocadas (liste os nomes).
   - Tabela de resumo de cobertura listando cada categoria da taxonomia com Status: Resolvido (era Parcial/Ausente e foi tratada), Adiado (excede a cota de perguntas ou melhor tratar no planejamento), Claro (já estava suficiente), Pendente (ainda Parcial/Ausente mas de baixo impacto).
   - Se restarem itens Pendentes ou Adiados, recomende prosseguir para `/product/prod.spec.plan.md` ou rodar `/product/prod.spec.clarify.md` novamente após o planejamento.
   - Próximo comando sugerido.

Regras de comportamento:

- Se nenhuma ambiguidade significativa for encontrada (ou se todas as perguntas potenciais forem de baixo impacto), responda: “Nenhuma ambiguidade crítica detectada que valha esclarecimento formal.” e sugira prosseguir.
- Se o arquivo da spec estiver ausente, instrua o usuário a rodar `/product/prod.spec.md` primeiro (não crie uma nova spec aqui).
- Nunca exceda 5 perguntas feitas no total (reformulações de uma mesma pergunta não contam como novas).
- Evite perguntas especulativas sobre stack tecnológica, a menos que a ausência bloqueie a clareza funcional.
- Respeite sinais de encerramento antecipado do usuário (“stop”, “done”, “proceed”).
- Se nenhuma pergunta for feita devido à cobertura completa, forneça um resumo de cobertura compacto (todas as categorias Claras) e sugira avançar.
- Se a cota for atingida com categorias de alto impacto ainda não resolvidas, destaque-as explicitamente como Adiadas com a justificativa.

