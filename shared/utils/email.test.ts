import { describe, expect, it } from 'vitest'
import { getEmailValidationError, isValidEmail } from './email'

describe('email validation', () => {
  it('aceita email comum valido', () => {
    expect(isValidEmail('usuario@gmail.com')).toBe(true)
    expect(getEmailValidationError('usuario@gmail.com')).toBeNull()
  })

  it('bloqueia dominio reservado ou temporario', () => {
    expect(getEmailValidationError('usuario@example.com')).toBe(
      'Esse dominio de e-mail nao e aceito.',
    )
    expect(getEmailValidationError('usuario@mailinator.com')).toBe(
      'Esse dominio de e-mail nao e aceito.',
    )
  })

  it('bloqueia formato invalido', () => {
    expect(getEmailValidationError('usuario@localhost')).toBe(
      'Esse dominio de e-mail nao e aceito.',
    )
    expect(getEmailValidationError('usuario..teste@gmail.com')).toBe(
      'Informe um e-mail valido.',
    )
  })
})
