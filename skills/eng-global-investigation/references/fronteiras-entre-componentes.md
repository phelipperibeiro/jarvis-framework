# Fronteiras entre componentes

Quando o sistema tem várias partes encadeadas, o bug costuma estar numa **fronteira**: um componente entrega algo diferente do que o seguinte espera. Antes de propor correção, descubra **qual** fronteira falha.

## Exemplos de fronteira

| Cadeia | Fronteiras |
|--------|------------|
| Serviço A → HTTP → Serviço B | requisição que sai de A; requisição que chega em B; resposta de volta |
| Produtor → fila → consumidor | mensagem publicada; mensagem consumida; o que acontece quando o consumo falha |
| Pipeline de CI → build → deploy | variáveis e segredos disponíveis em cada etapa; artefato gerado; artefato publicado |
| Interface → API → banco | dado enviado; dado validado; dado gravado |

## Passo a passo

1. **Desenhe a cadeia** do fluxo afetado, do ponto de entrada ao ponto em que o sintoma aparece. Use o código, não a memória: ache quem chama quem (rotas, clientes HTTP, publicação e consumo de mensagens, etapas do pipeline).
2. **Para cada fronteira, confira:**
   - o formato do que sai e do que chega (campos, tipos, nomes, versão do contrato);
   - se a configuração e o ambiente chegam iguais dos dois lados (URL, variável, segredo, fuso, idioma);
   - o que acontece em erro, demora ou falta de resposta (tempo limite, retentativa, fila de falhas, erro engolido);
   - se o identificador de correlação passa adiante (é ele que liga os registros dos dois lados).
3. **Junte evidência de onde quebra.** Pela leitura, compare o contrato dos dois lados. No ambiente local, se preciso, registre o que entra e sai em cada fronteira e rode uma vez (política de acesso do `SKILL.md`). Em produção, só leitura: logs e métricas que já existem.
4. **Investigue só a fronteira que falha.** Com ela identificada, volte às hipóteses do `SKILL.md`.

## Sinais típicos

| Sinal | Fronteira suspeita |
|-------|--------------------|
| Funciona isolado, falha no fluxo completo | contrato ou configuração entre os componentes |
| Falha intermitente que some na retentativa | tempo limite, concorrência, estado compartilhado |
| "Não chega" sem erro | erro engolido ou mensagem descartada sem fila de falhas |
| Funciona local, falha no pipeline | variável, segredo ou versão diferente no ambiente |

## Quando há muitos serviços

Se o fluxo cruza microsserviços (HTTP e mensageria) e a especialização `eng-backend-microservices-trace` está registrada em `BACKEND_SPECIALIZATIONS`, o caso investigar do `/eng.debug` a usa para mapear a cadeia e rankear as hipóteses por fronteira.
