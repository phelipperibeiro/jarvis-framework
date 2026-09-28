import { readFileSync } from 'node:fs'

/**
 * Valida frontmatter YAML de documentos (PRD, FRD, ARD, RFC)
 * 
 * @param {string} filePath - Caminho do arquivo
 * @param {string} tipo - Tipo do documento (prd|frd|ard|rfc)
 * @returns {Object} Metadados extraídos
 * @throws {Error} Se frontmatter for inválido
 */
export function validateFrontmatter(filePath, tipo) {
  const content = readFileSync(filePath, 'utf-8')
  
  // Extrair frontmatter YAML (entre --- e ---)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  
  if (!frontmatterMatch) {
    throw new Error(
      `Frontmatter YAML não encontrado em ${filePath}\n` +
      'Formato esperado:\n' +
      '---\n' +
      'id: DOC-001\n' +
      'version: 1.0.0\n' +
      '---'
    )
  }

  const frontmatter = frontmatterMatch[1]
  const metadata = parseFrontmatter(frontmatter)

  // Validar campos obrigatórios por tipo
  const requiredFields = getRequiredFields(tipo)
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
  const validStatuses = ['icebox', 'in_review', 'in_progress', 'in_production', 'deprecated', 'Proposta', 'Em desenvolvimento', 'Em validação', 'Finalizada', 'Draft', 'In Review', 'Ready for Decision', 'Accepted', 'Rejected', 'Superseded']
  
  if (metadata.status && !validStatuses.includes(metadata.status)) {
    console.warn(
      `⚠️  Status "${metadata.status}" não está na lista padrão.\n` +
      `Status válidos: ${validStatuses.join(', ')}`
    )
  }

  return metadata
}

/**
 * Parseia frontmatter YAML simples (key: value)
 * 
 * @param {string} frontmatter - Conteúdo do frontmatter
 * @returns {Object} Metadados parseados
 */
function parseFrontmatter(frontmatter) {
  const metadata = {}
  const lines = frontmatter.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()

    if (key && value) {
      metadata[key] = value
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
    prd: ['id', 'name', 'version', 'status'],
    frd: ['id', 'name', 'version', 'status', 'related_prd'],
    ard: ['Status', 'Data', 'Autor', 'Versão'],
    rfc: ['Status', 'Criado em', 'Proponente'],
    'qa-report': ['period', 'squad', 'version']
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
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  
  if (!frontmatterMatch) {
    return {}
  }

  const metadata = parseFrontmatter(frontmatterMatch[1])

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
