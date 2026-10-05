# Resiliência, ETL leve e monitoramento de mudanças

> Parte do skill `eng-automation`. Leia este arquivo quando a tarefa precisar de retry, pipeline ETL leve ou monitoramento de mudanças no site.

### Resiliência e Retry

```typescript
// ✅ Retry com backoff exponencial
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelay?: number; label?: string } = {}
): Promise<T> {
  const { attempts = 3, baseDelay = 1000, label = 'operação' } = options

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === attempts) throw error

      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.warn(`${label} falhou (tentativa ${attempt}/${attempts}). Retry em ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error('Unreachable')
}

// Uso
const data = await withRetry(
  () => scrapePage(url),
  { attempts: 3, baseDelay: 2000, label: `scrape ${url}` }
)
```

#### Detectar mudanças de estrutura

```typescript
// ✅ Validar que os dados extraídos fazem sentido
function validateExtractedData(data: unknown[], schema: { field: string; required: boolean }[]) {
  const requiredFields = schema.filter((s) => s.required).map((s) => s.field)

  const issues = data.filter((item) =>
    requiredFields.some((field) => !item[field as keyof typeof item])
  )

  if (issues.length > 0) {
    const pct = Math.round((issues.length / data.length) * 100)
    console.warn(`ALERTA: ${issues.length}/${data.length} (${pct}%) itens com campos obrigatórios ausentes`)
    console.warn('Possível mudança de estrutura no site alvo. Verificar seletores.')
  }

  return data.filter((item) => requiredFields.every((f) => item[f as keyof typeof item]))
}
```

### Pipelines ETL Leve

#### Estrutura básica de pipeline

```typescript
interface PipelineConfig {
  sources: string[]       // URLs a processar
  transform: (raw: unknown) => unknown  // transformação de dados
  output: string          // caminho do arquivo de saída
  concurrency?: number    // requests simultâneos
}

async function runPipeline(config: PipelineConfig) {
  console.log(`Iniciando pipeline: ${config.sources.length} fontes`)

  // Extract
  const rawData = await scrapeUrls(config.sources)

  // Transform
  const transformed = rawData
    .flat()
    .map(config.transform)
    .filter(Boolean)

  // Deduplicação por URL ou ID
  const deduped = [...new Map(transformed.map((item) => [item.id ?? item.url, item])).values()]

  // Load
  await saveToFile(config.output, deduped)
  console.log(`Pipeline concluído: ${deduped.length} registros salvos em ${config.output}`)

  return deduped
}
```

#### Formatos de saída

```typescript
import { writeFileSync } from 'fs'
import { stringify } from 'csv-stringify/sync'

function saveToFile(path: string, data: unknown[]) {
  if (path.endsWith('.json')) {
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  } else if (path.endsWith('.csv')) {
    const csv = stringify(data as object[], { header: true })
    writeFileSync(path, csv, 'utf-8')
  } else if (path.endsWith('.ndjson')) {
    const ndjson = data.map((d) => JSON.stringify(d)).join('\n')
    writeFileSync(path, ndjson, 'utf-8')
  }
}
```

### Monitoramento de Mudanças

```typescript
// ✅ Detectar mudanças em páginas monitoradas
async function checkForChanges(url: string, storePath: string) {
  const current = await scrapeWithCheerio(url)
  const currentHash = crypto.createHash('md5').update(JSON.stringify(current)).digest('hex')

  let previous: { hash: string; data: unknown; timestamp: string } | null = null
  try {
    previous = JSON.parse(readFileSync(storePath, 'utf-8'))
  } catch {
    // primeira execução
  }

  if (previous?.hash === currentHash) {
    console.log('Sem mudanças detectadas.')
    return { changed: false }
  }

  // Persistir estado atual
  writeFileSync(storePath, JSON.stringify({ hash: currentHash, data: current, timestamp: new Date().toISOString() }))

  return { changed: true, current, previous: previous?.data }
}
```
