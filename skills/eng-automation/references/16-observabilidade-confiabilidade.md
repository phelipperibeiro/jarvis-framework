# 16. Observabilidade e Confiabilidade de Automações

**Nível:** FUNDAMENTAL · **Agnóstico de tecnologia:** ✅

**Objetivo:** Saber se as automações funcionam, se os dados estão corretos e quando as fontes mudam.

**Conhecimentos:** logs estruturados com identificador de execução; taxa de sucesso, duração, volume, atraso e frescor; rastreamento ponta a ponta; trilha de auditoria, inclusive de intervenção humana; alertas por sintoma (SLO), não por ruído; detecção de mudança na fonte: esquema, layout, volume; verificações pós-execução: contagem, completude, anomalia; painéis de saúde e de custo; monitores canário contra as fontes; dono, runbook e revisão de incidentes.

**Princípios:**
- Sucesso do processo não é sucesso do dado: valide o resultado.
- Detecte a mudança na fonte antes do consumidor.
- Toda automação tem dono, runbook e alerta.

**Fora do escopo:** ferramentas de monitoramento e painéis específicos.

**Pergunta-chave:** Como você sabe, sem ninguém avisar, que a automação de ontem rodou e entregou dados corretos?

**Referências:**
- Beyer et al., *Site Reliability Engineering*, cap. 6
- Majors, Fong-Jones & Miranda, *Observability Engineering*
- Moses, Gavish & Vorwerck, *Data Quality Fundamentals*
- Especificação OpenTelemetry

**Usam mais:** Automation Engineering, todas as áreas
