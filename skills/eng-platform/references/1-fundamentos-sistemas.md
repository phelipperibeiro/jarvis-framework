# 1. Fundamentos de Sistemas

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Entender como uma máquina executa software para diagnosticar problemas abaixo da aplicação.

**Conhecimentos:** processos, threads e escalonamento; memória virtual, paginação e swap; sistemas de arquivos e I/O; usuários, permissões e chamadas de sistema; boot e gerenciamento de serviços; limites de recurso (CPU, memória, descritores); virtualização vs. isolamento; shell e scripting.

**Princípios:**
- Todo recurso é finito: meça utilização, saturação e erros (método USE) antes de ajustar.
- Abstrações vazam; saiba o que há embaixo da que você usa.

**Fora do escopo:** comandos, flags e ajustes de kernel específicos de uma distribuição.

**Pergunta-chave:** Um serviço está lento e a CPU está ociosa. Onde você investiga?

**Referências:**
- Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*
- Gregg, *Systems Performance* (2ª ed., 2020)
- Tanenbaum & Bos, *Modern Operating Systems*
- IEEE 1003.1 (POSIX)

**Usam mais:** Systems, Infrastructure, SRE, DevOps
