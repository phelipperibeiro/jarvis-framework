# 5. Contêineres e Orquestração

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Compreender empacotamento isolado e orquestração declarativa de cargas.

**Conhecimentos:** isolamento por namespaces e cgroups; imagem vs. contêiner e camadas; registries, assinatura e reprodutibilidade; stateless vs. stateful; scheduling e bin packing; descoberta de serviço; health checks e probes; requests e limits de recursos; autoscaling; laço de reconciliação (controladores/operators); configuração e segredos externalizados.

**Princípios:**
- Contêiner é processo isolado, não máquina virtual.
- Orquestração é reconciliar estado desejado com o observado.
- Aplicação deve ser descartável e reiniciável.

**Fora do escopo:** comandos, manifestos e APIs de um orquestrador específico.

**Pergunta-chave:** O que acontece com o estado de um contêiner quando ele é reagendado em outro nó?

**Referências:**
- Burns, *Designing Distributed Systems*
- Verma et al., *Large-scale cluster management at Google with Borg* (EuroSys 2015)
- NIST SP 800-190, *Application Container Security Guide*
- Wiggins, *The Twelve-Factor App*
- OCI Image & Runtime Specifications

**Usam mais:** Platform, DevOps, Cloud, SRE
