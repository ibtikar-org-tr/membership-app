export function normalizeToAsciiLower(input?: string): string {
  if (!input) return ''

  // Map Turkish-specific characters to ASCII equivalents first
  const charMap: Record<string, string> = {
    İ: 'I',
    ı: 'i',
    Ş: 'S',
    ş: 's',
    Ç: 'C',
    ç: 'c',
    Ğ: 'G',
    ğ: 'g',
    Ö: 'O',
    ö: 'o',
    Ü: 'U',
    ü: 'u',
  }

  let s = input.replace(/[İıŞşÇçĞğÖöÜü]/g, (c) => charMap[c] ?? c)

  // Decompose accents (NFD) and remove diacritic marks
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  return s.toLowerCase()
}

export default normalizeToAsciiLower
