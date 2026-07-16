import { formatCurrency } from '@/utils/format'

interface GoalProgressCardProps {
  eyebrow: string
  title: string
  description?: string
  goalAmount: number
  paidAmount: number
  pendingAmount: number
}

export function GoalProgressCard({
  eyebrow,
  title,
  description,
  goalAmount,
  paidAmount,
  pendingAmount,
}: GoalProgressCardProps) {
  const safeGoal = Number.isFinite(goalAmount) && goalAmount > 0 ? goalAmount : 0
  const safePaid = Number.isFinite(paidAmount) && paidAmount > 0 ? paidAmount : 0
  const safePending = Number.isFinite(pendingAmount) && pendingAmount > 0 ? pendingAmount : 0

  const expectedAmount = safePaid + safePending
  const paidRatio = safeGoal > 0 ? Math.min(safePaid / safeGoal, 1) : 0
  const expectedRatio = safeGoal > 0 ? Math.min(expectedAmount / safeGoal, 1) : 0
  const pendingRatio = Math.max(expectedRatio - paidRatio, 0)

  const remainingAfterPaid = Math.max(safeGoal - safePaid, 0)
  const remainingAfterExpected = Math.max(safeGoal - expectedAmount, 0)

  return (
    <section className="rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#6a957d]">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-title text-xl text-[#20352a]">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[#42594d]">{description}</p>
          ) : null}
        </div>

        <div className="w-full max-w-md rounded-[20px] border border-[#b7d0bf]/40 bg-white/72 px-4 py-4 text-sm text-[#42594d]">
          <p>
            Meta: <span className="font-medium text-[#20352a]">{formatCurrency(safeGoal)}</span>
          </p>
          <p className="mt-1">
            Falta (após pagos):{' '}
            <span className="font-medium text-[#20352a]">
              {formatCurrency(remainingAfterPaid)}
            </span>
          </p>
          <p className="mt-1">
            Falta (com pendentes):{' '}
            <span className="font-medium text-[#20352a]">
              {formatCurrency(remainingAfterExpected)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-[#b7d0bf]/40 bg-white/72 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#567262]">
          <span>Pago</span>
          <span>Pendente</span>
        </div>

        <div className="mt-3 rounded-full border border-[#b7d0bf]/40 bg-white/60 p-1">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#e3efe7]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#6f9f80]"
              style={{ width: `${paidRatio * 100}%` }}
            />
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[#bfe2cc] to-[#8fc5a2]"
              style={{ left: `${paidRatio * 100}%`, width: `${pendingRatio * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-[#f2f8f3] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Pago</p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(safePaid)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-[#f2f8f3] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">
              Pendente
            </p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(safePending)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-[#f2f8f3] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">
              Previsto
            </p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(expectedAmount)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

