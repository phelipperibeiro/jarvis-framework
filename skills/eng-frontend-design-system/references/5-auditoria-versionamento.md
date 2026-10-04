# Auditoria de Consistência e Versionamento

> Parte do skill `eng-frontend-design-system`. Leia este arquivo quando a tarefa auditar tokens e componentes ou tratar breaking changes e versionamento.

## Auditoria de Consistência

### Detectar tokens hardcodados (proibido)

```bash
# Cores hardcodadas no código (deve retornar zero resultados)
grep -r "#[0-9a-fA-F]\{3,6\}\b" src/components/ --include="*.tsx" --include="*.ts"
grep -r "rgb(\|rgba(\|hsl(" src/components/ --include="*.tsx"

# Valores de espaçamento hardcodados
grep -r "style={{" src/components/ --include="*.tsx" | grep -v "className"

# Fontes hardcodadas
grep -r "fontFamily\|fontSize" src/components/ --include="*.tsx" | grep -v "var(--font"
```

### Verificar componentes sem story

```bash
# Componentes sem arquivo de story correspondente
for f in src/components/**/*.tsx; do
  base="${f%.tsx}"
  [ ! -f "${base}.stories.tsx" ] && echo "SEM STORY: $f"
done
```

### Verificar componentes sem teste

```bash
for f in src/components/**/*.tsx; do
  base="${f%.tsx}"
  [ ! -f "${base}.test.tsx" ] && echo "SEM TESTE: $f"
done
```

---

## Versionamento e Breaking Changes

### O que é uma breaking change?

```
Breaking change (bump MAJOR):
- Remover uma prop
- Renomear uma prop sem alias de retrocompatibilidade
- Alterar o tipo de uma prop (ex: string → enum)
- Remover uma variante existente
- Alterar comportamento padrão visível

Non-breaking (bump MINOR ou PATCH):
- Adicionar nova prop opcional
- Adicionar nova variante
- Corrigir bug visual
- Melhorar acessibilidade
- Atualizar documentação
```

### Processo para breaking change

```markdown
1. Criar deprecation notice na versão atual (adicionar `@deprecated` no JSDoc)
2. Documentar no CHANGELOG.md com seção "Migration Guide"
3. Dar prazo de 1 sprint para os consumidores migrarem (comunicar no canal do time)
4. Lançar major version com a mudança
5. Atualizar todos os remotes que consomem o componente
```

```typescript
// Deprecation notice
/** @deprecated Use `variant="destructive"` em vez de `danger`. Será removido em v2.0. */
export type LegacyButtonVariant = 'danger'
```
