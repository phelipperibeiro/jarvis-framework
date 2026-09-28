# RFC-[XXX] — [Título claro da decisão]

**Status:** Draft | In Review | Ready for Decision | Accepted | Rejected | Superseded  
**Criado em:** YYYY-MM-DD  
**Proponente:** [Nome]  
**Reviewers:** [TLs / Engineering Core / Especialistas]  
**Escopo:** [Squad(s) / Área(s) impactadas]  
**Relacionado a:** PRD-XXX | FRD-XXX (links)

---

## 1. Contexto e Problema

Descreva de forma **objetiva**:

- Qual problema ou oportunidade foi identificada  
- Onde isso acontece hoje  
- Qual dor técnica, operacional ou de negócio existe  

⚠️ **Não descreva solução técnica aqui.**

> Exemplo:  
> Hoje o processamento assíncrono depende de mensageria com concorrência fixa, gerando gargalos quando há picos desbalanceados entre fluxos.

---

## 2. Por que essa decisão é necessária agora?

Explique o **timing da decisão**:

- O que acontece se nada for feito?
- Qual risco estamos assumindo?
- O que mudou no contexto atual?

---

## 3. Objetivo da Decisão

Declare **explicitamente** o que precisa ser decidido.

> Exemplo:  
> Definir a estratégia de mensageria para processamento assíncrono para os próximos 12–24 meses.

---

## 4. Opções em Discussão

Liste **todas as alternativas reais**, mesmo que uma pareça óbvia.

### Opção A — [Nome curto]
- Descrição resumida
- Onde se aplica
- O que resolve

### Opção B — [Nome curto]
- Descrição resumida
- Onde se aplica
- O que resolve

### Opção C — [Opcional]

---

## 5. Trade-offs Comparativos

| Critério | Opção A | Opção B | Opção C |
|--------|--------|--------|--------|
| Complexidade | | | |
| Custo | | | |
| Escalabilidade | | | |
| Operação | | | |
| Alinhamento estratégico | | | |
| Risco | | | |

⚠️ Evite achismos. Use fatos, dados ou experiência prática sempre que possível.

---

## 6. Riscos e Pontos de Atenção

Liste riscos **independente da opção escolhida**:

- Riscos técnicos:
- Riscos operacionais:
- Riscos de custo:
- Riscos organizacionais (time, conhecimento, dependências):

---

## 7. Fora de Escopo

Declare explicitamente o que **não** está sendo decidido aqui.

> Exemplo:  
> Esta RFC não define detalhes de implementação, tuning fino ou cronograma.

---

## 8. Critérios para Tomada de Decisão

Liste os critérios que devem pesar mais na decisão final:

- Impacto sistêmico
- Alinhamento estratégico
- Capacidade do time
- Custo total no longo prazo
- Risco aceitável

---

## 9. Perguntas em Aberto

Liste dúvidas que **precisam ser respondidas antes do aceite**:

- ?
- ?

---

## 10. Decisão Final

*(Preenchido apenas quando o RFC for fechado)*

**Decisão:**  
☐ Aprovada  
☐ Aprovada com ressalvas  
☐ Rejeitada  

**Resumo da decisão:**  
[Explique claramente por que esta opção foi escolhida]

**Condições / Observações (se houver):**
-  

---

## 11. Próximos Passos

- [ ] Criar ARD correspondente  
- [ ] Planejar implementação  
- [ ] Definir métricas de validação (AVD)  

---

## 12. Histórico e Comentários

Registre aqui:
- Comentários relevantes
- Mudanças de entendimento
- Ajustes feitos ao longo da discussão

---

# ✅ Checklist de Revisão da RFC (Obrigatório)

Este checklist deve ser revisado **antes de mover a RFC para `Ready for Decision`**.

### Clareza do Problema
- [ ] O problema está claramente descrito sem propor solução?
- [ ] O impacto técnico ou de negócio está explícito?
- [ ] O motivo do timing está claro?

### Qualidade da Decisão
- [ ] O objetivo da decisão está explícito?
- [ ] Existem alternativas reais listadas?
- [ ] Os trade-offs estão comparados de forma honesta?
- [ ] Riscos relevantes foram identificados?

### Escopo e Governança
- [ ] O fora de escopo está claramente definido?
- [ ] Esta decisão realmente precisa de RFC segundo o playbook?
- [ ] As squads impactadas estão listadas?

### Processo
- [ ] PRD e/ou FRD existem e estão linkados (quando aplicável)?
- [ ] Os reviewers corretos foram envolvidos?
- [ ] Comentários foram registrados no documento (não em chats)?
- [ ] Não existe implementação iniciada antes do aceite?

### Pronta para Decisão
- [ ] Informação suficiente para decidir?
- [ ] Decisor correto identificado (Head / Core / CTO)?
- [ ] Não existem dúvidas estruturais em aberto?

---

### 🧠 Lembretes Culturais

- Se você já sabe **como** implementar, isso não é RFC.  
- Se ainda existem alternativas relevantes, isso **é** RFC.  
- Decisões importantes não acontecem fora deste documento.

---

## Convenções

- Uma RFC = **uma decisão principal**
- RFCs são numeradas sequencialmente (RFC-001, RFC-002, …)
- Decisões estratégicas podem gerar mais de um ARD
