import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv, resolveEnvPath } from '../lib/env-loader.js'
import { GREEN, RED, YELLOW, DIM, NC } from '../lib/utils/ui.js'
import { logger } from '../lib/utils/logger.js'

/**
 * Verifica se existe um sign-off QA válido para a branch atual (ou informada).
 * Retorna 0 (válido) ou 1 (inválido/ausente) — usado pelo CI.
 *
 * @param {Object} flags
 * @param {string} flags.branch     - Branch a verificar (padrão: lido do git)
 * @param {string} flags['max-age'] - Validade máxima em horas (padrão: 24)
 */
export async function qaSignoff(flags = {}) {
  const cwd = process.cwd()
  const maxAgeHours = parseInt(flags['max-age'] ?? '24', 10)

  // Resolver branch
  let branch = flags.branch
  if (!branch) {
    try {
      const { execSync } = await import('node:child_process')
      branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim()
    } catch {
      logger.error(`${RED}❌ Não foi possível detectar a branch atual.${NC}`)
      logger.info(`${YELLOW}Passe a branch via --branch <nome>${NC}`)
      process.exit(1)
    }
  }

  if (!branch) {
    logger.error(`${RED}❌ Branch não identificada.${NC}`)
    process.exit(1)
  }

  // Carregar ENV.md para descobrir DOCS_FOLDER
  let docsFolder = 'docs'
  try {
    const resolved = resolveEnvPath(cwd, flags)
    const env = loadEnv(cwd, resolved.path)
    if (env.DOCS_FOLDER) docsFolder = env.DOCS_FOLDER
  } catch {
    // Se não encontrar ENV.md, usa default
  }

  const signoffsDir = join(cwd, docsFolder, 'engineering', 'qa', 'signoffs')

  if (!existsSync(signoffsDir)) {
    logger.error(`${RED}❌ Nenhum sign-off QA encontrado para a branch: ${branch}${NC}`)
    logger.info(`${YELLOW}Execute o workflow qa.release-signoff antes do deploy.${NC}`)
    process.exit(1)
  }

  // Normalizar slug da branch para busca nos nomes de arquivo
  const branchSlug = branch.replace(/\//g, '-').replace(/[^a-zA-Z0-9-_]/g, '-')

  // Buscar arquivos de sign-off que correspondam à branch
  const files = readdirSync(signoffsDir)
    .filter(f => f.endsWith('.md') && f.includes(branchSlug))
    .sort()
    .reverse() // mais recente primeiro

  if (files.length === 0) {
    logger.error(`${RED}❌ Nenhum sign-off QA encontrado para a branch: ${branch}${NC}`)
    logger.info(`${YELLOW}Execute o workflow qa.release-signoff antes do deploy.${NC}`)
    process.exit(1)
  }

  // Ler o sign-off mais recente
  const latestFile = files[0]
  const filePath = join(signoffsDir, latestFile)
  const content = readFileSync(filePath, 'utf-8')

  // Extrair frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    logger.error(`${RED}❌ Sign-off inválido: frontmatter ausente em ${latestFile}${NC}`)
    process.exit(1)
  }

  const frontmatter = frontmatterMatch[1]
  const statusMatch = frontmatter.match(/^status:\s*(.+)$/m)
  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m)

  const status = statusMatch?.[1]?.trim().replace(/['"]/g, '') ?? ''
  const dateStr = dateMatch?.[1]?.trim().replace(/['"]/g, '') ?? ''

  // Verificar status
  if (status.toUpperCase() !== 'GO') {
    logger.error(`${RED}❌ Sign-off com status ${status} — deploy bloqueado.${NC}`)
    logger.info(`${DIM}Arquivo: ${latestFile}${NC}`)
    process.exit(1)
  }

  // Verificar validade (max-age)
  if (dateStr) {
    const signoffDate = new Date(dateStr)
    const now = new Date()
    const ageHours = (now - signoffDate) / (1000 * 60 * 60)

    if (ageHours > maxAgeHours) {
      logger.error(`${RED}❌ Sign-off expirado: criado há ${Math.round(ageHours)}h (máximo: ${maxAgeHours}h).${NC}`)
      logger.info(`${YELLOW}Execute qa.release-signoff novamente antes do deploy.${NC}`)
      process.exit(1)
    }
  }

  logger.info(`${GREEN}✅ Sign-off QA válido para branch: ${branch}${NC}`)
  logger.info(`${DIM}Arquivo: ${latestFile} | Status: GO | Válido por mais ${Math.round(maxAgeHours - ((new Date() - new Date(dateStr)) / (1000 * 60 * 60)))}h${NC}`)
  process.exit(0)
}
