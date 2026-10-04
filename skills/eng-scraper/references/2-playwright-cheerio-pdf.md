# Playwright, Cheerio e parsing de PDFs

> Parte do skill `eng-scraper`. Leia este arquivo quando a tarefa exigir Playwright, scraping de HTML estático com Cheerio ou extração de PDFs.

### Playwright — Alternativa (quando necessário)

Usar Playwright quando Puppeteer não resolver o caso de uso (ex: multi-browser testing, maior controle de contexto).

```typescript
import { chromium } from 'playwright'

// Mesma lógica do Puppeteer — API similar com pequenas diferenças:
// page.goto(url, { waitUntil: 'networkidle' }) → sem o "2" no Playwright
// page.$() → page.locator() é o padrão moderno no Playwright
// page.evaluate() → idêntico
```

### Cheerio — Scraping de HTML Estático

```typescript
import * as cheerio from 'cheerio'

async function scrapeWithCheerio(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MyBot/1.0; +https://meusite.com/bot)',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // ✅ Extração com Cheerio
  const articles = $('article.post').map((_, el) => ({
    title: $(el).find('h2').text().trim() || null,
    date: $(el).find('time').attr('datetime') || null,
    url: $(el).find('a.read-more').attr('href') || null,
    summary: $(el).find('.excerpt').text().trim() || null,
  })).get()

  return articles.filter((a) => a.title && a.url)
}
```

### Parsing de PDFs

```typescript
import pdfParse from 'pdf-parse'
import { readFileSync } from 'fs'

async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = readFileSync(filePath)
  const { text, numpages } = await pdfParse(buffer)
  console.log(`PDF processado: ${numpages} páginas`)
  return text
}

// ✅ Extrair tabela de texto de PDF (regex + heurística)
function extractTableFromText(text: string, headers: string[]): Record<string, string>[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: Record<string, string>[] = []

  for (const line of lines) {
    // lógica específica para o formato do PDF alvo
    const match = line.match(/(\w+)\s+([\d,.]+)\s+([\d,.]+)/)
    if (match) {
      results.push({
        [headers[0]]: match[1],
        [headers[1]]: match[2],
        [headers[2]]: match[3],
      })
    }
  }

  return results
}
```
