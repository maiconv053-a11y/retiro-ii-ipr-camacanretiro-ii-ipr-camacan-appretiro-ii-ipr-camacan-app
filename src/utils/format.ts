import type { PaymentMethod } from '@shared/types/retreat'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatIsoDatePtBr(dateIso: string) {
  const parsedDate = new Date(`${dateIso}T00:00:00Z`)

  if (Number.isNaN(parsedDate.getTime())) {
    return dateIso
  }

  return parsedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatBrazilianDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseBrazilianDateInputToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return null
  }

  const [, dayText, monthText, yearText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null
  }

  return `${yearText}-${monthText}-${dayText}`
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function formatPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case 'PIX':
      return 'PIX'
    case 'Dinheiro':
      return 'Dinheiro'
    case 'Boleto':
      return 'Boleto'
    case 'CartaoCredito':
      return 'Cartão de crédito'
  }
}
