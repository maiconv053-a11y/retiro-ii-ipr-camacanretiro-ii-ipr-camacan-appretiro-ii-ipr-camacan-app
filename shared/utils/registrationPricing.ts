import type { PaymentMethod } from '../types/retreat'

export const EVENT_DATE_ISO = '2027-02-05'
export const EVENT_DATE = new Date(`${EVENT_DATE_ISO}T00:00:00Z`)
export const PAYMENT_DEADLINE_ISO = '2027-02-04'
export const PAYMENT_DEADLINE = new Date(`${PAYMENT_DEADLINE_ISO}T00:00:00Z`)
export const BASE_REGISTRATION_FEE = 750

export type AgePricingTier = 'Free' | 'Half' | 'Full'

export type CardInstallmentPlan = {
  installmentAmount: number
  totalAmount: number
}

export const CARD_INSTALLMENT_TABLE: Record<number, CardInstallmentPlan> = {
  1: { installmentAmount: 774.4, totalAmount: 774.4 },
  2: { installmentAmount: 396.36, totalAmount: 792.73 },
  3: { installmentAmount: 266.3, totalAmount: 798.9 },
  4: { installmentAmount: 201.29, totalAmount: 805.16 },
  5: { installmentAmount: 162.28, totalAmount: 811.43 },
  6: { installmentAmount: 136.28, totalAmount: 817.71 },
  7: { installmentAmount: 117.72, totalAmount: 824.09 },
  8: { installmentAmount: 103.81, totalAmount: 830.48 },
  9: { installmentAmount: 92.98, totalAmount: 836.87 },
  10: { installmentAmount: 84.32, totalAmount: 843.27 },
  11: { installmentAmount: 77.25, totalAmount: 849.77 },
  12: { installmentAmount: 71.34, totalAmount: 856.17 },
}

export function parseDateOnly(dateIso: string) {
  return new Date(`${dateIso}T00:00:00Z`)
}

export function calculateAgeOnDate(birthDateIso: string, onDate: Date) {
  if (!birthDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateIso)) {
    throw new Error('Data de nascimento inválida.')
  }

  const birth = parseDateOnly(birthDateIso)
  const yearDiff = onDate.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = onDate.getUTCMonth() - birth.getUTCMonth()
  const dayDiff = onDate.getUTCDate() - birth.getUTCDate()

  if (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)) {
    return Math.max(0, yearDiff)
  }

  return Math.max(0, yearDiff - 1)
}

export function getAgePricingTier(ageAtEvent: number): AgePricingTier {
  if (ageAtEvent <= 7) {
    return 'Free'
  }

  if (ageAtEvent <= 10) {
    return 'Half'
  }

  return 'Full'
}

export function getAgeDiscountMultiplier(ageAtEvent: number) {
  const tier = getAgePricingTier(ageAtEvent)

  switch (tier) {
    case 'Free':
      return 0
    case 'Half':
      return 0.5
    default:
      return 1
  }
}

function roundMoney(value: number) {
  return Number(value.toFixed(2))
}

export function splitAmountIntoInstallments(totalAmount: number, installmentCount: number) {
  const safeCount = Math.max(1, Math.trunc(installmentCount || 1))
  const normalizedTotal = roundMoney(totalAmount)
  const base = roundMoney(normalizedTotal / safeCount)

  return Array.from({ length: safeCount }, (_, index) => {
    if (index === safeCount - 1) {
      return roundMoney(normalizedTotal - base * (safeCount - 1))
    }

    return base
  })
}

export function getMonthsAvailableUntilEvent(now: Date) {
  const startMonth = now.getUTCFullYear() * 12 + now.getUTCMonth()
  const deadlineMonth = PAYMENT_DEADLINE.getUTCFullYear() * 12 + PAYMENT_DEADLINE.getUTCMonth()
  return Math.max(1, deadlineMonth - startMonth)
}

function getDaysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

export function addUtcMonths(date: Date, months: number) {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months
  const nextYear = Math.floor(totalMonths / 12)
  const nextMonth = ((totalMonths % 12) + 12) % 12
  const nextDay = Math.min(date.getUTCDate(), getDaysInUtcMonth(nextYear, nextMonth))

  return new Date(Date.UTC(nextYear, nextMonth, nextDay))
}

export function toDateIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildDueDateSlots(now: Date) {
  const totalSlots = getMonthsAvailableUntilEvent(now)

  if (totalSlots <= 1) {
    return [PAYMENT_DEADLINE_ISO]
  }

  const firstDueDate = addUtcMonths(now, 1)

  return Array.from({ length: totalSlots }, (_, index) => {
    if (index === totalSlots - 1) {
      return PAYMENT_DEADLINE_ISO
    }

    return toDateIso(addUtcMonths(firstDueDate, index))
  })
}

function distributeInstallmentIndexes(totalSlots: number, installmentCount: number) {
  if (installmentCount <= 1 || totalSlots <= 1) {
    return [totalSlots - 1]
  }

  const lastIndex = totalSlots - 1
  const indexes: number[] = []

  for (let index = 0; index < installmentCount; index += 1) {
    const rawIndex = Math.round((index * lastIndex) / (installmentCount - 1))
    const minAllowed = index === 0 ? 0 : indexes[index - 1] + 1
    const maxAllowed = lastIndex - (installmentCount - 1 - index)
    indexes.push(Math.min(maxAllowed, Math.max(minAllowed, rawIndex)))
  }

  return indexes
}

export function computeDueDates(now: Date, installmentCount: number) {
  const totalSlots = getMonthsAvailableUntilEvent(now)
  const safeCount = Math.max(1, Math.min(installmentCount, totalSlots))
  const dueDateSlots = buildDueDateSlots(now)

  return distributeInstallmentIndexes(dueDateSlots.length, safeCount).map(
    (index) => dueDateSlots[index],
  )
}

export type RegistrationPricingResult = {
  ageAtEvent: number
  baseFee: number
  discountTier: AgePricingTier
  discountMultiplier: number
  paymentMethod: PaymentMethod
  installmentCount: number
  totalAmount: number
  installmentAmounts: number[]
  dueDates: string[] | null
  cardInstallmentLabel: string | null
}

export function computeRegistrationPricing(params: {
  birthDateIso: string
  paymentMethod: PaymentMethod
  installmentCount: number
  baseFee?: number
  now?: Date
}) {
  const now = params.now ?? new Date()
  const ageAtEvent = calculateAgeOnDate(params.birthDateIso, EVENT_DATE)
  const discountMultiplier = getAgeDiscountMultiplier(ageAtEvent)
  const discountTier = getAgePricingTier(ageAtEvent)
  const baseFee = params.baseFee ?? BASE_REGISTRATION_FEE

  const paymentMethod = params.paymentMethod

  if (discountMultiplier === 0) {
    return {
      ageAtEvent,
      baseFee,
      discountTier,
      discountMultiplier,
      paymentMethod,
      installmentCount: 1,
      totalAmount: 0,
      installmentAmounts: [0],
      dueDates: paymentMethod === 'CartaoCredito' ? null : [PAYMENT_DEADLINE_ISO],
      cardInstallmentLabel: paymentMethod === 'CartaoCredito' ? '1x de R$ 0,00' : null,
    } satisfies RegistrationPricingResult
  }

  if (paymentMethod === 'CartaoCredito') {
    const desiredCount = Math.max(1, Math.min(12, Math.trunc(params.installmentCount || 1)))
    const plan = CARD_INSTALLMENT_TABLE[desiredCount] ?? CARD_INSTALLMENT_TABLE[1]
    const installmentAmount = roundMoney(plan.installmentAmount * discountMultiplier)
    const totalAmount = roundMoney(plan.totalAmount * discountMultiplier)
    const installmentAmounts = Array.from({ length: desiredCount }, () => installmentAmount)

    return {
      ageAtEvent,
      baseFee,
      discountTier,
      discountMultiplier,
      paymentMethod,
      installmentCount: desiredCount,
      totalAmount,
      installmentAmounts,
      dueDates: null,
      cardInstallmentLabel: `${desiredCount}x de R$ ${installmentAmount
        .toFixed(2)
        .replace('.', ',')}`,
    } satisfies RegistrationPricingResult
  }

  const discountedFee = roundMoney(baseFee * discountMultiplier)
  const safeCount =
    paymentMethod === 'Boleto'
      ? Math.max(
          1,
          Math.min(
            Math.trunc(params.installmentCount || 1),
            Math.min(7, getMonthsAvailableUntilEvent(now)),
          ),
        )
      : 1

  const installmentAmounts = splitAmountIntoInstallments(discountedFee, safeCount)
  const dueDates =
    paymentMethod === 'Boleto' || paymentMethod === 'PIX' || paymentMethod === 'Dinheiro'
      ? computeDueDates(now, safeCount)
      : null

  return {
    ageAtEvent,
    baseFee,
    discountTier,
    discountMultiplier,
    paymentMethod,
    installmentCount: safeCount,
    totalAmount: discountedFee,
    installmentAmounts,
    dueDates,
    cardInstallmentLabel: null,
  } satisfies RegistrationPricingResult
}
