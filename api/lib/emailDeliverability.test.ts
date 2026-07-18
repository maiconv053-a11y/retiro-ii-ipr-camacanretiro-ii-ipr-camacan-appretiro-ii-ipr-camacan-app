import { describe, expect, it, vi, beforeEach } from 'vitest'

const resolveMxMock = vi.fn()
const resolve4Mock = vi.fn()
const resolve6Mock = vi.fn()

vi.mock('node:dns/promises', () => ({
  resolveMx: resolveMxMock,
  resolve4: resolve4Mock,
  resolve6: resolve6Mock,
}))

import { assertEmailDomainExistsOrThrow } from './emailDeliverability'

describe('assertEmailDomainExistsOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aceita dominio com registro MX', async () => {
    resolveMxMock.mockResolvedValue([{ exchange: 'mx.exemplo.com', priority: 10 }])

    await expect(assertEmailDomainExistsOrThrow('usuario@exemplo.com')).resolves.toBeUndefined()
  })

  it('aceita dominio sem MX mas com A', async () => {
    resolveMxMock.mockRejectedValue({ code: 'ENODATA' })
    resolve4Mock.mockResolvedValue(['127.0.0.1'])
    resolve6Mock.mockRejectedValue({ code: 'ENODATA' })

    await expect(assertEmailDomainExistsOrThrow('usuario@exemplo.com')).resolves.toBeUndefined()
  })

  it('bloqueia dominio inexistente', async () => {
    resolveMxMock.mockRejectedValue({ code: 'ENOTFOUND' })
    resolve4Mock.mockRejectedValue({ code: 'ENOTFOUND' })
    resolve6Mock.mockRejectedValue({ code: 'ENOTFOUND' })

    await expect(assertEmailDomainExistsOrThrow('usuario@dominio-invalido.zzz')).rejects.toThrow(
      'Esse dominio de e-mail nao existe ou nao recebe mensagens.',
    )
  })
})
