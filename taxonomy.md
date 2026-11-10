# Taxonomia Organizacional
Define a estrutura organizacional, vocabulário e configurações do framework Jarvis

> **📝 Como usar**: Este arquivo define as opções válidas para variáveis do ENV.md.
> Edite este arquivo para customizar as opções da sua organização antes de instalar o framework.
>
> **Domínio de Email**: ver seção "Domain" abaixo.

---

## 🏢 Squads (Times de Desenvolvimento)

Squads são times multidisciplinares. Customize via `/taxonomy`. Skills e agentes técnicos (RPA, Data, QA, etc.) **não** dependem destes nomes.

### CORE
channel_id:
board_code:
modules:
Time principal. Adicione squads da sua organização com `/taxonomy add SQUADS`.

---

## 🌐 Domain (Domínio de Email Corporativo)

Define o domínio de email corporativo para validação e padronização de emails. A instrução `DOMAIN:` fica numa única linha, nesta seção — não repita essa linha em outro lugar deste arquivo.

DOMAIN:

- Todos os emails devem terminar com `@DOMAIN`
- Usado na validação de ENV.md durante `/jarvis-init`
- Garante que apenas emails corporativos sejam registrados
- Exemplo: `pedro@domain.com.br`, `ana@domain.com.br`

**Para open source, sem restrição**: deixe a linha em branco (`DOMAIN:`) ou remova-a.

---

## 📝 Como Adicionar Novas Opções

Para adicionar uma nova opção:

1. Adicione o nome em MAIÚSCULAS sob a categoria apropriada
2. Inclua os campos estruturados (se aplicável)
3. Inclua uma breve descrição
4. Execute `/jarvis-init` - as novas opções aparecerão automaticamente

**Exemplo — Squad com channel_id e modules:**
```markdown
### MOBILE
channel_id: C0123456789
board_code: MOB
modules: app-ios, app-android, push-notification, deep-link
Time focado em desenvolvimento mobile nativo (iOS/Android)
```

> Use `/taxonomy add` para adicionar opções com validação automática.

---

## 🔄 Sincronização

Quando este arquivo é atualizado:
- Execute `/jarvis-init` para recriar ENV.md com novas opções
- Ou edite manualmente `$IDE/ENV.md` se já existir
- As validações nos workflows usarão automaticamente as novas opções

---

## ⚠️ Notas Importantes

1. **Mantenha nomes sem espaços**: Use `-` ou `_` para separar palavras
   - ✅ `CORE`
   - ❌ `ENGINEERING CORE`

2. **Use MAIÚSCULAS**: Facilita padronização e busca
   - ✅ `CORE`
   - ❌ `Core` ou `core`

3. **Evite caracteres especiais**: Apenas letras, números, `-` e `_`
   - ✅ `RPA`, `DATA-PLATFORM`
   - ❌ `RPA!`, `DATA/PLATFORM`

4. **Mantenha consistência**: Uma vez definido, evite mudar nomes existentes
   - Impacta ENV.md de projetos existentes
   - Se necessário mudar, comunique toda a organização

5. **Domínio de Email**: Configure uma única vez no início
   - ✅ `DOMAIN: seudominio.com.br` (validará emails @seudominio.com.br)
   - ✅ `DOMAIN:` (em branco para sem restrição)
   - ❌ Múltiplos domínios (use apenas um)
