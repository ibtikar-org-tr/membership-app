const PBKDF2_ITERATIONS = 120_000
const HASH_LENGTH_BYTES = 32
const DEFAULT_GENERATED_PASSWORD_LENGTH = 12

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function randomChar(charset: string): string {
  const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % charset.length
  return charset[randomIndex]
}

export function generateTemporaryPassword(length = DEFAULT_GENERATED_PASSWORD_LENGTH): string {
  if (length < 8) {
    throw new Error('Generated password length must be at least 8 characters.')
  }

  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^&*()-_=+[]{}'
  const allChars = `${uppercase}${lowercase}${digits}${symbols}`

  const requiredChars = [randomChar(uppercase), randomChar(lowercase), randomChar(digits), randomChar(symbols)]
  const remainingLength = Math.max(0, length - requiredChars.length)
  const randomChars = Array.from({ length: remainingLength }, () => randomChar(allChars))
  const combined = [...requiredChars, ...randomChars]

  for (let index = combined.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1)
    const current = combined[index]
    combined[index] = combined[swapIndex]
    combined[swapIndex] = current
  }

  return combined.join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    HASH_LENGTH_BYTES * 8,
  )

  const hashBytes = new Uint8Array(hashBuffer)
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hashBytes)}`
}
