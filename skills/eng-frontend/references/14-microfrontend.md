# 14. Arquitetura de Micro Frontend

**Nível:** IMPORTANTE  
**Independência:** ✅ Válido em qualquer bundler ou mecanismo de composição

## Objetivo
Decompor um frontend grande em partes independentes — que times evoluem e publicam sem coordenação síncrona — sem perder coesão para quem usa o produto.

## Conhecimentos Principais

### Papéis
- Shell (host): orquestra a composição; decide quando e onde montar cada parte
- Remote (micro frontend): feature isolada; expõe uma API pública (componentes, rotas) para o shell consumir
- Pacote compartilhado (design system, utilitários): consumido por shell e remotes, não é ele mesmo um remote

### Contrato entre as partes
- Contrato de interface explícito e tipado — o que o remote expõe e o que ele espera receber do shell
- Mudar o contrato sem versionar é breaking change silencioso para quem integra
- O remote nunca importa diretamente de outro remote — isso rompe o isolamento e recria o monolito

### Dependências compartilhadas
- Bibliotecas que só podem existir em uma instância (ex: a biblioteca de UI, o roteador) são compartilhadas como singleton
- Carregamento adiantado (eager) de uma dependência compartilhada tende a causar erro de inicialização — carregue sob demanda
- Conflito de versão entre shell e remote é a causa mais comum de bug "funciona isolado, quebra integrado"

### Comunicação entre partes
- Estado não se compartilha via import direto de módulo — um barramento de eventos ou callbacks via o shell desacoplam quem fala de quem escuta
- Cada remote deve funcionar sozinho (modo standalone) para desenvolvimento e teste local, sem depender do shell rodando

### Isolamento de falha e deploy
- Um remote que falha ao montar não deve derrubar o shell nem os outros remotes — isolar com um limite de erro no ponto de montagem
- Deploy de um remote é independente do deploy do shell e dos demais remotes — isso é a razão de existir da arquitetura
- URL/endereço de cada remote vem de configuração/variável de ambiente, nunca hardcoded

## O que NÃO Inclui
- Configuração de uma implementação de federation específica (ex: Module Federation do Webpack, plugin do Vite)
- Escolha de bundler
- Como estruturar o monorepo (ferramenta de workspace, pipeline de CI) — é decisão de projeto

## Por quê é Universal
Shell/remote, contrato de interface, dependência compartilhada como singleton e isolamento de falha continuam válidos trocando o bundler ou o mecanismo de composição — só a configuração muda.

## Referências
- Jackson, *Micro Frontends* (martinfowler.com)
- Module Federation — conceitos (independente de bundler)
- Geers, *Micro Frontends in Action*
