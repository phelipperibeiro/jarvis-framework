# 9. Extração de Documentos e Dados Não Estruturados

**Nível:** IMPORTANTE · **Agnóstico de tecnologia:** ✅

**Objetivo:** Extrair informação de documentos e textos livres, medindo o acerto e revisando por humanos onde importa.

**Conhecimentos:** PDF nativo vs. digitalizado, imagens, planilhas, anexos; OCR e seus erros típicos; layout, tabelas, formulários e campos-chave; extração por regras, por modelos de aprendizado e por modelos de linguagem; saída estruturada e esquema alvo; pontuação de confiança e limiares; amostra rotulada e medição de precisão e revocação; revisão humana por exceção; documentos sensíveis; e-mail: cabeçalhos, conversas, anexos, codificação; versionamento de extratores.

**Princípios:**
- Meça a acurácia em amostra rotulada antes de confiar.
- Confiança baixa vai para revisão humana, não para produção.
- Mantenha o documento original ligado ao dado extraído.

**Fora do escopo:** serviços e modelos específicos de OCR ou de documentos.

**Pergunta-chave:** Qual a taxa de erro por campo deste extrator e o que acontece com os casos incertos?

**Referências:**
- Sarawagi, *Information Extraction* (Foundations and Trends in Databases, 2008)
- ISO 32000-2 (PDF)
- RFC 5322 (formato de mensagens de e-mail)
- Jurafsky & Martin, *Speech and Language Processing*
- Huyen, *AI Engineering* (2025)

**Usam mais:** Data Extraction, Data Acquisition, RPA
