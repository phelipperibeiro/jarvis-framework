# Puppeteer

> Parte do skill `eng-automation`. Leia este arquivo quando a tarefa usar Puppeteer (ferramenta principal do projeto) para navegar e extrair dados.

### Puppeteer — Ferramenta Principal (padrão do projeto)

Puppeteer é a ferramenta padrão para scraping com browser headless. Todo código de scraping deve ser em TypeScript e, quando integrado ao sistema, implementado como `@Injectable()` NestJS.

#### Setup básico

```typescript
import puppeteer, { Browser, Page } from 'puppeteer'

async function createBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  })
}

// ✅ Sempre fechar browser após uso
async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await createBrowser()
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}
```

#### NestJS — ScraperService como @Injectable

```typescript
import { Injectable, Logger } from '@nestjs/common'
import puppeteer, { Browser, Page } from 'puppeteer'

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name)

  async scrapeProducts(url: string): Promise<Product[]> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })

    try {
      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...')

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 })
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 10_000 })

      const products = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid="product-card"]')).map((card) => ({
          name: card.querySelector('h2')?.textContent?.trim() ?? null,
          price: card.querySelector('[data-price]')?.getAttribute('data-price') ?? null,
          url: (card.querySelector('a') as HTMLAnchorElement)?.href ?? null,
        }))
      )

      const valid = products.filter((p) => p.name && p.price)
      if (valid.length < products.length) {
        this.logger.warn(`${products.length - valid.length} produtos com dados incompletos ignorados`)
      }

      return valid as Product[]
    } finally {
      await browser.close()
    }
  }
}
```

#### Interceptar chamadas de API interna

```typescript
// ✅ Mais estável que scraping de HTML — dados estruturados direto da API interna
async function interceptApiData(url: string, apiPattern: RegExp): Promise<unknown[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    const captured: unknown[] = []

    await page.setRequestInterception(true)

    page.on('request', (req) => req.continue())

    page.on('response', async (response) => {
      if (apiPattern.test(response.url()) && response.headers()['content-type']?.includes('json')) {
        try {
          captured.push(await response.json())
        } catch {
          // ignorar responses não-JSON
        }
      }
    })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 })

    return captured
  })
}

// Uso: interceptar chamadas de /api/products/*
const data = await interceptApiData('https://loja.com/produtos', /\/api\/products/)
```

#### Paginação automática

```typescript
async function scrapeAllPages(baseUrl: string): Promise<unknown[]> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    const allItems: unknown[] = []
    let pageNum = 1
    let hasNextPage = true

    while (hasNextPage) {
      await page.goto(`${baseUrl}?page=${pageNum}`, { waitUntil: 'networkidle2' })

      const items = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.item')).map((el) => ({
          title: el.querySelector('h3')?.textContent?.trim() ?? null,
        }))
      )

      allItems.push(...items)

      hasNextPage = (await page.$('[aria-label="Próxima página"]:not([disabled])')) !== null
      pageNum++

      await randomDelay(1000, 3000)
    }

    return allItems
  })
}
```
