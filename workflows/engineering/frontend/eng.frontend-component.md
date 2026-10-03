---
name: eng.frontend-component
description: >
  Workflow para criar ou refatorar um componente frontend com qualidade:
  análise de contexto, decisão entre componente compartilhado e local, implementação com
  acessibilidade e testes. Neutro de stack: o framework, as bibliotecas e as convenções
  vêm do projeto e das especializações registradas em FRONTEND_SPECIALIZATIONS.
author: jarvis-team
version: "1.1"

---

# Workflow: Criar ou Refatorar Componente Frontend

## Contexto

Use este workflow para garantir que todo componente frontend seja criado com
qualidade, acessibilidade, testes e no lugar correto (compartilhado vs local).

**Neutro de stack:** este workflow não presume framework, linguagem, biblioteca de estilos nem
estrutura de pastas. O que é específico da stack do projeto vem de:

1. O código existente (leia componentes parecidos antes de criar o seu)
2. Os arquivos de configuração do projeto (por exemplo, `package.json`, `go.mod`, `composer.json`, `pyproject.toml`)
3. As especializações registradas em `FRONTEND_SPECIALIZATIONS` no `ENV.md`

**Antes de começar**, aplique a regra `$IDE/rules/engineering/eng.specializations-rules.md` para a área **frontend**: ela carrega o skill base `eng-frontend` e as especializações registradas. Onde este workflow disser "conforme a especialização", siga o que o skill da especialização pedir; sem especialização registrada, siga as convenções do código existente e **pergunte ao usuário** o que faltar, sem inventar.

---

## Fase 1 — Análise

### 1.1 Entender o requisito

Antes de qualquer código, responder:

```
1. O componente será reutilizado em mais de um módulo, tela ou aplicação?
   → Sim → pertence à biblioteca de componentes compartilhados do projeto (se existir)
   → Não → pertence ao módulo onde será usado

2. Existe componente similar já criado?
   → Verificar a pasta de componentes compartilhados e a do módulo

3. Existe um primitivo ou componente pronto (da biblioteca de UI adotada pelo projeto) para este caso?
   → Modal, seleção, menu, dica de contexto, caixa de seleção → partir dele em vez de reescrever

4. Quais variantes são necessárias?
   → Levantar com design antes de implementar

5. Onde o componente é renderizado e como ele guarda estado?
   → Conforme a especialização: renderização no servidor ou no cliente, componente com ou sem estado local
```

### 1.2 Ler o código ao redor

Identifique onde ficam os componentes do projeto (pasta de componentes compartilhados e do módulo),
abra um componente similar e leia a configuração de estilos e de tokens de design, se existir.
Se não achar um padrão claro, pergunte ao usuário.

---

## Fase 2 — Implementação

### 2.1 Criar arquivos

Siga a **estrutura de pastas e a nomenclatura que o projeto já usa** (e a da especialização registrada).
Um componente costuma ter: o arquivo do componente, o arquivo de testes e, quando o projeto usa
documentação visual de componentes, o arquivo dessa documentação.

### 2.2 Checklist de implementação

#### Tipagem e contrato
- [ ] Entradas do componente (props, parâmetros ou atributos) tipadas ou documentadas, sem tipo genérico solto (`any` ou equivalente)
- [ ] Valores default explícitos para entradas opcionais
- [ ] Contrato público do componente exportado para uso externo, quando a linguagem permite

#### Tokens de design
- [ ] Cores via tokens do projeto, sem valor hardcoded (hex/rgb)
- [ ] Espaçamentos e tipografia via a escala do projeto
- [ ] Variantes organizadas do jeito que o projeto já faz, se o componente tem múltiplos estados visuais

#### Acessibilidade
- [ ] Semântica HTML correta (botão é botão, link é link, lista é lista)
- [ ] Rótulo acessível ou texto visível em elementos interativos sem texto
- [ ] Estados de foco visíveis (não remover o contorno)
- [ ] Navegação por teclado testada manualmente

#### Estados visuais
- [ ] Normal
- [ ] Hover
- [ ] Focus
- [ ] Disabled (se aplicável)
- [ ] Loading (se aplicável)
- [ ] Erro (se aplicável)
- [ ] Vazio (se aplicável, para listas/tabelas)

---

## Fase 3 — Testes

### 3.1 Testar comportamento, não implementação

Use a ferramenta de testes de interface que o projeto já adota (ou a da especialização registrada).
Foque no que o usuário vê e faz, não em detalhes internos:

```
✅ Verificar que o botão "Salvar" está desabilitado enquanto o formulário é inválido
❌ Verificar o valor de uma variável interna de estado
```

Prefira consultar elementos por papel e rótulo acessível (botão, campo, texto visível) em vez de
identificadores de teste, e use o identificador de teste só quando não houver alternativa acessível.

### Cobertura mínima obrigatória
- [ ] Renderização padrão (smoke test)
- [ ] Cada variante principal
- [ ] Estado de loading (se existir)
- [ ] Estado de erro (se existir)
- [ ] Interação principal (clique, mudança de valor, envio)
- [ ] Acessibilidade automatizada, se o projeto já tem ferramenta configurada

---

## Fase 4 — Documentação visual (apenas se o projeto usa)

Se o projeto mantém documentação visual dos componentes (um catálogo de componentes, por exemplo),
siga o padrão dele. Checklist geral:

- [ ] Documentação gerada ou escrita para o componente
- [ ] Controles ou exemplos para cada entrada variável
- [ ] Exemplo para cada variante
- [ ] Exemplo para estados especiais (loading, disabled, erro)
- [ ] Sem problemas de acessibilidade apontados pela ferramenta de documentação, quando ela verifica isso

---

## Fase 5 — Integração

### 5.1 Exportar do ponto de entrada correto

Exponha o componente pelo mesmo ponto de entrada que os demais componentes do projeto usam
(arquivo de índice da biblioteca compartilhada ou do módulo), seguindo o padrão existente.

### 5.2 Verificar responsividade

Teste nos tamanhos de tela que o projeto define. Se o projeto não define, confirme com o usuário;
como referência de partida: celular (375px), tablet (768px) e desktop (1280px).

---

## Checklist Final

- [ ] Componente no lugar correto (compartilhado vs local)
- [ ] Entradas tipadas ou documentadas, sem tipo genérico solto
- [ ] Tokens de design do projeto usados (sem hardcode)
- [ ] Estados visuais completos
- [ ] Acessibilidade: semântica + teclado + rótulos quando necessário
- [ ] Testes cobrindo comportamentos críticos
- [ ] Documentação visual criada (se o projeto usa)
- [ ] Exportado do ponto de entrada correto
- [ ] Responsivo nos tamanhos de tela do projeto
