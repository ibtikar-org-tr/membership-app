import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')

const siteUrl = (process.env.VITE_SITE_URL || 'https://ibtikar.tr').trim().replace(/\/+$/, '')
const basePathRaw = process.env.VITE_BASE_PATH || '/mf/membership-app/'
const basePath = basePathRaw === '/.' ? '/' : basePathRaw.endsWith('/') ? basePathRaw : `${basePathRaw}/`
const outDir = path.join(frontendRoot, 'dist', basePath === '/' ? '' : basePath.slice(1))

const publicRoutes = [
  { path: '', changefreq: 'weekly', priority: '1.0' },
  { path: 'registration', changefreq: 'monthly', priority: '0.9' },
  { path: 'telegram-bot', changefreq: 'monthly', priority: '0.8' },
]

const privatePrefixes = ['dashboard', 'login', 'iforgot', 'reset-password']

function joinUrl(routePath = '') {
  const base = basePath === '/' ? '' : basePath.replace(/\/+$/, '')
  const route = routePath.replace(/^\/+/, '').replace(/\/+$/, '')

  if (!route) {
    return `${siteUrl}${base}/`
  }

  return `${siteUrl}${base}/${route}`
}

function buildRobotsTxt() {
  const disallowLines = privatePrefixes
    .map((segment) => {
      const disallowPath = basePath === '/' ? `/${segment}` : `${basePath.replace(/\/$/, '')}/${segment}`
      return `Disallow: ${disallowPath}`
    })
    .join('\n')

  return `User-agent: *
Allow: ${basePath === '/' ? '/' : basePath}
${disallowLines}

Sitemap: ${joinUrl('sitemap.xml')}
`.trim()
}

function buildSitemapXml() {
  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = publicRoutes
    .map((route) => {
      const loc = joinUrl(route.path)
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

mkdirSync(outDir, { recursive: true })
writeFileSync(path.join(outDir, 'robots.txt'), `${buildRobotsTxt()}\n`, 'utf8')
writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemapXml(), 'utf8')

console.log(`Generated SEO files in ${outDir}`)
