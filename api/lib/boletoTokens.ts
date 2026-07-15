import crypto from 'node:crypto'

function getBoletoTokenSecret() {
  return process.env.BOLETO_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function createDigest(installmentId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`boleto:${installmentId}`).digest('hex')
}

export function createInstallmentBoletoToken(installmentId: string) {
  const secret = getBoletoTokenSecret()

  if (!secret) {
    throw new Error('Segredo do link de boleto não configurado.')
  }

  return createDigest(installmentId, secret)
}

export function verifyInstallmentBoletoToken(installmentId: string, token: string | null) {
  const secret = getBoletoTokenSecret()

  if (!secret || !token) {
    return false
  }

  const expected = createDigest(installmentId, secret)

  if (expected.length !== token.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}
