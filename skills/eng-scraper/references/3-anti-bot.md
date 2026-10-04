# Técnicas Anti-Bot

> Parte do skill `eng-scraper`. Leia este arquivo quando o site bloquear requests (403/429, captcha, fingerprint).

### Técnicas Anti-Bot

#### Headers realistas

```typescript
// ✅ Headers que imitam browser real
const realisticHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
}
```

#### Rate limiting e delays aleatórios

```typescript
// ✅ Delay com jitter para comportamento orgânico
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ✅ Controle de concorrência (evitar sobrecarga no alvo)
import PQueue from 'p-queue'

const queue = new PQueue({
  concurrency: 2,         // máximo 2 requests simultâneos
  intervalCap: 5,         // máximo 5 requests
  interval: 10_000,       // por 10 segundos
})

async function scrapeUrls(urls: string[]) {
  return Promise.all(
    urls.map((url) => queue.add(async () => {
      await randomDelay(500, 1500)
      return scrapeUrl(url)
    }))
  )
}
```

#### Puppeteer — reduzir fingerprint de automação

```typescript
import puppeteer from 'puppeteer'
import { executablePath } from 'puppeteer'

// ✅ Ocultar sinais de automação via page.evaluateOnNewDocument
async function createStealthPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  await page.setViewport({ width: 1366, height: 768 })

  // Remover propriedades que identificam automação
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] })
  })

  return page
}
```

#### Rotação de proxies

```typescript
// ✅ Pool de proxies com rotação
const proxies = [
  'http://user:pass@proxy1:8080',
  'http://user:pass@proxy2:8080',
  'http://user:pass@proxy3:8080',
]

function getRandomProxy(): string {
  return proxies[Math.floor(Math.random() * proxies.length)]
}

const browser = await puppeteer.launch({
  headless: true,
  args: [`--proxy-server=${getRandomProxy()}`, '--no-sandbox'],
})
```
