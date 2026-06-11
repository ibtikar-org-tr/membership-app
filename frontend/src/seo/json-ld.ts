import {
  DEFAULT_DESCRIPTION,
  ORGANIZATION_NAME,
  SITE_LANGUAGE,
  SITE_NAME,
  getSiteOrigin,
  joinUrl,
  resolveAssetUrl,
  getRouterBasePath,
} from './config'

export function buildHomePageJsonLd() {
  const origin = getSiteOrigin()
  const basePath = getRouterBasePath()
  const siteUrl = joinUrl(origin, basePath)
  const logoUrl = resolveAssetUrl('/square_logo.svg')

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: ORGANIZATION_NAME,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
        },
        sameAs: ['https://t.me/ibtikar_org', 'https://t.me/ibtikar_bot'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: SITE_LANGUAGE,
        publisher: {
          '@id': `${siteUrl}#organization`,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}#webpage`,
        url: siteUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        isPartOf: {
          '@id': `${siteUrl}#website`,
        },
        inLanguage: SITE_LANGUAGE,
      },
    ],
  }
}

export function buildWebPageJsonLd(title: string, description: string, pathname: string) {
  const origin = getSiteOrigin()
  const basePath = getRouterBasePath()
  const pageUrl = joinUrl(origin, basePath, pathname.replace(/^\/+/, ''))
  const siteUrl = joinUrl(origin, basePath)

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: pageUrl,
    name: title,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
    },
    inLanguage: SITE_LANGUAGE,
  }
}
