const PBKDF2_ITERATIONS = 120_000
const SALT_BYTES = 16
const HASH_BITS = 256

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export function createSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  return bytesToBase64(salt)
}

export async function hashPassword(password: string, saltBase64: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const saltBytes = base64ToBytes(saltBase64)
  const salt = new Uint8Array(saltBytes)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS,
  )
  return bytesToBase64(new Uint8Array(bits))
}

export async function verifyPassword(
  password: string,
  saltBase64: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await hashPassword(password, saltBase64)
  return actualHash === expectedHash
}
