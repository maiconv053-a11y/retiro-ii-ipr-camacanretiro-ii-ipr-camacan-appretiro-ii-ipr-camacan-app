import { FinancialRecordCard } from '@/components/financial/FinancialRecordCard'
import { PageTopLogo } from '@/components/ui/PageTopLogo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'
import { formatCurrency } from '@/utils/format'

export default function FinancialPage() {
  const participants = useRetreatStore((state) => state.participants)
  const activeParticipants = participants.filter(
    (participant) => participant.registrationStatus !== 'Cancelada',
  )
  const updateParticipantFinancial = useRetreatStore(
    (state) => state.updateParticipantFinancial,
  )
  const validateParticipantPayment = useRetreatStore(
    (state) => state.validateParticipantPayment,
  )
  const syncing = useRetreatStore((state) => state.syncing)

  const totalExpected = activeParticipants.reduce(
    (sum, participant) => sum + participant.financial.totalAmount,
    0,
  )
  const totalPaid = participants.reduce(
    (sum, participant) => sum + participant.financial.amountPaid,
    0,
  )

  return (
    <div className="space-y-6">
      <PageTopLogo />
      <SectionHeader
        eyebrow="Módulo 2"
        title="Controle financeiro e mensalidades"
        description="Defina a forma de pagamento, acompanhe parcelamentos e ajuste o histórico financeiro de cada inscrito."
        action={
          <StatusBadge
            label={`${formatCurrency(totalPaid)} recebidos`}
            tone="violet"
          />
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Total previsto
          </p>
          <p className="mt-3 font-title text-3xl text-[#20352a]">
            {formatCurrency(totalExpected)}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Total pago
          </p>
          <p className="mt-3 font-title text-3xl text-[#20352a]">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Saldo em aberto
          </p>
          <p className="mt-3 font-title text-3xl text-[#20352a]">
            {formatCurrency(totalExpected - totalPaid)}
          </p>
        </div>
      </section>

      <div className="grid gap-5">
        {participants.map((participant) => (
          <FinancialRecordCard
            key={participant.id}
            participant={participant}
            onSave={updateParticipantFinancial}
            onValidatePayment={validateParticipantPayment}
            isSaving={syncing}
          />
        ))}
      </div>
    </div>
  )
}
