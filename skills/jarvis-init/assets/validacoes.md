# Validação de opções e valores padrão do /jarvis-init

### Exemplo de Validação

**Exemplo 1: HUB (5 opções) - Texto Numerado**

```
Qual o hub do projeto?

1. AI
2. FRONTEND
3. BACKEND
4. QA
5. DATA
```

Validar número ou nome contra a lista do taxonomy (**inclui DATA**).

---

**Exemplo 2: SQUAD - Texto Numerado**

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
  SQUADS: ['CORE'],
  HUBS: ['AI', 'FRONTEND', 'BACKEND', 'QA', 'DATA', 'FULLCYCLE'],
  POSITIONS: ['HEAD', 'JUNIOR', 'PLENO', 'SENIOR', 'TECH LEAD', 'SPECIALIST', 'PM', 'TPM', 'GPM', 'CTO', 'GENERALIST'],
  AREAS: ['ENGINEERING', 'PRODUCT']
}
```

**Avisar usuário:**
```
⚠️ Arquivo taxonomy.md não encontrado. Usando opções padrão (CORE + hubs com DATA).
Para customizar, edite taxonomy.md e rode /taxonomy validate.
```
