# Versão: 1.0

Escopo: Engineering Core e Squads.

Objetivo: Alinhar a criação de soluções de acordo com a visão de Tencologia. Este playbook é um artefato vivo e pode evoluir conforme a maturidade da engenharia.

## Objetivo

Este playbook define **como RFCs são usados na prática**, quais são os **papéis, responsabilidades, expectativas e regras** para garantir:

* Uso eficiente de energia do time
* Decisões técnicas claras
* Menos retrabalho
* Governança sem burocracia
* Escalabilidade do processo de engenharia

\
RFC neste contexto **não é um documento de ideia** e **não é uma etapa isolada**. RFC é o **fio condutor da decisão**, do problema até a aprovação técnica.


---

## O que é um RFC (no nosso modelo)

RFC é um **container vivo de decisão técnica**, que:

* Pode ser aberto e evoluir junto com PRD e FRD se for necessário
* Não decide nada no início
* Só é fechado após maturidade suficiente de PRD e FRD para permitir uma decisão consciente
* Registra comentários, trade-offs e a decisão final


---

## Visão Geral do Fluxo

```none
[Ideia ou problema]
↓
RFC (Draft — aberto)
↓
PRD (visão de produto)
↓
FRD (comportamento funcional)
↓
RFC (review + convergência + decisão)
↓
ARD (arquitetura)
↓
Implementação
↓
AVD (validação pós-implementação)
```

---

## Estados do RFC e significado

| Status | Significado | Energia esperada |
|----|----|----|
| Draft | Investigação inicial | Muito baixa |
| In Review | PRD/FRD existem | Baixa |
| Ready for Decision | Marcar agenda para apresentar o documento final | Média |
| Accepted | Autorizado a implementar | Alta |
| Rejected | Decisão de não seguir | Encerrada |
| Superseded | Substituído | Encerrada |


---

## Papéis e Responsabilidades

### 1. Proponente (Dev, TL, PM, etc.)

**Responsabilidades**

* Detectar o problema ou oportunidade
* Abrir o RFC em status `Draft`
* Garantir que o PRD já esteja criado
* Manter o RFC atualizado com links corretos

**O que NÃO é esperado**

* Propor solução técnica cedo
* Defender arquitetura
* Forçar aprovação


---

### 2. Produto (PM / PO)

**Responsabilidades**

* Validar o problema e a hipótese
* Garantir clareza do PRD
* Ajudar a definir escopo e fora de escopo
* Alinhar indicadores de sucesso

**O que NÃO é esperado**

* Definir stack
* Influenciar decisões técnicas


---

### 3. Engenharia 

**Responsabilidades**

* Avaliar viabilidade técnica
* Avaliar e contemplar todos os documentos PRD/FRD
* Explicitar trade-offs e riscos
* Referenciar corretamente o RFC

**O que NÃO é esperado**

* Decidir sozinho
* Começar implementação sem RFC Accepted


---

### 4. Reviewers (TLs / Engineering Core)

**Responsabilidades**

* Ler o RFC
* Comentar no RFC na ferramenta selecionada (não em chats ou meets soltos)
* Avaliar riscos, custos, escalabilidade e operação e alinhamento estratégico
* Ajudar a amadurecer a decisão
* Ver o vinculo com os OKRs que estão sendo executados no quarter

**O que NÃO é esperado**

* Redesenhar solução sem base
* Trazer opiniões sem leitura prévia


---

### 5. Decisores (TL / Core / Head / CTO)

**Responsabilidades**

* Avaliar o conjunto (RFC)
* Tomar decisão explícita
* Registrar condições, se houver
* Fechar o RFC

**O que NÃO é esperado**

* Decidir sem artefatos
* Reabrir discussões após aceite


---

## Regras de Ouro (não negociáveis)

* ❌ RFC não pode ser Accepted sem clareza arquitetural suficiente
* ❌ Implementação não começa sem RFC `Accepted`
* ❌ Decisões não acontecem em chats privados
* ✅ RFC pode permanecer aberta enquanto PRD e FRD evoluem
* ✅ Energia investida cresce conforme maturidade


---

## Boas Práticas

* RFC curto e objetivo
* Comentários registrados no RFC
* Decisão explícita sempre
* Trade-offs documentados
* Pendências com owner e prazo
* Se você já sabe o “como”, não é RFC.
* Se você ainda discute alternativas, é RFC.
* Se durante a elaboração de um ARD surgir uma dúvida estrutural ou alternativa relevante, o ARD deve ser pausado e a discussão movida novamente para a RFC.


---

## Anti-Padrões (evitar)

* RFC como brainstorm
* RFC como checklist burocrático
* RFC aprovado “no verbal”
* Arquitetura decidida antes do ARD
* Implementação iniciada sem aceite


---

## Lembretes Culturais

* Se você já sabe **como** implementar, isso não é RFC.
* Se ainda existem alternativas relevantes, isso **é** RFC.
* Decisões importantes não acontecem fora deste documento.


---

## Quando uma RFC é obrigatória (regra de ouro)

RFC **não é para tudo**. Uma RFC é **obrigatória** se **qualquer** item abaixo for verdadeiro:

### Critérios objetivos (use como checklist)

* Impacta **mais de uma squad**
* Altera **arquitetura**, **padrões técnicos** ou **infra**
* Introduz **nova dependência crítica** (serviço, lib, vendor)
* Afeta **custo recorrente** (cloud, APIs, licenças)
* Muda **SLA, SLO ou contratos técnicos**
* Pode gerar **lock-in** ou dívida técnica relevante
* Envolve **dados sensíveis / compliance**
* Vai virar **padrão reutilizável**

### Não exige RFC:

* Refactors locais
* Correções pontuais
* Features isoladas sem impacto sistêmico

\
## Passo a Passo para apertura de um RFC

### 🧩 Passo 1 — Criação da RFC

**Quem cria:**

* TL, Staff, Principal, Head ou qualquer dev **que proponha a mudança**

**Onde:**

* Repositório único na Wiki
* Seguir o template estabelecido `RFC-template.md`

**Formato:**

* Markdown
* ID sequencial: RFC-001, RFC-002, etc.

**Status inicial:** Draft


---

### 🧩 Passo 2 — Divulgação obrigatória

A RFC **não vale se ninguém souber que ela existe**.

**Checklist mínimo:**

* Link compartilhado no Slack (#tech-rfcs)
* Menção aos revisores obrigatórios
* Data limite para comentários (ex: D+5)

Exemplo de mensagem padrão no Slack:

> 📄 Nova RFC aberta: RFC-023 — Redistribuição dinâmica de concorrência\nComentários até: 10/11\nRevisores: @plataforma @backend @infra


---

### 🧩 Passo 3 — Discussão assíncrona (regra crítica)

**Regras claras:**

* Comentários **no documento**, não no privado
* Opiniões **com argumento técnico**
* Discordância é esperada e desejada

**Anti-padrões proibidos:**

* Decidir tudo em call fechada
* “Já implementamos, depois documentamos”
* Aprovação sem leitura


---

### 🧩 Passo 4 — Decisão formal

Após o prazo:

* O **dono da RFC** consolida os comentários
* Registra a decisão final no próprio documento

Possíveis decisões:

* ✅ Aprovada
* ⚠️ Aprovada com ressalvas
* ❌ Rejeitada
* 🔄 Retornar para ajustes

⚠️ **Regra importante**\nDecisão **sempre documentada**, mesmo se for “não vamos fazer”.


---

### 🧩 Passo 5 — Gate para implementação

Regra simples e poderosa:

> ❌ **Não existe implementação relevante sem RFC aprovada**

Tecnicamente:

* Link da RFC vira **pré-requisito do ARD**
* PRs grandes devem referenciar a RFC


## Conclusão

> RFC existe para **proteger o time de  fazer implementações eficientes**

Seguir este playbook garante:

* Menos desgaste
* Menos retrabalho
* Mais clareza
* Decisões escaláveis

