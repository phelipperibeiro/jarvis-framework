# Rastrear para trás

Quando o erro aparece fundo na pilha, corrigir onde ele explode trata o sintoma. A causa está onde o valor ruim **nasceu**. Esta técnica segue o valor de volta, chamada por chamada, até a origem.

## Quando usar

- O erro acontece longe de onde o dado entrou (ex.: "valor vazio" ao gravar, mas o valor veio de três chamadas antes).
- Um valor inválido (vazio, nulo, no formato errado) chega a uma função que não deveria recebê-lo.
- Não está claro qual caminho do código levou até o erro.

## Passo a passo

1. **Observe o sintoma.** Anote a mensagem e o ponto exato (arquivo:linha) onde o erro aparece.
2. **Ache a causa imediata.** Qual linha produziu o erro e com qual valor? Ex.: `salvar(registro)` falha porque `registro.id` está vazio.
3. **Pergunte: quem chamou isto com esse valor?** Leia quem chama a função e de onde vem o argumento.
4. **Continue subindo.** Repita a pergunta a cada nível até achar o ponto em que o valor deixou de ser válido, ou em que nunca foi validado.
5. **Ache o gatilho original.** É ali que a correção vale: na origem, não no sintoma.

```
salvar(registro)              ← erro: id vazio
  ← montarRegistro(entrada)   ← id copiado de entrada.id
    ← lerEntrada(requisicao)  ← entrada.id nunca preenchido quando o campo vem com outro nome
                                 ↑ gatilho original: corrigir aqui
```

## Quando não dá para seguir pela leitura

Se não for possível descobrir quem chamou só lendo o código, **no ambiente local** acrescente um registro temporário logo antes do ponto do erro, com o valor recebido e a pilha de chamadas (o recurso equivalente da linguagem). Rode uma vez, leia a saída e remova o registro. Em produção, não altere nada: peça os logs que já existem (política de acesso do `SKILL.md`).

## Depois de achar a origem

- Corrija na origem.
- Considere validar também nas camadas por onde o valor passa (entrada, regra de negócio, gravação), para o mesmo erro não voltar por outro caminho.
- Descreva no relatório o caminho percorrido (do sintoma até a origem): é a evidência do veredito.
