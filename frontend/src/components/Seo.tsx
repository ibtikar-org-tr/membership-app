import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
  noIndex?: boolean
  imagePath?: string
}

const SITE_NAME = 'منصة أعضاء إبتكار'
const DEFAULT_IMAGE_PATH = '/square_logo.svg'
const META_SELECTORS = {
  description: 'meta[name="description"]',
  robots: 'meta[name="robots"]',
  googlebot: 'meta[name="googlebot"]',
  ogTitle: 'meta[property="og:title"]',
  ogDescription: 'meta[property="og:description"]',
  ogType: 'meta[property="og:type"]',
  ogUrl: 'meta[property="og:url"]',
  ogImage: 'meta[property="og:image"]',
  ogSiteName: 'meta[property="og:site_name"]',
  ogLocale: 'meta[property="og:locale"]',
  twitterCard: 'meta[name="twitter:card"]',
  twitterTitle: 'meta[name="twitter:title"]',
  twitterDescription: 'meta[name="twitter:description"]',
  twitterImage: 'meta[name="twitter:image"]',
  canonical: 'link[rel="canonical"]',
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

function upsertCanonical(url: string) {
  const existingLink = document.head.querySelector(META_SELECTORS.canonical) as HTMLLinkElement | null

  if (existingLink) {
    existingLink.href = url
    return
  }

  const linkElement = document.createElement('link')
  linkElement.rel = 'canonical'
  linkElement.href = url
  document.head.appendChild(linkElement)
}

export function Seo({ title, description, noIndex = false, imagePath = DEFAULT_IMAGE_PATH }: SeoProps) {
  useEffect(() => {
    const currentUrl = new URL(window.location.href)
    currentUrl.hash = ''
    currentUrl.search = ''

    document.title = `${title} | ${SITE_NAME}`
    upsertMeta(META_SELECTORS.description, 'name', 'description', description)

    const robotsContent = noIndex ? 'noindex,nofollow' : 'index,follow'
    upsertMeta(META_SELECTORS.robots, 'name', 'robots', robotsContent)
    upsertMeta(META_SELECTORS.googlebot, 'name', 'googlebot', robotsContent)
    upsertMeta(META_SELECTORS.ogTitle, 'property', 'og:title', title)
    upsertMeta(META_SELECTORS.ogDescription, 'property', 'og:description', description)
    upsertMeta(META_SELECTORS.ogType, 'property', 'og:type', 'website')
    upsertMeta(META_SELECTORS.ogUrl, 'property', 'og:url', currentUrl.toString())
    upsertMeta(META_SELECTORS.ogImage, 'property', 'og:image', new URL(imagePath, window.location.origin).toString())
    upsertMeta(META_SELECTORS.ogSiteName, 'property', 'og:site_name', SITE_NAME)
    upsertMeta(META_SELECTORS.ogLocale, 'property', 'og:locale', 'ar_AR')
    upsertMeta(META_SELECTORS.twitterCard, 'name', 'twitter:card', 'summary_large_image')
    upsertMeta(META_SELECTORS.twitterTitle, 'name', 'twitter:title', title)
    upsertMeta(META_SELECTORS.twitterDescription, 'name', 'twitter:description', description)
    upsertMeta(META_SELECTORS.twitterImage, 'name', 'twitter:image', new URL(imagePath, window.location.origin).toString())
    upsertCanonical(currentUrl.toString())
  }, [description, imagePath, noIndex, title])

  return null
}