<!-- Formato de cada subtarefa — /eng.breakdown-subtasks. Preencha todas as seções; uma seção destas por subtarefa, separadas por ---. Regras (independência, granularidade, prefixos): rules-on-demand/engineering/eng.breakdown-subtasks-rules.md -->

# Subtarefa N: [STACK] Título descritivo da subtarefa

**Depende de:** Subtarefa X (ou "nenhuma")
**Desbloqueia:** Subtarefa Y (ou "nenhuma")
**Paralela com:** Subtarefa Z (ou "nenhuma")

## 🎯 O Que Você Vai Fazer

{Descrição em 2-3 frases do objetivo final desta subtarefa. O que o desenvolvedor terá ao finalizar?}

---

## 📋 Contexto da Tarefa

### Por que isso é necessário?
{Explique o motivo de negócio ou técnico para esta subtarefa existir}

### Onde isso se encaixa?
{Explique como esta subtarefa se conecta com as outras e com a funcionalidade final}

### Pré-requisitos
- [ ] {Subtarefa anterior concluída, se houver}
- [ ] {Ambiente configurado, se necessário}
- [ ] {Acesso a recursos específicos, se necessário}

---

## 🛠️ Stack Técnico

| Tecnologia | Versão/Especificação | Para que será usada |
|------------|---------------------|---------------------|
| {Tech 1} | {versão} | {propósito} |
| {Tech 2} | {versão} | {propósito} |

### Padrões do Projeto a Seguir
- **Nomenclatura**: {padrão de nomes usado no projeto}
- **Estrutura de pastas**: {onde os arquivos devem ficar}
- **Convenções de código**: {eslint rules, prettier, etc}

### Arquivos de Referência (COPIE O PADRÃO)
- `{caminho/arquivo-similar.ts}` - Use como base para {o quê}
- `{caminho/outro-arquivo.ts}` - Copie a estrutura de {o quê}

---

## 📁 Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `{caminho/arquivo1.ts}` | 🆕 Criar | {O que este arquivo fará} |
| `{caminho/arquivo2.ts}` | ✏️ Modificar | {O que será alterado e por quê} |
| `{caminho/arquivo3.spec.ts}` | 🆕 Criar | Testes para {o quê} |

---

## 👣 Passo a Passo de Implementação

### Passo 1: {Título descritivo}

**O que fazer:**
{Explicação detalhada do que fazer neste passo}

**Código:**
```{language}
// {caminho/do/arquivo.ts}

{código completo ou estrutura esperada}
```

**Explicação do código:**
- Linha X: {explica o que faz e por quê}
- Linha Y: {explica o que faz e por quê}

**Validação deste passo:**
- [ ] {Como verificar se este passo está correto}

---

### Passo 2: {Título descritivo}

**O que fazer:**
{Explicação detalhada}

**Código:**
```{language}
// {caminho/do/arquivo.ts}

{código completo}
```

**Explicação do código:**
- {explicações linha a linha das partes importantes}

**Validação deste passo:**
- [ ] {Como verificar se está correto}

---

### Passo 3: {Continue quantos passos forem necessários}

...

---

## 🧪 Testes Obrigatórios

### Arquivo de teste: `{caminho/do/arquivo.spec.ts}`

```{language}
// {caminho/do/arquivo.spec.ts}

{código completo dos testes com todos os cenários}
```

### Cenários a Testar

| Cenário | Input | Output Esperado | Já implementado? |
|---------|-------|-----------------|------------------|
| {cenário 1} | {input} | {output} | [ ] |
| {cenário 2} | {input} | {output} | [ ] |
| {cenário de erro 1} | {input inválido} | {erro esperado} | [ ] |

### Como Executar os Testes
```bash
{comando para rodar os testes específicos desta subtarefa}
```

---

## ✅ Checklist de Conclusão

Antes de marcar como concluída, verifique:

### Implementação
- [ ] Código implementado conforme os passos acima
- [ ] Nenhum `console.log` de debug deixado no código
- [ ] Nenhum `TODO` ou `FIXME` sem issue linkada
- [ ] Imports organizados e sem imports não utilizados
- [ ] Tipagem TypeScript completa (sem `any`)

### Qualidade
- [ ] Testes unitários passando
- [ ] Testes de integração passando (se aplicável)
- [ ] Linter sem erros (`npm run lint`)
- [ ] Build sem erros (`npm run build`)

### Documentação
- [ ] Comentários em código complexo
- [ ] JSDoc em funções públicas
- [ ] README atualizado (se necessário)

### Revisão
- [ ] Auto-revisão do código feita
- [ ] PR criado com descrição clara
- [ ] Screenshots/vídeos anexados (se UI)

---

## ⚠️ Riscos e Cuidados

| Risco | Probabilidade | Impacto | Como Evitar |
|-------|---------------|---------|-------------|
| {risco 1} | Alta/Média/Baixa | Alto/Médio/Baixo | {mitigação} |
| {risco 2} | ... | ... | ... |

### Armadilhas Comuns (NÃO faça isso!)
- ❌ {Erro comum 1 e por que é errado}
- ❌ {Erro comum 2 e por que é errado}

### Dicas de Implementação
- 💡 {Dica útil 1}
- 💡 {Dica útil 2}

---

## 🔗 Dependências

### Esta subtarefa depende de:
- `[{STACK}] {Nome da subtarefa anterior}` - {O que você precisa que esteja pronto}

### Subtarefas que dependem desta:
- `[{STACK}] {Nome da próxima subtarefa}` - {O que será desbloqueado}

### Pode ser feita em paralelo com:
- `[{STACK}] {Nome de subtarefa paralela}` - {Por que não há dependência}

---

## 📚 Referências

### Documentação Oficial
- [{Nome da doc}]({link}) - {Para que usar}

### Arquivos de Exemplo no Projeto
- `{caminho/arquivo-exemplo.ts}` - {O que copiar daqui}

### Tech Spec Relacionada
- Seção {X.Y} da Tech Spec: {link ou referência}

---

## 🆘 Precisa de Ajuda?

Se travar em algum ponto:

1. **Revise os arquivos de referência** listados acima
2. **Consulte a Tech Spec** seção {relevante}
3. **Pergunte no Slack** canal #{canal} mencionando @{pessoa}
4. **Documentação**: {links úteis}
