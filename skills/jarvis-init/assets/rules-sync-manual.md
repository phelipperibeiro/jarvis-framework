Fallback do Passo 8 do `/jarvis-init`, só quando `jarvis rules sync` não pode rodar.

**Executar após gravar o ENV.md** (nos fluxos create, update B e upgrade C).

Objetivo: deixar em `$IDE/rules/` e `$IDE/rules-on-demand/` as rules do framework (com o overlay da empresa por cima). A pasta `rules/` é carregada no início da sessão; a `rules-on-demand/` guarda as rules de uma etapa, de uma área ou transversais, que cada comando lê quando precisa (o Claude Code não a carrega sozinho). Toda rule entra, menos duas, decididas pelo nome do arquivo: `artifact-style-rules.md` só com `ARTIFACT_STYLE=human-generated` e `rtk-rules.md` só com `RTK_ENABLED=true`. `bin/lib/core/profile-filter.js` espelha essa decisão em JS (usada por `jarvis tokens` e `jarvis rules sync`): ao mudar a lógica aqui, mude lá também. A documentação de autoria de rules fica em `docs/estrutura/rules.md`.

**Passos:**

```
1. Ler ARTIFACT_STYLE (vazio = `ai-generated`) e RTK_ENABLED do ENV.md recém-gravado
2. Para cada uma das duas pastas (rules/ e rules-on-demand/), listar todos os arquivos .md (recursivo) do core, mais os de `$IDE/overlays/{COMPANY_PROFILE}/{pasta}/` que o core não tem
3. Para cada arquivo:
   a. **As duas exceções:** `artifact-style-rules.md` entra só com `ARTIFACT_STYLE=human-generated`; `rtk-rules.md` entra só com `RTK_ENABLED=true`. Qualquer outro arquivo entra. O conteúdo não é lido para decidir.
   b. Se entra → copiar para a mesma pasta em $IDE/ (rules/ → $IDE/rules/, rules-on-demand/ → $IDE/rules-on-demand/), preservando subpastas.
      **RuleResolver (#199):** a origem é `$IDE/overlays/{COMPANY_PROFILE}/{pasta}/{relPath}` se esse arquivo existir (o fork da empresa, mesmo caminho e nome), senão a do core. A cópia vinda do overlay recebe, logo depois do frontmatter (ou na primeira linha, sem frontmatter), a linha `> Overlay: {COMPANY_PROFILE} (forked_from {valor do frontmatter, ou "sem carimbo"})`. **Nada é gravado em `$IDE/overlays/`**: a única exceção é criar a pasta vazia do perfil (`mkdir`), feita pelo `jarvis init` e por este Passo 8 (nota abaixo do resumo)
   c. Se não entra → deletar de $IDE/ se existir lá
   d. **Órfãs do overlay (#199):** arquivo em `$IDE/rules/` ou `$IDE/rules-on-demand/` cuja **primeira linha útil depois do frontmatter** é exatamente `> Overlay: {perfil} (forked_from …)` e que não existe em `$IDE/overlays/{COMPANY_PROFILE}/` (ficou de outro perfil, ou saiu do overlay à mão): se existe no core → copiar a versão do core por cima (sem marcação); senão → deletar de $IDE/. Uma rule que só cite a marcação no corpo não conta. O arquivo do overlay nunca é tocado
4. Exibir resumo ao usuário
```

**Copiar preservando subpastas:**

```bash
# Exemplo: rules/engineering/eng-security-rules.md
# Destino: $IDE/rules/engineering/eng-security-rules.md
# (o mesmo vale para rules-on-demand/ → $IDE/rules-on-demand/)
mkdir -p "$IDE/$pasta/$(dirname $relPath)"
cp "$pasta/$relPath" "$IDE/$pasta/$relPath"   # $pasta = rules ou rules-on-demand
```

**Saída para o usuário:**

```
🔍 Sincronizando rules: ARTIFACT_STYLE={ARTIFACT_STYLE} | RTK={ligado|desligado}

✅ Rules sincronizadas:
   Copiadas : N arquivos (rules/: N | rules-on-demand/: N)
   Removidas: N arquivos (exceção desligada)
   Do overlay: N arquivos ({COMPANY_PROFILE})
   Overlay {COMPANY_PROFILE}: pasta criada        ← só quando `$IDE/overlays/{COMPANY_PROFILE}/` não existia
```

> **Pasta do perfil (#199):** se `$IDE/overlays/{COMPANY_PROFILE}/` não existir, crie-a vazia (`mkdir -p`) e mostre a linha acima. É a única escrita permitida em `$IDE/overlays/`: nenhum arquivo é gravado, alterado ou apagado lá. O `jarvis init` faz o mesmo; aqui vale para quem roda só o `/jarvis-init`.
