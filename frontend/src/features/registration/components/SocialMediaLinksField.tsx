import { useMemo, useState } from 'react'
import type { IconType } from 'react-icons'
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTelegramPlane,
  FaYoutube,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiHuggingface, SiMastodon, SiTiktok, SiWhatsapp } from 'react-icons/si'

type SocialPlatform = {
  key: string
  label: string
  icon: IconType
  placeholder: string
  acceptedHosts?: string[]
}

const socialPlatforms: SocialPlatform[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: FaFacebookF,
    placeholder: 'https://www.facebook.com/username',
    acceptedHosts: ['facebook.com', 'fb.com'],
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: FaInstagram,
    placeholder: 'https://www.instagram.com/username',
    acceptedHosts: ['instagram.com'],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: FaLinkedinIn,
    placeholder: 'https://www.linkedin.com/in/username',
    acceptedHosts: ['linkedin.com'],
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    icon: FaXTwitter,
    placeholder: 'https://x.com/username',
    acceptedHosts: ['x.com', 'twitter.com'],
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: FaTelegramPlane,
    placeholder: 'https://t.me/username',
    acceptedHosts: ['t.me', 'telegram.me'],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: SiWhatsapp,
    placeholder: 'https://wa.me/905xxxxxxxxx',
    acceptedHosts: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: FaGithub,
    placeholder: 'https://github.com/username',
    acceptedHosts: ['github.com'],
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: FaYoutube,
    placeholder: 'https://www.youtube.com/@channel',
    acceptedHosts: ['youtube.com', 'youtu.be'],
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: SiTiktok,
    placeholder: 'https://www.tiktok.com/@username',
    acceptedHosts: ['tiktok.com'],
  },
  {
    key: 'huggingface',
    label: 'Hugging Face',
    icon: SiHuggingface,
    placeholder: 'https://huggingface.co/username',
    acceptedHosts: ['huggingface.co'],
  },
  {
    key: 'mastodon',
    label: 'Mastodon',
    icon: SiMastodon,
    placeholder: 'https://mastodon.social/@username',
  },
]

type SocialMediaLinksFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function parseLinks(value: string): Record<string, string> {
  if (!value.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, raw]) => {
      if (typeof raw === 'string') {
        acc[key] = raw
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

function isHostAccepted(hostname: string, acceptedHosts: string[]) {
  return acceptedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function isValidPlatformUrl(value: string, acceptedHosts?: string[]) {
  const normalized = normalizeUrl(value)
  if (!normalized) {
    return false
  }

  if (!acceptedHosts || acceptedHosts.length === 0) {
    try {
      const url = new URL(normalized)
      return ['http:', 'https:'].includes(url.protocol)
    } catch {
      return false
    }
  }

  try {
    const url = new URL(normalized)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    return isHostAccepted(hostname, acceptedHosts)
  } catch {
    return false
  }
}

export function SocialMediaLinksField({ id, label, value, onChange }: SocialMediaLinksFieldProps) {
  const links = useMemo(() => parseLinks(value), [value])
  const [touchedPlatforms, setTouchedPlatforms] = useState<Record<string, boolean>>({})

  const updateLinks = (next: Record<string, string>) => {
    onChange(JSON.stringify(next))
  }

  const togglePlatform = (platformKey: string) => {
    const next = { ...links }

    if (platformKey in next) {
      delete next[platformKey]
    } else {
      next[platformKey] = ''
    }

    updateLinks(next)
  }

  const setPlatformUrl = (platformKey: string, nextValue: string) => {
    updateLinks({ ...links, [platformKey]: nextValue })
  }

  return (
    <div id={id} className="flex flex-col gap-3 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon
          const isSelected = platform.key in links

          return (
            <button
              key={platform.key}
              type="button"
              onClick={() => togglePlatform(platform.key)}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                isSelected
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-teal-300'
              }`}
              aria-pressed={isSelected}
            >
              <Icon className="text-base" aria-hidden="true" />
              <span>{platform.label}</span>
            </button>
          )
        })}
      </div>

      {socialPlatforms.some((platform) => platform.key in links) && (
        <div className="grid gap-3">
          {socialPlatforms
            .filter((platform) => platform.key in links)
            .map((platform) => {
              const currentValue = links[platform.key] ?? ''
              const isTouched = Boolean(touchedPlatforms[platform.key])
              const hasValue = currentValue.trim().length > 0
              const isValid = hasValue && isValidPlatformUrl(currentValue, platform.acceptedHosts)
              const showError = isTouched && (!hasValue || !isValid)
              const Icon = platform.icon

              return (
                <div key={platform.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Icon className="text-base" aria-hidden="true" />
                    <span>{platform.label}</span>
                  </div>
                  <input
                    type="url"
                    dir="ltr"
                    value={currentValue}
                    onChange={(event) => setPlatformUrl(platform.key, event.target.value)}
                    onBlur={() =>
                      setTouchedPlatforms((current) => ({
                        ...current,
                        [platform.key]: true,
                      }))
                    }
                    placeholder={platform.placeholder}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                      showError
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                    }`}
                  />
                  {showError && (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {!hasValue
                        ? `أضف رابط ${platform.label}.`
                        : platform.acceptedHosts && platform.acceptedHosts.length > 0
                          ? `رابط ${platform.label} غير صالح. استخدم رابطًا من ${platform.acceptedHosts[0]}.`
                          : `رابط ${platform.label} غير صالح.`}
                    </p>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {!socialPlatforms.some((platform) => platform.key in links) && (
        <p className="text-xs font-normal text-slate-500/70">
          اختر منصة واحدة أو أكثر، ثم أضف رابط حسابك لكل منصة.
        </p>
      )}
    </div>
  )
}