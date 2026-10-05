# 2. Redes

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Raciocinar sobre como pacotes e nomes chegam de A a B, e por que não chegam.

**Conhecimentos:** modelos OSI e TCP/IP; IP, CIDR, sub-redes e roteamento; TCP (handshake, congestionamento) vs. UDP; DNS e resolução de nomes; HTTP e TLS (certificados, cadeia de confiança); NAT, firewalls e proxies; balanceamento L4/L7; VPN, segmentação e MTU; latência vs. largura de banda.

**Princípios:**
- A rede é não confiável: latência, perda e partição acontecem.
- Segmente para limitar o raio de impacto.
- DNS e certificados expirados estão por trás de muitos incidentes.

**Fora do escopo:** configuração de equipamentos de um fornecedor específico.

**Pergunta-chave:** Por que um nome resolve, mas a conexão não se estabelece?

**Referências:**
- Stevens, *TCP/IP Illustrated*, vol. 1
- Kurose & Ross, *Computer Networking: A Top-Down Approach*
- RFCs 791 (IP), 793 (TCP), 1035 (DNS), 8446 (TLS 1.3)

**Usam mais:** Network, Cloud, Cloud Security, SRE
