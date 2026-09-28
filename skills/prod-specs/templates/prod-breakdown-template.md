---
name: [Name from PRD]  
team: [Team Name]
created_at: [YYYY-MM-DD]
last_updated: [YYYY-MM-DD]  
---

## Resumo do plano detalhado (breakdown)

{3-4 frases: O que estamos construindo, Por que estamos construindo, como resolveremos isso e o impacto esperado}

---

## Relacionamento com entregas

```
Versão 1 {Período quando fornecido. Caso contrário, ignore este campo}
  ├── Epic 1.1 {Data quando fornecida. Caso contrário, ignore este campo}
  │ ├── História/Tarefa 1.1.1
  │ └── História/Tarefa 1.1.2
  └── Epic 1.2 {Data quando fornecida. Caso contrário, ignore este campo}
      ├── História/Tarefa 1.2.1
      └── História/Tarefa 1.2.2

Versão 2 {Período quando fornecido. Caso contrário, ignore este campo}
  ├── Epic 2.1 {Data quando fornecida. Caso contrário, ignore este campo}
  │ └── História/Tarefa 2.1.1
  └── Epic 2.2 {Data quando fornecida. Caso contrário, ignore este campo}
      └── História/Tarefa 2.2.1
```

{após criar esse relacionamento, pede para validar se o relacionamento está correto. Isso é importante para evitar erros no plano detalhado.}

---

## Lançamentos

### Versão 1: {Nome}

**Meta**: {O que esta versão alcança. Ponto de vista do usuário, sem detalhes técnicos.}  
**Épicos, histórias e tarefas incluídas nesta versão**:
- {Nome épico 1.1}
   - {História 1.1.1}
   - {História 1.1.2}
- {Nome épico 1.2}
   - {História 1.2.1}
   - {História 1.2.2}

**Dependências**:
- {escreva uma lista de dependências com base no produto de design e nas lacunas tecnológicas identificadas ou não fornecidas pelo usuário}

**Riscos e preocupações**:
- {escrever uma lista de riscos com base no design do produto e nas lacunas tecnológicas identificadas ou não fornecidas pelo usuário}

---

#### Épico 1.1: {Nome}

**Resultado entregue**: {O que esta entrega realiza}

**Expectativas do usuário**: {Como usuário, que valor esse épico oferece?}

**Histórias que contam este épico**:
1. {Título da história 1.1.1}
2. {Título da história 1.1.2}
3. {Título da história 1.1.3}

**Critérios de aceitação (nível épico)**:
- [ ] {Lista de critérios de alto nível. Este critério é usado para validar o épico e criar histórias detalhadas}

**Dias úteis**: {soma dos dias úteis úteis com base na velocidade ou prazo de entrega - se fornecido. Caso contrário, ignore este campo}

---

##### Épico 1.1.2: {Nome épico}

{Mesma estrutura do Epic 1.1.1}

---

### Versão 2: {Nome}

{Mesma estrutura da versão 1}

---

## Dependências e sequenciamento

### Caminho Crítico

```
Épico 1.1.1
   ↓
Épico 1.1.2 ──→ Épico 1.2.1
                   ↓
                Épico 2.1.1
```

### Matriz de Dependência
{se pedir para criar a matriz de dependência, crie-a. Caso contrário, ignore esta seção}

| Épico | Depende de | Blocos | Estado |
|------|------------|--------|--------|
| Épico 1.1.1 | - | Épico 1.1.2 | Não iniciado |
| Épico 1.1.2 | Épico 1.1.1 | Épico 1.2.1 | Não iniciado |
| Épico 1.2.1 | Épico 1.1.2 | Épico 2.1.1 | Não iniciado |

### Dependências Externas
{se pedir para criar as dependências externas, crie-as. Caso contrário, ignore esta seção}

- **{Dependência 1}**: {Descrição}
- **{Dependência 2}**: {Descrição}

---

## Gestão de Risco
{se pede para criar o gerenciamento de risco, crie. Caso contrário, ignore esta seção}

### Riscos de alto nível

| Risco | Impacto | Probabilidade | Mitigação | Proprietário | Estado |
|------|----|------------|------------|-------|--------|
| [Risco 1] | H/M/L | H/M/L | [Estratégia] | [Nome] | [Estado] |
| [Risco 2] | H/M/L | H/M/L | [Estratégia] | [Nome] | [Estado] |

### Planos de Contingência

**Se ocorrer [Risco 1]**:
1. [Ação 1]
2. [Ação 2]
3. [Opção substituta]

**Se ocorrer [Risco 2]**:
1. [Ação 1]
2. [Ação 2]
3. [Opção substituta]