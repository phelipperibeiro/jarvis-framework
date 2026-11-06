import { readFileSync } from 'node:fs'
import { parseFrontmatter, extractFrontmatterBlock } from '../utils/frontmatter.js'

/**
 * Valida frontmatter YAML da consolidação do Central docs (feature, delivery) e de documentos
 * de trabalho (PRD, FRD, épico, história, tarefa, ARD, RFC, relatório de QA)
 * 
 * @param {string} filePath - Caminho do arquivo
 * @param {string} tipo - Tipo do documento (ver VALID_TYPES em publish-file.js)
 * @returns {Object} Metadados extraídos
 * @throws {Error} Se frontmatter for inválido
 */
export function validateFrontmatter(filePath, tipo) {
  const content = readFileSync(filePath, 'utf-8')

  const frontmatter = extractFrontmatterBlock(content)
  const requiredFields = getRequiredFields(tipo)

  // Tipo sem campo obrigatório (ex.: swagger, um YAML/JSON sem a cerca `---`/`---` de frontmatter):
  // sem frontmatter para exigir, não há o que validar.
  if (frontmatter === null && requiredFields.length === 0) {
    return {}
  }

  if (frontmatter === null) {
    throw new Error(
      `Frontmatter YAML não encontrado em ${filePath}\n` +
      'Formato esperado:\n' +
      '---\n' +
      'id: DOC-001\n' +
      'version: 1.0.0\n' +
      '---'
    )
  }

  const metadata = parseFrontmatter(content)

  // Validar campos obrigatórios por tipo
  const missingFields = []

  for (const field of requiredFields) {
    if (!metadata[field]) {
      missingFields.push(field)
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Campos obrigatórios ausentes no frontmatter de ${tipo.toUpperCase()}:\n` +
      missingFields.map(f => `  - ${f}`).join('\n') +
      '\n\nFrontmatter atual:\n' + frontmatter
    )
  }

  // Validar formato de version (X.Y.Z)
  if (metadata.version && !metadata.version.match(/^\d+\.\d+(\.\d+)?$/)) {
    throw new Error(
      `Formato de version inválido: "${metadata.version}"\n` +
      'Formato esperado: X.Y.Z (ex: 1.0.0 ou 1.2)'
    )
  }

  // Validar status
  // Produto (rules/product/prod-rules.md), ARD (templates/engineering/ARD-template.md),
  // discovery (prod-discovery-template.md), RFC (RFC-template.md) e
  // SPEC (templates/engineering/ref-spec-template.md)
  const validStatuses = [
    'icebox', 'in_review', 'backlog', 'in_progress', 'in_production', 'cancelled', 'deprecated',
    'proposed', 'approved', 'superseded',
    'Draft', 'In Review', 'Ready for Decision', 'Accepted', 'Rejected', 'Superseded'
  ]
  
  if (metadata.status && !validStatuses.includes(metadata.status)) {
    console.warn(
      `⚠️  Status "${metadata.status}" não está na lista padrão.\n` +
      `Status válidos: ${validStatuses.join(', ')}`
    )
  }

  // Labels no padrão Confluence (Q2 da #220): minúsculas, letras/números/hífen, sem espaço.
  // Opcional — documento antigo sem o campo continua válido (Q6: a migração não inventa labels).
  if (metadata.labels) {
    // Sintaxe de lista YAML (`{a, b}` ou `[a, b]`, #220 item 13): tira os colchetes/chaves
    // antes de separar por vírgula, senão o primeiro e o último label ficam presos a eles e
    // a mensagem de erro aponta "label" inválido mesmo quando todos estão certos.
    const semColchetes = metadata.labels.replace(/^[{[]/, '').replace(/[}\]]$/, '')
    const invalidas = semColchetes
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l && !/^[a-z0-9][a-z0-9-]*$/.test(l))
    if (invalidas.length > 0) {
      throw new Error(
        `Labels fora do padrão em ${filePath}: ${invalidas.join(', ')}\n` +
        'Use minúsculas, números e hífen, sem espaço (ex.: arquitetura, decisao).'
      )
    }
  }

  return metadata
}

/**
 * Retorna campos obrigatórios por tipo de documento
 * 
 * @param {string} tipo - Tipo do documento
 * @returns {string[]} Lista de campos obrigatórios
 */
function getRequiredFields(tipo) {
  const fields = {
    // Consolidação do Central docs (/eng.spec-consolidate)
    feature: ['id', 'name', 'status', 'product', 'updated_at'],
    delivery: ['id', 'feature', 'task_key', 'pr', 'date'],
    // Central docs: página do produto (transversal, Q22) e página inicial do squad (Q16)
    product: ['id', 'name', 'updated_at'],
    home: ['name'],
    // Documentos de trabalho (validação usada fora do publish; os mesmos tipos, agora também
    // publicáveis em decisions/ quando ligados a uma entrega consolidada — Q1, Q9, Q10 da #220)
    prd: ['id', 'name', 'version', 'status'],
    frd: ['id', 'name', 'version', 'status', 'related_prd'],
    feat: ['id', 'name', 'version', 'status', 'related_prd'],
    epic: ['id', 'name', 'version', 'status', 'related_prd'],
    story: ['id', 'name', 'status', 'related_prd'],
    task: ['id', 'name', 'status'],
    ard: ['id', 'name', 'version', 'status'],
    rfc: ['Status', 'Criado em', 'Proponente'],
    discovery: ['id', 'name', 'status'],
    'qa-report': ['period', 'squad', 'version']
    // swagger, history, architecture, plan e light-arch: sem campo obrigatório — swagger pode ser
    // um YAML/JSON sem a cerca de frontmatter; history (gate-checklist.md, daily.md,
    // task-comment-*.md, scripts e saídas da sessão) tem formato próprio; architecture.md,
    // plan.md e light-arch.md da sessão não têm frontmatter (#229).
  }

  return fields[tipo] || []
}

/**
 * Extrai metadados específicos do frontmatter
 * 
 * @param {string} filePath - Caminho do arquivo
 * @returns {Object} Metadados extraídos (id, version, status, jira, etc)
 */
export function extractMetadata(filePath) {
  const content = readFileSync(filePath, 'utf-8')

  if (extractFrontmatterBlock(content) === null) {
    return {}
  }

  const metadata = parseFrontmatter(content)

  // Normalizar campos (suportar variações de nomenclatura)
  const taskLink = metadata.task_link || metadata.jira
  const jiraId = taskLink ? extractJiraFromContent(taskLink) : extractJiraFromContent(content)
  
  return {
    id: metadata.id || metadata.ID,
    name: metadata.name || metadata.Name,
    version: metadata.version || metadata.Version || metadata.Versão,
    status: metadata.status || metadata.Status,
    jira: jiraId,
    related_prd: metadata.related_prd,
    author: metadata.author || metadata.Autor || metadata.created_by,
    date: metadata.date || metadata.Data || metadata.created_at
  }
}

/**
 * Extrai Jira ID do conteúdo (fallback se não estiver no frontmatter)
 * 
 * @param {string} content - Conteúdo do arquivo
 * @returns {string|null} Jira ID ou null
 */
function extractJiraFromContent(content) {
  const match = content.match(/\b([A-Z]+-\d+)\b/)
  return match ? match[1] : null
}
