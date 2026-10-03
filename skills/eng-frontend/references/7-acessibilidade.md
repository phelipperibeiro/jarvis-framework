# 7. Acessibilidade (A11y)

**Nível:** FUNDAMENTAL  
**Independência:** ✅ Válido em qualquer framework

## Objetivo
Garantir que a interface seja perceptível, operável, compreensível e robusta para todas as pessoas, incluindo quem usa tecnologias assistivas.

## Conhecimentos Principais

### Diretrizes WCAG 2.1
- Nível A (mínimo)
- Nível AA (recomendado, o padrão a seguir)
- Nível AAA (avançado)

### Princípios POUR
- **P**erceptível: alternativas para conteúdo que não é texto (texto alternativo, legendas e transcrições), legibilidade e contraste suficiente
- **O**perável: acessível pelo teclado, tempo suficiente para ler e interagir, sem conteúdo que provoque crises (flashes), navegável
- **U**nderstandable (compreensível): texto legível, comportamento previsível, ajuda na entrada de dados (rótulos e mensagens de erro)
- **R**obusto: compatível com tecnologias assistivas, HTML semântico, ARIA quando necessário e HTML válido

### Implementação prática
- Navegação por teclado: ordem de tabulação e gerenciamento de foco
- Suporte a leitores de tela
- Cor: nunca usar a cor como único meio de transmitir informação
- Imagens: texto alternativo adequado
- Formulários: rótulos, instruções e mensagens de erro
- Links: texto descritivo (nunca "clique aqui")
- ARIA: aria-label, aria-labelledby, aria-describedby, aria-hidden e papéis (roles)

### Testes de acessibilidade
- Ferramentas automatizadas de verificação
- Teste manual com leitor de tela
- Navegação somente pelo teclado
- Verificação de contraste de cor

## O que NÃO Inclui
- Ferramentas específicas de auditoria
- Desenvolvimento de tecnologias assistivas

## Por quê é Universal
A acessibilidade é uma obrigação legal e ética, e as diretrizes valem em qualquer tecnologia.

## Referências
- WCAG 2.1 - W3C Web Accessibility Initiative
- W3C - World Wide Web Consortium
