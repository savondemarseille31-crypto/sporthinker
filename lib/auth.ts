// Utilitaires d'authentification — fonctionne en Edge (middleware) et Node (API routes)

export const COOKIE_NAME = 'st_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

export async function createSessionToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString()
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp))
  return `${timestamp}.${toHex(sig)}`
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.indexOf('.')
    if (dot === -1) return false
    const timestamp = token.slice(0, dot)
    const signature = token.slice(dot + 1)
    const ts = parseInt(timestamp)
    if (isNaN(ts) || Date.now() - ts > SESSION_DURATION_MS) return false
    const key = await getKey(secret)
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp))
    return toHex(sig) === signature
  } catch {
    return false
  }
}
