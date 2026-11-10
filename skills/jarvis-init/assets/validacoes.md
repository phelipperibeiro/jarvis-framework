# Validação de opções e valores padrão do /jarvis-init

### Exemplo de Validação

**Exemplo: SQUAD - Texto Numerado**

```
Qual o nome do seu squad?

Opções disponíveis: (lidas de taxonomy.md)
1. CORE - Time principal

Digite o número ou nome do squad:
```

```javascript
const selected = validateTextOption(userInput, extractSquadsFromTaxonomy())
if (!selected) {
  console.log("❌ Squad inválido. Digite um número ou nome válido da lista.")
}
```

### Valores Padrão (Fallback)

Se `taxonomy.md` não existir ou estiver corrompido, usar:

```javascript
const DEFAULT_OPTIONS = {
  SQUADS: ['CORE']
}
```

**Avisar usuário:**
```
⚠️ Arquivo taxonomy.md não encontrado. Usando a opção padrão (squad CORE).
Para customizar, edite taxonomy.md e rode /taxonomy validate.
```
