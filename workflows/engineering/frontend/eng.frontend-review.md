---
name: eng.frontend-review
description: >
  Workflow de revisão de código específico para PRs frontend: tipagem, tokens de design,
  acessibilidade, performance e testes. Neutro de stack: a linguagem, o framework e as
  convenções vêm do projeto e das especializações registradas em FRONTEND_SPECIALIZATIONS.
  Complementa o eng.review genérico com checklist frontend aprofundado.
author: jarvis-team
version: "1.1"

---

# Workflow: Revisão de Código Frontend

## Contexto

Use este workflow ao revisar PRs que envolvem componentes, estilos, estado ou qualquer
código de interface.

**Neutro de stack:** os itens abaixo valem para qualquer stack de frontend. Onde o item depende
da stack (por exemplo, como se busca dados ou como se organiza um módulo), a referência é a
especialização registrada em `FRONTEND_SPECIALIZATIONS` e o código existente do projeto.

**Antes de revisar**, aplique a regra `$IDE/rules/engineering/eng.specializations-rules.md` para a área **frontend**: ela carrega o skill base `eng-frontend` e as especializações registradas. Se o PR tiver exigências que você não consegue verificar sem conhecer a stack, diga isso na revisão em vez de presumir.

---

## Como usar

Execute para um PR específico ou para um conjunto de arquivos:

```bash
# Listar os arquivos alterados no PR
git diff origin/main...HEAD --name-only

# Ler cada arquivo de interface alterado (componentes, estilos, testes) antes de revisar
```

---

## Checklist de Revisão

### 1. Tipagem e contratos

Aplica-se quando a linguagem do projeto tem tipagem estática ou contratos explícitos.

- [ ] Sem tipo genérico solto (`any` ou equivalente) não documentado
- [ ] Sem supressão de verificação de tipos sem comentário explicativo
- [ ] Sem asserção de "não nulo" sem verificação prévia
- [ ] Contrato (entradas e saídas) exportado para componentes públicos
- [ ] Modo estrito de verificação do projeto não relaxado

---

### 2. Componentes

- [ ] Responsabilidade única — o componente faz uma coisa só
- [ ] Sem lógica de negócio acoplada ao componente de UI
- [ ] Sem busca de dados direto no componente de apresentação (usar a camada que o projeto adota para isso)
- [ ] Estados visuais tratados: loading, erro, vazio

**Perguntas a fazer no review:**
- "Este componente pertence à biblioteca compartilhada ou ao módulo onde está?"
- "Existe componente similar compartilhado que poderia ser usado?"
- "Esta lógica deveria estar numa camada separada da interface?"

---

### 3. Tokens de design

- [ ] Cores via tokens do projeto (sem `#hex`, `rgb()`, `hsl()` soltos)
- [ ] Espaçamentos e tipografia via a escala do projeto (sem valores fixos inline)
- [ ] Componentes reutilizáveis criados no lugar compartilhado, não duplicados por módulo
- [ ] Variantes organizadas do jeito que o projeto já faz (não condicionais de estilo espalhadas)

**Flag de atenção:**
```bash
grep -n "#[0-9a-fA-F]\{3,6\}\|rgb(" {arquivo}
```

---

### 4. Acessibilidade

- [ ] Semântica HTML correta (botão para ações, link para navegação)
- [ ] Imagens com texto alternativo (informativas: descritivo; decorativas: vazio)
- [ ] Formulários: rótulo associado a cada campo
- [ ] Erros de formulário anunciados a tecnologias assistivas (por exemplo, `role="alert"` ou `aria-live`)
- [ ] Elementos interativos são navegáveis por teclado
- [ ] Foco visível — contorno não removido sem substituto

**Flag de atenção:**
```bash
grep -n "outline-none\|outline: none\|tabindex=\"-1\"\|tabIndex" {arquivo}
# Contorno removido em elementos interativos sem alternativa de foco visível
```

---

### 5. Performance

- [ ] Dados buscados pela camada que o projeto adota para isso (conforme a especialização), não por efeitos colaterais soltos no componente
- [ ] Carregamento tardio em componentes pesados, quando o projeto tem suporte
- [ ] Dependências novas justificadas (avaliar impacto no tamanho do pacote final)
- [ ] Otimização de renderização só onde necessário e comprovado por medição
- [ ] Imagens com largura e altura definidas

**Perguntas a fazer:**
- "Este componente precisa ser renderizado no cliente, ou funciona renderizado no servidor?" (se a stack tiver essa distinção)
- "Esta dependência nova já está no pacote final ou é nova?"

---

### 6. Itens específicos da stack

Para cada especialização registrada em `FRONTEND_SPECIALIZATIONS`, aplique o checklist de revisão
do próprio skill dela (por exemplo, regras de arquitetura distribuída, de biblioteca de componentes
ou de roteamento). Se não houver especialização registrada, esta seção não se aplica.

---

### 7. Testes

- [ ] Testes para o happy path
- [ ] Testes para estado de erro
- [ ] Consultas por papel e rótulo acessível, não por detalhes de implementação
- [ ] Identificador de teste só quando não há alternativa acessível
- [ ] Sem ajustes manuais de sincronização desnecessários

---

### 8. Código Geral

- [ ] Sem log de depuração commitado
- [ ] Sem `TODO` sem issue associada
- [ ] Seguindo convenções de nomenclatura do projeto

```bash
grep -n "console\.log\|console\.error\|console\.warn" {arquivo}
# Ajuste o padrão para a função de log de depuração da linguagem do projeto
```

---

## Classificação do Feedback

Use prefixos para clareza no review:

```
[bloqueante]  — deve ser resolvido antes do merge
[sugestão]    — melhoria não obrigatória, mas recomendada
[dúvida]      — pergunta para entender melhor a decisão
[elogio]      — destacar o que foi bem feito
```

---

## Output do Review

```
## Review Frontend — {título do PR}

### Resumo
{1-3 linhas: qual é a mudança e qual o impacto geral}

### Pontos de atenção
{lista dos [bloqueante] encontrados}

### Sugestões
{lista dos [sugestão]}

### Dúvidas
{lista dos [dúvida]}

### Veredicto
[ ] Aprovado
[ ] Aprovado com ressalvas (sugestões não bloqueantes)
[ ] Mudanças necessárias (bloqueantes listados acima)
```
