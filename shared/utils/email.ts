const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  '10minutemail.com',
  'temp-mail.org',
  'tempmail.com',
  'discard.email',
])

const RESERVED_EMAIL_SUFFIXES = ['.example', '.invalid', '.localhost', '.test']

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function getEmailValidationError(value: string) {
  const email = normalizeEmail(value)

  if (!email) {
    return 'Informe um e-mail valido.'
  }

  if (!BASIC_EMAIL_PATTERN.test(email) || email.includes('..')) {
    return 'Informe um e-mail valido.'
  }

  const [, domain = ''] = email.split('@')

  if (!domain || domain.startsWith('.') || domain.endsWith('.')) {
    return 'Informe um e-mail valido.'
  }

  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return 'Esse dominio de e-mail nao e aceito.'
  }

  if (RESERVED_EMAIL_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return 'Esse dominio de e-mail nao e aceito.'
  }

  const domainParts = domain.split('.')

  if (domainParts.some((part) => !part || part.startsWith('-') || part.endsWith('-'))) {
    return 'Informe um e-mail valido.'
  }

  return null
}

export function isValidEmail(value: string) {
  return getEmailValidationError(value) === null
}
