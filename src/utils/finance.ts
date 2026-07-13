import type {
  FinancialRecord,
  FinancialUpdate,
  Installment,
  InstallmentStatus,
  PaymentMethod,
} from '@shared/types/retreat'

export function requiresInstallments(method: PaymentMethod) {
  return method === 'Boleto' || method === 'CartaoCredito'
}

export function createInstallments(
  totalAmount: number,
  installmentCount: number,
): Installment[] {
  const safeCount = Math.max(1, installmentCount)
  const baseAmount = Number((totalAmount / safeCount).toFixed(2))

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `installment-${safeCount}-${index + 1}`,
    label: `${index + 1}x`,
    amount:
      index === safeCount - 1
        ? Number((totalAmount - baseAmount * (safeCount - 1)).toFixed(2))
        : baseAmount,
    status: index === 0 ? ('Paga' as const) : ('Pendente' as const),
    dueDate: `2026-${String(index + 8).padStart(2, '0')}-10`,
  }))
}

export function syncInstallmentsAmountPaid(
  installments: Installment[],
  amountPaid: number,
) {
  let remaining = amountPaid

  return installments.map<Installment>((installment) => {
    if (remaining >= installment.amount) {
      remaining -= installment.amount
      return {
        ...installment,
        status: 'Paga' as const,
      }
    }

    return {
      ...installment,
      status: 'Pendente' as const,
    }
  })
}

export function countPaidInstallments(installments: Installment[]) {
  return installments.filter((installment) => installment.status === 'Paga').length
}

export function deriveFinancialStatus(
  totalAmount: number,
  amountPaid: number,
): 'pendente' | 'parcial' | 'quitado' {
  if (amountPaid <= 0) {
    return 'pendente'
  }

  if (amountPaid >= totalAmount) {
    return 'quitado'
  }

  return 'parcial'
}

export function normalizeFinancialRecord(update: FinancialUpdate): FinancialRecord {
  const installmentCount = requiresInstallments(update.paymentMethod)
    ? update.installmentCount
    : 1
  const baseInstallments = createInstallments(update.totalAmount, installmentCount)
  const incomingInstallments = update.installments.length
    ? update.installments
    : baseInstallments

  const paidAmountFromInstallments = incomingInstallments
    .filter((installment) => installment.status === 'Paga')
    .reduce((sum, installment) => sum + installment.amount, 0)

  const amountPaid = Number(
    Math.max(update.amountPaid, paidAmountFromInstallments).toFixed(2),
  )

  return {
    totalAmount: update.totalAmount,
    amountPaid,
    paymentMethod: update.paymentMethod,
    installmentCount,
    installments: syncInstallmentsAmountPaid(baseInstallments, amountPaid),
  }
}

export function buildInstallmentsFromPaidCount(
  totalAmount: number,
  installmentCount: number,
  paidCount: number,
) {
  return createInstallments(totalAmount, installmentCount).map((installment, index) => ({
    ...installment,
    status: (index < paidCount ? 'Paga' : 'Pendente') as InstallmentStatus,
  }))
}
