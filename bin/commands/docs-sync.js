import { loadEnv, resolveEnvPath } from '../lib/env-loader.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Sincroniza documentação do central-docs
 * Executado automaticamente em /warm-up
 * 
 * @param {Object} flags - Flags do comando
 * @param {boolean} flags.silent - Modo silencioso (sem output)
 * @param {boolean} flags.verbose - Modo verbose (mostra conteúdo)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsSync(flags = {}) {
  const cwd = process.cwd()
  
  // Resolver path do ENV.md (suporta --ide e --env-file)
  let envPath
  try {
    const resolved = resolveEnvPath(cwd, flags)
    envPath = resolved.path
  } catch (error) {
    if (!flags.silent) {
      console.error('❌ Erro ao resolver ENV.md:', error.message)
    }
    process.exit(1)
  }
  
  // Carregar ENV.md
  let env
  try {
    env = loadEnv(cwd, envPath)
  } catch (error) {
    if (!flags.silent) {
      console.error('❌ Erro ao carregar ENV.md:', error.message)
    }
    process.exit(1)
  }
  
  // Verificar se central-docs está configurado
  if (!env.CENTRAL_DOCS_REPO) {
    if (!flags.silent) {
      console.log('ℹ️  Central docs não configurado (CENTRAL_DOCS_REPO vazio)')
    }
    return
  }
  
  const { SQUAD, WORKSPACE, CENTRAL_DOCS_REF = 'main' } = env
  
  if (!SQUAD || !WORKSPACE) {
    if (!flags.silent) {
      console.error('❌ SQUAD ou WORKSPACE não definidos no ENV.md')
    }
    process.exit(1)
  }
  
  if (!flags.silent) {
    console.log(`🔄 Sincronizando docs do squad ${SQUAD}...`)
  }

  // Verificar se script fetch-file.sh existe
  // Usar path relativo ao módulo, não ao cwd do usuário
  const fetchScript = join(__dirname, '../lib/docs/fetch-file.sh')
  if (!existsSync(fetchScript)) {
    console.error('❌ Script não encontrado:', fetchScript)
    process.exit(1)
  }

  // Buscar index.md do squad
  const indexPath = `${SQUAD}/index.md`
  
  try {
    // Exportar variáveis de ambiente para o script bash
    const envVars = {
      ...process.env,
      CENTRAL_DOCS_REPO: env.CENTRAL_DOCS_REPO,
      CENTRAL_DOCS_CACHE_TTL: env.CENTRAL_DOCS_CACHE_TTL || '3600'
    }
    
    const { stdout, stderr } = await execAsync(
      `bash "${fetchScript}" "${indexPath}" "${CENTRAL_DOCS_REF}"`,
      { env: envVars }
    )
    
    if (!flags.silent) {
      console.log('✅ Docs sincronizados')
    }
    
    if (flags.verbose && stdout) {
      console.log('\n📄 Conteúdo do index.md:\n')
      console.log(stdout)
    }
    
    // Parsear index.md para contar documentos
    if (!flags.silent && stdout) {
      const prdCount = (stdout.match(/\[prd-.*\.md\]/g) || []).length
      const frdCount = (stdout.match(/\[frd-.*\.md\]/g) || []).length
      const ardCount = (stdout.match(/\[ard-.*\.md\]/g) || []).length
      const rfcCount = (stdout.match(/\[rfc-.*\.md\]/g) || []).length
      
      const total = prdCount + frdCount + ardCount + rfcCount
      
      if (total > 0) {
        console.log(`📊 ${total} documentos disponíveis:`)
        if (prdCount > 0) console.log(`   - ${prdCount} PRD(s)`)
        if (frdCount > 0) console.log(`   - ${frdCount} FRD(s)`)
        if (ardCount > 0) console.log(`   - ${ardCount} ARD(s)`)
        if (rfcCount > 0) console.log(`   - ${rfcCount} RFC(s)`)
      }
    }
    
    if (stderr && !flags.silent) {
      console.warn('⚠️  Avisos:', stderr)
    }
    
  } catch (error) {
    if (!flags.silent) {
      console.error('❌ Erro ao sincronizar docs:', error.message)
      
      // Dicas de troubleshooting
      if (error.message.includes('Token GitLab')) {
        console.error('\n💡 Configure o token GitLab no .npmrc:')
        console.error('   //gitlab.com/api/v4/packages/npm/:_authToken=seu-token')
      } else if (error.message.includes('não encontrado')) {
        console.error('\n💡 Verifique se o squad existe no central-docs:')
        console.error(`   ${SQUAD}/index.md`)
      }
    }

    process.exit(1)
  }
}
