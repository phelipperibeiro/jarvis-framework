---
name: eng.frontend-perf-audit
description: >
  Workflow de auditoria de performance frontend: Core Web Vitals, análise do pacote entregue,
  renderização desnecessária e oportunidades de otimização. Neutro de stack: ferramentas e
  técnicas específicas vêm do projeto e das especializações registradas em FRONTEND_SPECIALIZATIONS.
author: jarvis-team
version: "1.1"

---

# Workflow: Auditoria de Performance Frontend

## Contexto

Use este workflow para investigar problemas de performance, auditar uma feature antes
do deploy ou planejar otimizações em uma aplicação frontend.

**Neutro de stack:** as métricas (Core Web Vitals) e o método (medir, diagnosticar, otimizar,
medir de novo) valem para qualquer frontend. O que depende da stack (como analisar o pacote
entregue, como medir renderizações, qual técnica de carregamento tardio usar) vem do código do
projeto e das especializações registradas em `FRONTEND_SPECIALIZATIONS`.

**Antes de começar**, aplique a regra `$IDE/rules/engineering/eng.specializations-rules.md` para a área **frontend**: ela carrega o skill base `eng-frontend` e as especializações registradas. Onde este workflow disser "conforme a especialização", siga o skill da especialização; sem especialização registrada, **pergunte ao usuário** qual ferramenta o projeto usa, em vez de presumir uma.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Contexto (antes de começar) | `/eng-frontend` (via `eng.specializations-rules.md`) | Sempre — a regra carrega o skill base da área frontend |
| Contexto (antes de começar) | `skills em FRONTEND_SPECIALIZATIONS` (um por item da lista) | Se houver especialização registrada em `FRONTEND_SPECIALIZATIONS` no ENV.md; lista vazia: só o skill base |
| Fase 3 — Otimizações (arquitetura distribuída) | `skill da especialização registrada` | Se o projeto dividir o frontend em módulos carregados separadamente (siga o skill da especialização registrada) |

---

## Fase 1 — Coleta de Dados (antes de otimizar)

> Nunca otimizar sem medir primeiro. Otimização prematura é a raiz de muitos problemas.

### 1.1 Medir Core Web Vitals em produção

O Lighthouse não depende da stack e mede qualquer página acessível por URL:

```bash
# Lighthouse CLI — auditar URL de produção ou staging
npx lighthouse {URL} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"

# Ver resumo rápido
npx lighthouse {URL} --output=text --only-categories=performance
```

Também é possível medir pelo painel de performance das ferramentas de desenvolvedor do navegador.

**Targets:**

| Métrica | Meta | Aceitável | Problema |
|---------|------|-----------|---------|
| LCP | < 2.5s | 2.5s–4s | > 4s |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| INP | < 200ms | 200ms–500ms | > 500ms |
| FCP | < 1.8s | 1.8s–3s | > 3s |
| TTFB | < 800ms | 800ms–1.8s | > 1.8s |

### 1.2 Analisar o pacote entregue

Descubra como o projeto empacota o frontend (arquivos de configuração do projeto) e use o
analisador de pacote que essa ferramenta oferece (conforme a especialização). Registre:

- Tamanho total entregue ao navegador e tamanho de cada arquivo carregado na página
- As dependências que mais pesam
- O que é carregado na primeira visita e o que poderia ser carregado depois

```bash
# Verificar o tamanho dos arquivos entregues (ajuste a pasta de saída do build do projeto)
ls -lh {pasta-de-saida}/**/*.js | sort -k5 -rh | head -20
```

### 1.3 Identificar renderizações desnecessárias

Use a ferramenta de profiling da stack do projeto (conforme a especialização) ou o painel de
performance do navegador, gravando uma interação real:

```
Perguntas:
- Quais componentes foram renderizados mais vezes?
- Qual o motivo de cada nova renderização (entrada, estado, contexto compartilhado)?
- Há componentes sem mudança visível sendo renderizados em cascata?
```

---

## Fase 2 — Diagnóstico por Área

### 2.1 LCP alto (página carrega devagar)

**Causas comuns:**

```
1. Imagem principal sem prioridade de carregamento (preload / fetchpriority)
2. Conteúdo principal montado só no cliente — considerar renderização no servidor ou pré-geração, se a stack suportar
3. Fonte web bloqueando a renderização (sem estratégia de exibição provisória)
4. Resposta do servidor lenta (TTFB alto)
5. CSS/JS bloqueando a renderização
```

**Ações de diagnóstico:**

```bash
# Verificar se a imagem do LCP tem preload ou prioridade
grep -rn "fetchpriority\|preload\|priority" {pasta-do-codigo} | grep -i "img\|image\|hero"
```

Para saber se o conteúdo principal é montado no servidor ou no cliente, confira como o projeto
renderiza páginas (conforme a especialização).

### 2.2 CLS alto (layout shift)

**Causas comuns:**

```
1. Imagens sem largura e altura definidas
2. Fontes causando troca visual brusca (FOUT)
3. Conteúdo dinâmico inserido sem espaço reservado
4. Anúncios ou embeds sem dimensões fixas
5. Animações que afetam o layout (margin, padding, top, left)
```

**Ações de diagnóstico:**

```bash
# Verificar imagens sem dimensões
grep -rn "<img" {pasta-do-codigo} | grep -v "width\|height"
```

### 2.3 INP alto (interface travando)

**Causas comuns:**

```
1. Tratadores de evento executando trabalho pesado na thread principal
2. Sem debounce em campos de busca/filtro
3. Listas longas sem virtualização
4. Trabalho pesado disparado logo após a interação
5. Scripts de terceiros bloqueando a thread principal
```

**Ações:**

```bash
# Verificar campos de busca sem debounce (ajuste o nome do evento à stack do projeto)
grep -rn "onChange\|oninput\|@input\|v-model" {pasta-do-codigo} | grep -v "debounce"
```

Para listas longas, procure laços que renderizam muitos itens de uma vez em listas, tabelas e grades.

### 2.4 Pacote grande

**Ações de diagnóstico:**

```bash
# Verificar dependências pesadas nos arquivos de dependências do projeto
cat {arquivo-de-dependencias} | grep -iE "moment|lodash|date-fns"
```

Procure também importações de bibliotecas inteiras onde bastaria importar a parte usada.
Um arquivo carregado na primeira visita acima de 500KB merece investigação; acima de 1MB é problema.

---

## Fase 3 — Otimizações por Categoria

Para cada categoria, aplique a técnica que a stack do projeto oferece (conforme a especialização).
Os princípios valem para qualquer stack:

### 3.1 Imagens

- Defina largura e altura de toda imagem (evita CLS)
- Dê prioridade de carregamento à imagem principal da dobra superior (LCP)
- Carregue de forma tardia as imagens fora da primeira tela
- Prefira formatos modernos (WebP/AVIF) e tamanhos adequados ao dispositivo

### 3.2 Carregamento tardio do código

- Carregue sob demanda componentes pesados ou raramente usados (gráficos, editores, painéis administrativos)
- Reserve o espaço do componente enquanto ele carrega (um esqueleto com a mesma altura), para evitar CLS

### 3.3 Onde renderizar

- Conteúdo estático ou pouco mutável: renderize no servidor ou pré-gere, quando a stack suportar
- Interatividade: isole a parte interativa em componentes pequenos, em vez de tornar a página inteira interativa

### 3.4 Evitar trabalho repetido (memoização)

- **Meça antes**: confirme no profiler que a renderização é desnecessária antes de otimizar
- Reutilize cálculos pesados quando as entradas não mudaram, e evite recriar objetos e funções passados a componentes que dependem de igualdade de referência, **só onde a medição mostrar ganho**
- Evite a otimização sem necessidade comprovada: o custo da comparação pode ser maior que o da renderização

### 3.5 Listas longas (virtualização)

- Para listas com mais de ~100 itens, renderize apenas os itens visíveis (virtualização), usando a solução que a stack do projeto adota

### 3.6 Debounce em campos de busca

- Não dispare busca ou filtragem pesada a cada tecla; aplique debounce ou marque a atualização como de baixa prioridade, com o recurso que a stack oferece

---

## Fase 4 — Arquiteturas distribuídas (se o projeto usa)

Se o projeto divide o frontend em partes carregadas separadamente (por exemplo, uma aplicação
principal que carrega módulos independentes), siga o skill da especialização registrada para
a arquitetura em uso. Pontos a verificar, em qualquer variante:

- **Dependências duplicadas:** a mesma biblioteca sendo carregada mais de uma vez (confirme no painel de rede do navegador; várias cópias da mesma biblioteca indicam problema)
- **Carregamento dos módulos:** só o necessário para a rota atual deve ser carregado na primeira visita
- **Pré-carregamento:** módulos prováveis podem ser pré-carregados em momentos ociosos (por exemplo, ao passar o mouse sobre o item de navegação), sem competir com o carregamento crítico

Se o projeto não usa esse tipo de arquitetura, pule esta fase.

---

## Fase 5 — Relatório de Auditoria

```markdown
## Auditoria de Performance Frontend — {app/feature}
**Data:** {data}
**URL auditada:** {URL}

### Core Web Vitals (antes)
| Métrica | Valor | Status |
|---------|-------|--------|
| LCP     | {x}s  | {ok/atenção/problema} |
| CLS     | {x}   | {ok/atenção/problema} |
| INP     | {x}ms | {ok/atenção/problema} |

### Problemas identificados
| # | Problema | Impacto | Esforço | Prioridade |
|---|----------|---------|---------|------------|
| 1 | {desc}   | {alto/médio/baixo} | {horas} | {P1/P2/P3} |

### Ações recomendadas (ordenadas por impacto/esforço)
1. {ação concreta — arquivo específico — ganho esperado}
2. ...

### Core Web Vitals (esperado após otimizações)
| Métrica | Antes | Esperado |
|---------|-------|---------|
| LCP     | {x}s  | {y}s    |

### Próximos passos
- [ ] {ação 1} — responsável: {quem}
- [ ] {ação 2}
```
