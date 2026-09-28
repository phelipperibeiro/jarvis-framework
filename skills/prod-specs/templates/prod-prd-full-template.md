---
name: [Nome]  
version: [X.Y.Z]
created_at: [YYYY-MM-DD]
updated_at: [YYYY-MM-DD]
link_task: [URL referêncial do $TASK_MANAGER]
---


# [Nome do PRD]

## TL:DR;

- **O que** resolver: 
  - [Descreva no mínimo 2 bullet points qual o problema queremos resolver? O que está nos motivando/estimulando a criar uma solução? Quais as dores que o usuário tem sentido?]
- **Por que** resolver: 
  - [Descreva no mínimo 2 bullet points quais as razões pelas quais queremos resolver ou explorar; marcadores. Escreva no máximo 3 bullet points. Se o usuário enviar informações, use-as.]
- **Como** resolver: 
  - [Descreva no mínimo 2 bullet points as descrições da solução ou hipóteses que iremos construir. Se o usuário não deixou claro, pergunte.]

## Contexto

[Descrição detalhada do contexto divididos em 3-4 parágrafos que somados devem ter um total máximo de 250 palavras, respondendo: Qual o problema que iremos resolver ou a oportunidade que iremos explorar? O que está acontecendo hoje? Que dor existe? Por que isso é importante para o usuário e quais os impactos benéficos para o negócio? Você pode expandir e usar as informações da TL:DR, mas sempre pergunte ao usuário caso não houver informações suficientes. Procure na web casos parecidos para criar uma resposta mais correta e completa.]

### Declaração dos problemas
[Use o formato abaixo para listar os problemas que queremos resolver. Utilize as informações do usuário para sugerir problemas comuns que essa solução irá resolver. Foque-se nos problemas que o usuário enfrenta. Sugira a partir de pesquisas na web por casos reais e também utilize informações já feitas no próprio projeto.]

```
- Clientes não conseguem fazer seus pagamentos de maneira eficaz
- Ainda temos processos manuais em fluxos altamente sensíveis
- Usuário não tem feedback imediato sobre conclusão ou erro do pagamento via plataforma
```


## Solução
[Visão geral de 2 a 3 parágrafos respondendo: O que estamos construindo? Por que? Para quem? Impacto esperado? Você pode expandir as informações do TLDR;]

[Descreva qual é a solução e por que é a melhor solução. Qual é o custo de oportunidade de não fazer isso? A descrição da nossa solução e como ela ajudará o usuário a resolver o problema e a empresa a explorar esta oportunidade.]

### Funcionalidades chave

```
#### Suportar múltiplos métodos de pagamento
- Pagamento com criptomoedas: permite que usuários paguem utilizando criptmoedas como Bitcoin, ETH e outras
- Integração com cartão de crédito via gateways: para facilitar a integração e pagamento feito com cartão na plataforma, sem a necessidade de ter regulações oficiais.
- Suporte com carteiras digitais como Apple Pay e Google Pay: facilitando a adoção de usuários sem a necessidade de cadastro de novas informações na plataforma.
- Pagamento via PIX: facilitando a adoção com pagamentos utilizando código copia/cola e QR Code; 

#### Prevenção a fraude
- Detecção de fraudes via machine learning: automatizando ao máximo a detecção de possíveis compras fraudulentas e prevenindo lavagem de dinheiro.
- Assessment de risco em tempo real: com fallback para a mesa de operações quando validação automática falhar.

#### Pagamento via plataforma
- Pagamento utilizando saldo: clientes fazem recarga de saldo na plataforma para fazer pagamentos diretamente na plataforma
- Agendamento de pagamentos: usuário agendar pagamentos via plataforma para que sejam executados automaticamente em dia específico
- URL aberta para um terceiro pagar: cliente poderá compartilhar a págian de pagamento com os valores a serem pagos para outras pessoas efetuarem o pagamento.
```

## Critérios Gerais
[Siga o padrão que está abaixo. Lembre-se que os critérios em uma PRD devem ser descrições de alto nível, de regras de funcionamento e enfatizando as regras de negócio. Definir o que e não o como. ]

```
### CRT-1: [nome do cenário]
- Usuário pode filtrar resultados da pesquisa por faixa de preço
- Deve ter possibilidade de login via redes sociais
- O sistema deve processar e exibir atualizações de localização com latência máxima de 30 segundos para 95% das requisições, mesmo com 1000+ veículos simultâneos
- Todos os dados sensíveis devem ser criptografados em repouso e em trânsito, seguindo conformidade com LGPD e GDPR
- Todas as funcionalidades devem passar por revisão de segurança automatizada e validação manual das 10 vulnerabilidades OWASP mais frequentes.

### CRT-2: [nome do cenário]

- Arquivos enviados devem permitir os formatos MP3, WAV e MPG4, com tamanho máximo de 100MB
- O usuário pode ouvir o áudio enviado antes de confirmar o envio, e arquivos corrompidos ou fora do padrão devem gerar alerta e impedir o envio
- Todos os dados sensíveis devem ser criptografados em repouso e em trânsito, seguindo conformidade com LGPD e GDPR.
- O produto deve ser integrado de forma bidirecional com os sistemas externos aprovados, passando nos cenários de teste de integração.

### CRT-3: [nome do cenário]

- Campo de busca deve sugerir resultados em tempo real com tolerância a erros de digitação
- Resultados da busca devem ser apresentados em até 1 segundo e exibidos em páginas paginadas.
- Histórico de ações realizadas pelo usuário deve ser registrado e disponível mediante consulta no painel administrativo.

### CRT-4: [nome do cenário]
- Usuário deve conseguir redefinir senha com validação via e-mail em menos de 5 minutos
- Sistema deve bloquear a conta após cinco tentativas de login mal-sucedidas e registrar o evento para consulta posterior.
```


## Indicadores de Sucesso
[Sugira e pergunte para o usuário quais indicadores que devem ser monitorados para entendermos o sucesso.]

```
- Aumentar sucesso de pagamento em 21%
- Reduzir perdas por fraude em 25%
- Melhorar satisfação do cliente em 30%
- Manter uptime de plataform em 99%
```


## Escopo

### Dentro do Escopo
✅ [Item 1]  
✅ [Item 2]  
✅ [Item 3]

### Fora do escopo
❌ [Item 1]  
❌ [Item 2]  
❌ [Item 3]

### Evoluções futuras
🔮 [Item 1]  
🔮 [Item 2]

## Artefatos e documentações
- [Link file 1]
- [Link file 2]

## Competidores

[Descrição de soluções já utilizadas no mercado pelos usuários. Crie seções com cada um dos competidores, descrevendo suas principais features e contextos. Siga o padrão abaixo:]

```
### Nome do Competidor 1

[Nome do Competidor 1](URL do site)

- Breve descrição (segmento, localização, data de fundação)
- Tamanho da empresa: número de funcionários, presença geográfica, faturamento estimado (se público)
- Histórico relevante e diferenciais

#### Principais features
- Lista das principais funcionalidades ou produtos oferecidos
- Características essenciais (preço, usabilidade, benefícios, diferenciais técnicos)
- Estrutura de suporte e atendimento ao cliente (se aplicável)

#### Economics / Base de usuários

- Faturamento anual, margem de lucro ou dados financeiros relevantes (se públicos)
- Número de usuários/clientes ativos (caso disponível)
- Participação de mercado relativa
- Crescimento recente ou taxa de aquisição de novos clientes, se possível

```

## Restrições, Suposições e Riscos
[Pergunte para o usuário se existem alguma restrição de negócio, técnico ou de produto que possa dificultar a construção ou que precisa ser discutido com áreas ou stakeholders.]

[Escreva aqui as principais suposições e hipóteses sobre esse projeto. Utilize informações fornecidas pelo usuário, caso contrário, pergunte para ele nessa etapa.]

### Restrições de Negócio
[Bullet points com as restrições de negócio mapeadas e fornecidas pelo usuário. Se não tiver essa informação, pergunte para o usuário.]

### Restrições técnicas
[Bullet points com as restrições técnicas mapeadas e fornecidas pelo usuário. Se não tiver essa informação, pergunte para o usuário.]

### Riscos e mitigações
[Seções o título do tópico e sua detalhes expandidos sobre os riscos que podem existir sobre essa iniciativa e como elas são mitigadas.]