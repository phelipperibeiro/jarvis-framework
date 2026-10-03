# 8. Performance

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer framework

## Objetivo
Entregar interfaces rápidas e estáveis, medindo antes de otimizar.

## Conhecimentos Principais

### Métricas
- First Contentful Paint (FCP): quando o conteúdo aparece
- Largest Contentful Paint (LCP): quando o maior elemento fica visível
- Cumulative Layout Shift (CLS): quanto o layout se move
- INP: a responsividade a interações (substituiu o First Input Delay nas métricas essenciais)
- Time to Interactive (TTI)
- Tempo de carregamento da página versus Web Vitals

### Rede
- Minimizar downloads
- Compressão de recursos (gzip e brotli)
- Carregamento sob demanda (lazy loading) e divisão de código (code splitting)
- CSS crítico
- Adiar a execução de scripts
- HTTP/2 e HTTP/3 (em conceito)

### Renderização
- Reflows e repaints: quando ocorrem
- Aceleração por GPU e will-change
- Agrupar atualizações do DOM
- Debounce e throttle de eventos

### Desempenho de JavaScript
- Event loop: pilha de chamadas, fila de tarefas, microtarefas e macrotarefas
- Vazamentos de memória
- Coleta de lixo (em conceito)

### Imagens
- Formatos: JPEG, PNG, WebP e AVIF
- Imagens responsivas
- Entrega por rede de distribuição (CDN)
- Compressão

### Cache
- Cache do navegador
- Service Workers (em conceito)
- Cabeçalhos de cache HTTP

## O que NÃO Inclui
- Otimizações específicas de ferramentas de build
- Padrões de performance específicos de um framework

## Por quê é Universal
As técnicas de performance do navegador valem independentemente de como a interface é construída.

## Referências
- web.dev - Web Vitals
- MDN Web Docs
