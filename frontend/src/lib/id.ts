const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function createId(prefix = ''): string {
  const time = Date.now().toString(36)
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let random = ''
  for (const byte of bytes) {
    random += ALPHABET[byte % ALPHABET.length]
  }
  return `${prefix}${time}${random}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
