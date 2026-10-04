import { loadEnv, resolveEnvPath } from '../lib/env-loader.js'
import { execSync } from 'node:child_process'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Publica documento no central-docs via GitLab API (branch + MR)
 * 
 * @param {Object} flags - Flags do comando
 * @param {string} flags.file - Caminho do arquivo local
 * @param {string} flags.tipo - Tipo do documento (prd|frd|ard|rfc)
 * @param {string} flags.feature - Slug da feature (kebab-case)
 * @param {string} flags.squad - Squad (opcional, override do ENV.md)
 * @param {string} flags.workspace - Workspace (opcional, override do ENV.md)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsPublish(flags = {}) {
  const { file, tipo, feature, squad: squadOverride, workspace: workspaceOverride } = flags
  
  // Validar parâmetros obrigatórios
  if (!file || !tipo || !feature) {
    console.error('❌ Parâmetros obrigatórios faltando\n')
    console.error('Uso: jarvis docs publish --file <path> --tipo <prd|frd|ard|rfc|swagger|qa-report> --feature <slug> [--squad <squad>] [--workspace <workspace>]\n')
    console.error('Exemplo:')
    console.error('  jarvis docs publish \\')
    console.error('    --file ./docs/engineering/ard-api-wallet.md \\')
    console.error('    --tipo ard \\')
    console.error('    --feature api-wallet-auth-jwt')
    console.error('')
    console.error('  # Publicar Swagger/OpenAPI:')
    console.error('  jarvis docs publish \\')
    console.error('    --file ./docs/engineering/swagger/api-wallet.yaml \\')
    console.error('    --tipo swagger \\')
    console.error('    --feature api-wallet')
    console.error('')
    console.error('  # Com override de squad/workspace:')
    console.error('  jarvis docs publish \\')
    console.error('    --file ./docs/engineering/ard-api-wallet.md \\')
    console.error('    --tipo ard \\')
    console.error('    --feature api-wallet-auth-jwt \\')
    console.error('    --squad core \\')
    console.error('    --workspace meu-workspace')
    process.exit(1)
  }
  
  // Validar tipo
  const validTypes = ['prd', 'frd', 'ard', 'rfc', 'swagger', 'qa-report']
  if (!validTypes.includes(tipo)) {
    console.error(`❌ Tipo inválido: ${tipo}`)
    console.error(`Tipos válidos: ${validTypes.join(', ')}`)
    process.exit(1)
  }
  
  // Validar se arquivo existe
  if (!existsSync(file)) {
    console.error(`❌ Arquivo não encontrado: ${file}`)
    process.exit(1)
  }
  
  const cwd = process.cwd()
  
  // Resolver path do ENV.md (suporta --ide e --env-file)
  let envPath
  try {
    const resolved = resolveEnvPath(cwd, flags)
    envPath = resolved.path
  } catch (error) {
    console.error('❌ Erro ao resolver ENV.md:', error.message)
    process.exit(1)
  }
  
  // Carregar ENV.md
  let env
  try {
    env = loadEnv(cwd, envPath)
  } catch (error) {
    console.error('❌ Erro ao carregar ENV.md:', error.message)
    process.exit(1)
  }
  
  // Verificar se central-docs está configurado
  if (!env.CENTRAL_DOCS_REPO) {
    console.error('❌ CENTRAL_DOCS_REPO não configurado no ENV.md')
    console.error('\nConfigure a URL do repositório central:')
    console.error('  CENTRAL_DOCS_REPO=https://gitlab.com/org/central-docs.git')
    process.exit(1)
  }
  
  // Usar override de squad/workspace se fornecido, senão usar do ENV.md
  const squad = squadOverride || env.SQUAD
  const workspace = workspaceOverride || env.WORKSPACE
  
  if (!squad || !workspace) {
    console.error('❌ SQUAD ou WORKSPACE não definidos')
    console.error('\nOpções:')
    console.error('  1. Definir no ENV.md:')
    console.error('     SQUAD=core')
    console.error('     WORKSPACE=meu-workspace')
    console.error('')
    console.error('  2. Passar via flags:')
    console.error('     --squad core --workspace meu-workspace')
    process.exit(1)
  }
  
  // Verificar se script publish-file.sh existe
  // Usar path relativo ao módulo, não ao cwd do usuário
  const publishScript = join(__dirname, '../lib/docs/publish-file.sh')
  if (!existsSync(publishScript)) {
    console.error('❌ Script não encontrado:', publishScript)
    process.exit(1)
  }
  
  console.log(`📤 Publicando ${tipo.toUpperCase()} ${feature}...\n`)
  
  try {
    // Exportar variáveis de ambiente para o script bash
    const envVars = {
      ...process.env,
      CENTRAL_DOCS_REPO: env.CENTRAL_DOCS_REPO,
      CENTRAL_DOCS_TARGET_BRANCH: env.CENTRAL_DOCS_TARGET_BRANCH || 'dev',
      CENTRAL_DOCS_CACHE_TTL: env.CENTRAL_DOCS_CACHE_TTL || '3600',
      SQUAD_OVERRIDE: squad,
      WORKSPACE_OVERRIDE: workspace
    }
    
    const { stdout, stderr } = await execAsync(
      `bash "${publishScript}" "${file}" "${tipo}" "${feature}"`,
      { 
        env: envVars,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer para output grande
      }
    )
    
    // Exibir output do script
    if (stdout) {
      console.log(stdout)
    }
    
    if (stderr) {
      console.warn('⚠️  Avisos:', stderr)
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao publicar documento\n')
    
    // Exibir output de erro do script
    if (error.stdout) {
      console.log(error.stdout)
    }
    
    if (error.stderr) {
      console.error(error.stderr)
    }
    
    // Dicas de troubleshooting
    console.error('\n💡 Troubleshooting:\n')
    
    if (error.message.includes('Token GitLab')) {
      console.error('1. Configure o token GitLab no .npmrc:')
      console.error('   //gitlab.com/api/v4/packages/npm/:_authToken=seu-token\n')
    }
    
    if (error.message.includes('Campos obrigatórios')) {
      console.error('2. Verifique o frontmatter do documento:')
      console.error(`   Tipo ${tipo} requer campos específicos no YAML\n`)
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('4. Verifique permissões no GitLab:')
      console.error('   Token precisa de scopes: api, read_api, write_repository\n')
    }
    
    console.error('Para mais detalhes, execute com --verbose')
    
    process.exit(1)
  }
}
