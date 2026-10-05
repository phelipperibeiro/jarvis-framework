# 4. Arquitetura de Dados

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Organizar armazenamento, fluxo e responsabilidades de dados em escala organizacional.

**Conhecimentos:** data warehouse, data lake e lakehouse; arquitetura em camadas (bruto, refinado, consumo); batch, streaming e arquiteturas Lambda/Kappa; data mesh: domínio, produto de dados, plataforma, governança federada; separação entre armazenamento e computação; formatos abertos e interoperabilidade; fontes, integração e eventos; acoplamento e propriedade entre domínios; trade-offs de custo, latência e frescor.

**Princípios:**
- Arquitetura segue os padrões de uso e a estrutura da organização.
- Centralize padrões, descentralize propriedade quando o domínio é maduro.
- Prefira acoplamento por contrato a acoplamento por tabela.

**Fora do escopo:** arquiteturas de referência proprietárias de um fornecedor.

**Pergunta-chave:** Quando um modelo centralizado vira gargalo e o que muda ao descentralizá-lo?

**Referências:**
- Reis & Housley, *Fundamentals of Data Engineering*
- Dehghani, *Data Mesh*
- Armbrust et al., *Lakehouse* (CIDR 2021)
- Kleppmann, *Designing Data-Intensive Applications*

**Usam mais:** Architecture, Platform, Engineering, Governance
