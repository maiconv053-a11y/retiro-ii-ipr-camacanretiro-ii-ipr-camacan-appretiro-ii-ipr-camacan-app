import { describe, expect, it } from 'vitest'
import {
  computeDueDates,
  computeRegistrationPricing,
  getMonthsAvailableUntilEvent,
} from '@/utils/registrationPricing'

describe('registrationPricing', () => {
  it('calcula o limite de parcelas pela quantidade de meses restantes ate 04/02/2027', () => {
    const now = new Date('2026-12-14T00:00:00Z')

    expect(getMonthsAvailableUntilEvent(now)).toBe(2)
  })

  it('gera a primeira parcela no mes atual quando ele for escolhido e fixa a ultima em 04/02/2027', () => {
    const now = new Date('2026-07-14T00:00:00Z')

    expect(computeDueDates(now, 5, 20)).toEqual([
      '2026-07-20',
      '2026-09-20',
      '2026-11-20',
      '2026-12-20',
      '2027-02-04',
    ])
  })

  it('evita vencimento retroativo no mes atual quando o dia escolhido ja passou', () => {
    const now = new Date('2026-07-14T00:00:00Z')

    expect(computeDueDates(now, 1, 10, '2026-07')).toEqual(['2026-07-14'])
  })

  it('usa o dia escolhido para pagamento unico fora do cartao', () => {
    const now = new Date('2026-07-14T00:00:00Z')

    expect(computeDueDates(now, 1, 25)).toEqual(['2026-07-25'])
  })

  it('permite escolher um mes futuro para iniciar os vencimentos do boleto', () => {
    const now = new Date('2026-07-14T00:00:00Z')

    expect(computeDueDates(now, 3, 10, '2026-10')).toEqual([
      '2026-10-10',
      '2026-12-10',
      '2027-02-04',
    ])
  })

  it('limita o boleto ao maximo de meses disponiveis', () => {
    const pricing = computeRegistrationPricing({
      birthDateIso: '2000-01-10',
      paymentMethod: 'Boleto',
      preferredPaymentDay: 10,
      preferredPaymentStartMonth: '2026-12',
      installmentCount: 7,
      baseFee: 750,
      now: new Date('2026-12-20T00:00:00Z'),
    })

    expect(pricing.installmentCount).toBe(3)
    expect(pricing.dueDates).toEqual(['2026-12-20', '2027-01-10', '2027-02-04'])
  })
})
