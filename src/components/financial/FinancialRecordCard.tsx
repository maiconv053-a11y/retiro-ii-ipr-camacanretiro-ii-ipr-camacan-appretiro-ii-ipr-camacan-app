import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Landmark, Receipt, Wallet } from 'lucide-react'
import type {
  FinancialUpdate,
  Installment,
  Participant,
  PaymentMethod,
} from '@shared/types/retreat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  createInstallments,
  requiresInstallments,
  syncInstallmentsAmountPaid,
} from '@/utils/finance'
import { formatCurrency } from '@/utils/format'

interface FinancialRecordCardProps {
  participant: Participant
  onSave: (participantId: string, update: FinancialUpdate) => Promise<void> | void
  isSaving?: boolean
}

const paymentOptions: Array<{
  value: PaymentMethod
  label: string
  icon: typeof Wallet
}> = [
  { value: 'PIX', label: 'À vista no PIX', icon: Wallet },
  { value: 'Dinheiro', label: 'À vista no Dinheiro', icon: Landmark },
  { value: 'Boleto', label: 'Boleto', icon: Receipt },
  { value: 'CartaoCredito', label: 'Cartão de Crédito', icon: CreditCard },
]

export function FinancialRecordCard({
  participant,
  onSave,
  isSaving = false,
}: FinancialRecordCardProps) {
  const [draft, setDraft] = useState<FinancialUpdate>(participant.financial)

  useEffect(() => {
    setDraft(participant.financial)
  }, [participant.financial])

  const pendingAmount = useMemo(
    () => Math.max(draft.totalAmount - draft.amountPaid, 0),
    [draft.amountPaid, draft.totalAmount],
  )

  function setMethod(method: PaymentMethod) {
    const installmentCount = requiresInstallments(method)
      ? draft.installmentCount || 1
      : 1

    setDraft({
      totalAmount: draft.totalAmount,
      amountPaid: draft.amountPaid,
      paymentMethod: method,
      installmentCount,
      installments: createInstallments(draft.totalAmount, installmentCount).map(
        (installment, index): Installment => ({
          ...installment,
          status:
            index === 0 && draft.amountPaid > 0
              ? ('Paga' as const)
              : ('Pendente' as const),
        }),
      ),
    })
  }

  function setInstallmentCount(count: number) {
    setDraft((current) => ({
      ...current,
      installmentCount: count,
      installments: createInstallments(current.totalAmount, count).map(
        (installment, index): Installment => ({
          ...installment,
          status:
            current.installments[index]?.status ??
            (index === 0 && current.amountPaid > 0
              ? ('Paga' as const)
              : ('Pendente' as const)),
        }),
      ),
    }))
  }

  function toggleInstallment(index: number) {
    setDraft((current) => {
      const installments = current.installments.map<Installment>(
        (installment, currentIndex) =>
          currentIndex === index
            ? {
                ...installment,
                status:
                  installment.status === 'Paga'
                    ? ('Pendente' as const)
                    : ('Paga' as const),
              }
            : installment,
      )

      const amountPaid = installments
        .filter((installment) => installment.status === 'Paga')
        .reduce((sum, installment) => sum + installment.amount, 0)

      return {
        ...current,
        installments,
        amountPaid: Number(amountPaid.toFixed(2)),
      }
    })
  }

  async function saveChanges() {
    try {
      await onSave(participant.id, {
        ...draft,
        amountPaid: Number(draft.amountPaid.toFixed(2)),
      })
    } catch {
      return
    }
  }

  return (
    <article className="rounded-[28px] border border-white/10 bg-[#071120]/82 p-5">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-title text-xl text-white">{participant.fullName}</h3>
          <p className="mt-2 text-sm text-slate-400">
            Pago {formatCurrency(participant.financial.amountPaid)} de{' '}
            {formatCurrency(participant.financial.totalAmount)}
          </p>
        </div>
        <StatusBadge
          label={pendingAmount > 0 ? 'Saldo pendente' : 'Quitado'}
          tone={pendingAmount > 0 ? 'amber' : 'green'}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Valor total
              </span>
              <input
                type="number"
                value={draft.totalAmount}
                onChange={(event) =>
                  setDraft((current) => {
                    const totalAmount = Number(event.target.value)
                    const installments = createInstallments(
                      totalAmount,
                      current.installmentCount,
                    )

                    return {
                      ...current,
                      totalAmount,
                      installments: syncInstallmentsAmountPaid(
                        installments,
                        current.amountPaid,
                      ),
                    }
                  })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Valor pago
              </span>
              <input
                type="number"
                value={draft.amountPaid}
                onChange={(event) =>
                  setDraft((current) => {
                    const amountPaid = Number(event.target.value)

                    return {
                      ...current,
                      amountPaid,
                      installments: syncInstallmentsAmountPaid(
                        current.installments,
                        amountPaid,
                      ),
                    }
                  })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {paymentOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
                  draft.paymentMethod === value
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Parcelamento
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Ative para boleto ou cartão.
              </p>
            </div>
            <select
              value={draft.installmentCount}
              disabled={!requiresInstallments(draft.paymentMethod)}
              onChange={(event) => setInstallmentCount(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none disabled:opacity-40"
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}x
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            {draft.installments.map((installment, index) => (
              <button
                key={`${participant.id}-${installment.id}`}
                type="button"
                onClick={() => toggleInstallment(index)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm text-white">
                    {installment.label} · {formatCurrency(installment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vencimento {installment.dueDate ?? 'a definir'}
                  </p>
                </div>
                <StatusBadge
                  label={installment.status}
                  tone={installment.status === 'Paga' ? 'green' : 'amber'}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-400">
          Saldo aberto: <span className="text-white">{formatCurrency(pendingAmount)}</span>
        </div>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isSaving}
          className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-5 py-3 text-sm font-medium text-violet-100 transition hover:border-violet-400/40"
        >
          {isSaving ? 'Salvando...' : 'Atualizar financeiro'}
        </button>
      </div>
    </article>
  )
}
