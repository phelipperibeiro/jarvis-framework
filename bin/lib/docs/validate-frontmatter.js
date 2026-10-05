import { readFileSync } from 'node:fs'
import { parseFrontmatter, extractFrontmatterBlock } from '../utils/frontmatter.js'

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

  const frontmatter = extractFrontmatterBlock(content)

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
