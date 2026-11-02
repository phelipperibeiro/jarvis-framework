Fallback do Passo 8 do `/jarvis-init`, só quando `jarvis rules sync` não pode rodar.

**Executar após gravar o ENV.md** (nos fluxos create, update B e upgrade C).

Objetivo: garantir que `$IDE/rules/` e `$IDE/rules-on-demand/` contenham apenas as rules relevantes para o perfil do usuário, reduzindo tokens carregados em sessão. A pasta `rules/` é carregada no início da sessão; a `rules-on-demand/` guarda as rules de uma etapa ou transversais, que cada workflow lê quando precisa (o Claude Code não a carrega sozinho). O filtro é o mesmo nas duas pastas, e `bin/lib/core/profile-filter.js` o espelha em JS (usado por `jarvis tokens`): ao mudar a lógica aqui, mude lá também. A documentação de autoria de rules fica em `docs/estrutura/rules.md`.

**Passos:**

```
1. Ler HUB, POSITION, AREA, SQUAD e ARTIFACT_STYLE (vazio = `ai-generated`) do ENV.md recém-gravado
2. Para cada uma das duas pastas (rules/ e rules-on-demand/), listar todos os arquivos .md (recursivo) do core, mais os de `$IDE/overlays/{COMPANY_PROFILE}/{pasta}/` que o core não tem
3. Para cada arquivo:
   a. Ler o bloco `> **Applies to:**` (primeira ocorrência no arquivo)
   b. Se o bloco não existir → tratar como universal → copiar sempre
   c. Se existir → verificar matching (ver lógica abaixo)
   d. **Condição especial RTK**: se o arquivo for `rtk-rules.md`,
      copiar APENAS se `RTK_ENABLED=true` no ENV.md
      (mesmo que o perfil bata, RTK é opt-in)
   e. Se bate com o perfil → copiar para a mesma pasta em $IDE/ (rules/ → $IDE/rules/, rules-on-demand/ → $IDE/rules-on-demand/), preservando subpastas.
      **RuleResolver (#199):** a origem é `$IDE/overlays/{COMPANY_PROFILE}/{pasta}/{relPath}` se esse arquivo existir (o fork da empresa, mesmo caminho e nome), senão a do core. O `Applies to` lido é o do arquivo que será copiado. A cópia vinda do overlay recebe, logo depois do frontmatter (ou na primeira linha, sem frontmatter), a linha `> Overlay: {COMPANY_PROFILE} (forked_from {valor do frontmatter, ou "sem carimbo"})`. **Nada é gravado em `$IDE/overlays/`**: a única exceção é criar a pasta vazia do perfil (`mkdir`), feita pelo `jarvis init` e por este Passo 8 (nota abaixo do resumo)
   f. Se não bate → deletar de $IDE/ se existir lá
   g. **Órfãs do overlay (#199):** arquivo em `$IDE/rules/` ou `$IDE/rules-on-demand/` cuja **primeira linha útil depois do frontmatter** é exatamente `> Overlay: {perfil} (forked_from …)` e que não existe em `$IDE/overlays/{COMPANY_PROFILE}/` (ficou de outro perfil, ou saiu do overlay à mão): se existe no core → copiar a versão do core por cima (sem marcação); senão → deletar de $IDE/. Uma rule que só cite a marcação no corpo não conta. O arquivo do overlay nunca é tocado
4. Exibir resumo ao usuário
```

**Lógica de matching:**

Um arquivo é copiado se **todas** as condições forem satisfeitas:

```javascript
function matchesProfile(appliesTo, profile) {
  const matches = (list, value) =>
    list === 'all' || list.split(',').map(s => s.trim()).includes(value)

  // FULLCYCLE é superusuário do eixo HUB: satisfaz qualquer applies_to HUB
  const hubMatches = profile.HUB === 'FULLCYCLE' || matches(appliesTo.HUB, profile.HUB)

  // GENERALIST é superusuário dos eixos POSITION e AREA: transita entre
  // ENGINEERING/PRODUCT e satisfaz qualquer POSITION exigida
  const positionMatches = profile.POSITION === 'GENERALIST' || matches(appliesTo.POSITION, profile.POSITION)
  const areaMatches = profile.POSITION === 'GENERALIST' || matches(appliesTo.AREA, profile.AREA)

  // ARTIFACT_STYLE (5º campo opcional): ausente no bloco = 'all'; perfil vazio = 'ai-generated'.
  // Sem coringa: FULLCYCLE e GENERALIST não o satisfazem (é escolha da pessoa, não papel).
  const styleMatches = matches(appliesTo.ARTIFACT_STYLE || 'all', profile.ARTIFACT_STYLE || 'ai-generated')

  return (
    hubMatches &&
    positionMatches &&
    areaMatches &&
    matches(appliesTo.SQUAD, profile.SQUAD) &&
    styleMatches
  )
}
```

**Parser do bloco `applies_to`:**

```javascript
// Exemplo de bloco: > **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all
// 5º campo opcional:  ... | SQUAD: all | ARTIFACT_STYLE: human-generated
function parseAppliesTo(fileContent) {
  const match = fileContent.match(
    /> \*\*Applies to:\*\* HUB: ([^|]+)\| POSITION: ([^|]+)\| AREA: ([^|]+)\| SQUAD: ([^|\n]+)(?:\| ARTIFACT_STYLE: ([^|\n]+))?/
  )
  if (!match) return null // sem bloco = universal
  return {
    HUB:            match[1].trim(),
    POSITION:       match[2].trim(),
    AREA:           match[3].trim(),
    SQUAD:          match[4].trim(),
    ARTIFACT_STYLE: (match[5] || 'all').trim(),
  }
}
```

**Copiar preservando subpastas:**

```bash
# Exemplo: rules/engineering/frontend/eng.frontend-rules.md
# Destino: $IDE/rules/engineering/frontend/eng.frontend-rules.md
# (o mesmo vale para rules-on-demand/ → $IDE/rules-on-demand/)
mkdir -p "$IDE/$pasta/$(dirname $relPath)"
cp "$pasta/$relPath" "$IDE/$pasta/$relPath"   # $pasta = rules ou rules-on-demand
```

**Saída para o usuário:**

```
🔍 Sincronizando rules para o perfil: HUB={HUB} | POSITION={POSITION} | AREA={AREA} | SQUAD={SQUAD} | ARTIFACT_STYLE={ARTIFACT_STYLE}

✅ Rules sincronizadas:
   Copiadas : N arquivos (rules/: N | rules-on-demand/: N)
   Removidas: N arquivos (não batem com o perfil)
   Universais: N arquivos (sem applies_to — sempre copiadas)
   Do overlay: N arquivos ({COMPANY_PROFILE})
   Overlay {COMPANY_PROFILE}: pasta criada        ← só quando `$IDE/overlays/{COMPANY_PROFILE}/` não existia
```

> **Pasta do perfil (#199):** se `$IDE/overlays/{COMPANY_PROFILE}/` não existir, crie-a vazia (`mkdir -p`) e mostre a linha acima. É a única escrita permitida em `$IDE/overlays/`: nenhum arquivo é gravado, alterado ou apagado lá. O `jarvis init` faz o mesmo; aqui vale para quem roda só o `/jarvis-init`.
