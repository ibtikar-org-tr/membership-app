import { useEffect } from 'react'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  resolveAssetUrl,
  resolveCanonicalUrl,
} from '../seo/config'

interface SeoProps {
  title: string
  description?: string
  noIndex?: boolean
  imagePath?: string
  keywords?: string
  pathname?: string
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

const JSON_LD_ID = 'membership-app-json-ld'

const META_SELECTORS = {
  description: 'meta[name="description"]',
  keywords: 'meta[name="keywords"]',
  author: 'meta[name="author"]',
  robots: 'meta[name="robots"]',
  googlebot: 'meta[name="googlebot"]',
  ogTitle: 'meta[property="og:title"]',
  ogDescription: 'meta[property="og:description"]',
  ogType: 'meta[property="og:type"]',
  ogUrl: 'meta[property="og:url"]',
  ogImage: 'meta[property="og:image"]',
  ogImageAlt: 'meta[property="og:image:alt"]',
  ogSiteName: 'meta[property="og:site_name"]',
  ogLocale: 'meta[property="og:locale"]',
  twitterCard: 'meta[name="twitter:card"]',
  twitterTitle: 'meta[name="twitter:title"]',
  twitterDescription: 'meta[name="twitter:description"]',
  twitterImage: 'meta[name="twitter:image"]',
  canonical: 'link[rel="canonical"]',
  sitemap: 'link[rel="sitemap"]',
} as const

function upsertMeta(selector: string, attributeName: 'name' | 'property', attributeValue: string, content: string) {
  const existingElement = document.head.querySelector(selector) as HTMLMetaElement | null

  if (existingElement) {
    existingElement.content = content
    return
  }

  const metaElement = document.createElement('meta')
  metaElement.setAttribute(attributeName, attributeValue)
  metaElement.content = content
  document.head.appendChild(metaElement)
}

function upsertLink(rel: string, href: string, type?: string) {
  const selector = type ? `link[rel="${rel}"][type="${type}"]` : `link[rel="${rel}"]`
  const existingLink = document.head.querySelector(selector) as HTMLLinkElement | null

  if (existingLink) {
    existingLink.href = href
    return
  }

  const linkElement = document.createElement('link')
  linkElement.rel = rel
  linkElement.href = href
  if (type) {
    linkElement.type = type
  }
  document.head.appendChild(linkElement)
}

function upsertJsonLd(jsonLd: SeoProps['jsonLd']) {
  const existingScript = document.getElementById(JSON_LD_ID)
  if (existingScript) {
    existingScript.remove()
  }

  if (!jsonLd) {
    return
  }

  const script = document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(jsonLd)
  document.head.appendChild(script)
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  noIndex = false,
  imagePath = DEFAULT_OG_IMAGE,
  keywords = DEFAULT_KEYWORDS,
  pathname,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = resolveCanonicalUrl(pathname)
    const imageUrl = resolveAssetUrl(imagePath)
    const sitemapUrl = resolveAssetUrl('sitemap.xml')
    const pageTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`

    document.documentElement.lang = SITE_LANGUAGE
    document.title = pageTitle

    upsertMeta(META_SELECTORS.description, 'name', 'description', description)
    upsertMeta(META_SELECTORS.keywords, 'name', 'keywords', keywords)
    upsertMeta(META_SELECTORS.author, 'name', 'author', SITE_NAME)

    const robotsContent = noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'
    upsertMeta(META_SELECTORS.robots, 'name', 'robots', robotsContent)
    upsertMeta(META_SELECTORS.googlebot, 'name', 'googlebot', robotsContent)

    upsertMeta(META_SELECTORS.ogTitle, 'property', 'og:title', pageTitle)
    upsertMeta(META_SELECTORS.ogDescription, 'property', 'og:description', description)
    upsertMeta(META_SELECTORS.ogType, 'property', 'og:type', 'website')
    upsertMeta(META_SELECTORS.ogUrl, 'property', 'og:url', canonicalUrl)
    upsertMeta(META_SELECTORS.ogImage, 'property', 'og:image', imageUrl)
    upsertMeta(META_SELECTORS.ogImageAlt, 'property', 'og:image:alt', SITE_NAME)
    upsertMeta(META_SELECTORS.ogSiteName, 'property', 'og:site_name', SITE_NAME)
    upsertMeta(META_SELECTORS.ogLocale, 'property', 'og:locale', SITE_LOCALE)

    upsertMeta(META_SELECTORS.twitterCard, 'name', 'twitter:card', 'summary_large_image')
    upsertMeta(META_SELECTORS.twitterTitle, 'name', 'twitter:title', pageTitle)
    upsertMeta(META_SELECTORS.twitterDescription, 'name', 'twitter:description', description)
    upsertMeta(META_SELECTORS.twitterImage, 'name', 'twitter:image', imageUrl)

    upsertLink('canonical', canonicalUrl)
    upsertLink('sitemap', sitemapUrl, 'application/xml')

    upsertJsonLd(jsonLd)

    return () => {
      const script = document.getElementById(JSON_LD_ID)
      script?.remove()
    }
  }, [description, imagePath, jsonLd, keywords, noIndex, pathname, title])

  return null
}
