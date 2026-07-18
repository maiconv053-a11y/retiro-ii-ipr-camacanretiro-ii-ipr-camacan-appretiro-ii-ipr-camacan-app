import { resolve4, resolve6, resolveMx } from 'node:dns/promises'
import { normalizeEmail } from '../../shared/utils/email.js'

export async function assertEmailDomainExistsOrThrow(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const [, domain = ''] = normalizedEmail.split('@')

  if (!domain) {
    throw new Error('Informe um e-mail valido.')
  }

  const hasMxRecord = await resolveMx(domain)
    .then((records) => records.length > 0)
    .catch((error: NodeJS.ErrnoException) => {
      if (isExpectedDnsFailure(error)) {
        return false
      }

      throw error
    })

  if (hasMxRecord) {
    return
  }

  const hasAddressRecord = await Promise.allSettled([resolve4(domain), resolve6(domain)]).then(
    (results) =>
      results.some(
        (result) => result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length > 0,
      ),
  )

  if (!hasAddressRecord) {
    throw new Error('Esse dominio de e-mail nao existe ou nao recebe mensagens.')
  }
}

function isExpectedDnsFailure(error: NodeJS.ErrnoException) {
  return (
    error.code === 'ENOTFOUND' ||
    error.code === 'ENODATA' ||
    error.code === 'ESERVFAIL' ||
    error.code === 'EREFUSED' ||
    error.code === 'ETIMEOUT'
  )
}
