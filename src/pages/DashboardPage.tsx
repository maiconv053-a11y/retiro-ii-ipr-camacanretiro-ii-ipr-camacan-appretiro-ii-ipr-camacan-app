import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CircleDollarSign,
  PencilLine,
  ListChecks,
  Users,
} from 'lucide-react'
import { PageTopLogo } from '@/components/ui/PageTopLogo'
import { StatCard } from '@/components/ui/StatCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'
import { formatCurrency, formatPaymentMethodLabel } from '@/utils/format'

export default function DashboardPage() {
  const participants = useRetreatStore((state) => state.participants)
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
  const retreatFee = useRetreatStore((state) => state.settings.retreatFee)
  const updateRetreatFee = useRetreatStore((state) => state.updateRetreatFee)
  const syncing = useRetreatStore((state) => state.syncing)
  const [feeDraft, setFeeDraft] = useState(retreatFee)
  const activeParticipants = participants.filter(
    (participant) => participant.registrationStatus !== 'Cancelada',
  )

  const totalCollected = participants.reduce(
    (sum, participant) => sum + participant.financial.amountPaid,
    0,
  )
  const totalExpected = activeParticipants.reduce(
    (sum, participant) => sum + participant.financial.totalAmount,
    0,
  )
  const pendingParticipants = activeParticipants.filter(
    (participant) => participant.financial.amountPaid < participant.financial.totalAmount,
  )
  const completedTasks = logisticsTasks.filter(
    (task) => task.status === 'Concluida',
  ).length

  useEffect(() => {
    setFeeDraft(retreatFee)
  }, [retreatFee])

  async function handleRetreatFeeUpdate() {
    if (!Number.isFinite(feeDraft) || feeDraft <= 0) {
      return
    }

    await updateRetreatFee(feeDraft)
  }

  return (
    <div className="space-y-5">
      <PageTopLogo />
      <SectionHeader
        title="Operação Retiro"
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          label="Participantes"
          value={String(activeParticipants.length)}
          hint={`${activeParticipants.filter((item) => item.registrationStatus === 'Confirmada').length} confirmados`}
          icon={<Users className="h-5 w-5" />}
          to="/diretoria/participantes"
          ctaLabel="Abrir participantes"
        />
        <StatCard
          label="Arrecadado"
          value={formatCurrency(totalCollected)}
          hint={`Meta atual ${formatCurrency(totalExpected)}`}
          accent="violet"
          icon={<CircleDollarSign className="h-5 w-5" />}
          to="/diretoria/financeiro"
          ctaLabel="Abrir financeiro"
        />
        <StatCard
          label="Pendências"
          value={String(pendingParticipants.length)}
          hint="Participantes com saldo em aberto"
          accent="green"
          icon={<AlertTriangle className="h-5 w-5" />}
          to="/diretoria/financeiro"
          ctaLabel="Ver cobranças"
        />
        <StatCard
          label="Checklist"
          value={`${completedTasks}/${logisticsTasks.length}`}
          hint="Tarefas concluídas pela organização"
          accent="violet"
          icon={<ListChecks className="h-5 w-5" />}
          to="/diretoria/logistica"
          ctaLabel="Abrir logística"
        />
      </div>

      <section className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-title text-[10px] uppercase tracking-[0.24em] text-cyan-300/58">
              Configuração central
            </p>
            <h2 className="mt-2 font-title text-xl text-white">
              Valor fixo do retiro
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ao atualizar este valor, a inscrição pública passa a exibir o novo total e
              as parcelas futuras dos participantes com saldo pendente são recalculadas
              automaticamente.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-end">
            <label className="flex-1 space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Novo valor do retiro
              </span>
              <input
                type="number"
                min={1}
                step="0.01"
                value={feeDraft}
                onChange={(event) => setFeeDraft(Number(event.target.value))}
                className="field-surface w-full"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleRetreatFeeUpdate()}
              disabled={syncing || !Number.isFinite(feeDraft) || feeDraft <= 0}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PencilLine className="h-4 w-4" />
              {syncing ? 'Atualizando valor...' : 'Salvar novo valor'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-slate-300">
          Valor atual publicado: <span className="text-white">{formatCurrency(retreatFee)}</span>
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-title text-[10px] uppercase tracking-[0.24em] text-cyan-300/58">
                Radar financeiro
              </p>
              <h2 className="mt-2 font-title text-xl text-white">
                Participantes com saldo pendente
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Foco rápido nas inscrições que ainda precisam de acompanhamento.
              </p>
            </div>
            <StatusBadge
              label={`${pendingParticipants.length} em aberto`}
              tone={pendingParticipants.length > 0 ? 'amber' : 'green'}
            />
          </div>

          <div className="mt-5 space-y-3">
            {pendingParticipants.length === 0 ? (
              <article className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4 text-sm leading-6 text-slate-400">
                Nenhum participante com saldo pendente no momento.
              </article>
            ) : (
              pendingParticipants.map((participant) => (
                <article
                  key={participant.id}
                  className="flex flex-col gap-3 rounded-[20px] border border-white/8 bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {participant.fullName}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Pago {formatCurrency(participant.financial.amountPaid)} de{' '}
                      {formatCurrency(participant.financial.totalAmount)}
                    </p>
                  </div>
                  <StatusBadge
                    label={formatPaymentMethodLabel(participant.financial.paymentMethod)}
                    tone="violet"
                  />
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6">
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-violet-300/58">
            Operação logística
          </p>
          <h2 className="mt-2 font-title text-xl text-white">
            Próximos pontos de atenção
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Itens operacionais mais importantes para a equipe organizadora.
          </p>

          <div className="mt-5 space-y-3">
            {logisticsTasks.length === 0 ? (
              <article className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4 text-sm leading-6 text-slate-400">
                Ainda não existem tarefas cadastradas para a operação.
              </article>
            ) : (
              logisticsTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{task.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{task.owner}</p>
                    </div>
                    <StatusBadge
                      label={
                        task.status === 'EmAndamento'
                          ? 'Em andamento'
                          : task.status === 'Concluida'
                            ? 'Concluída'
                            : 'Pendente'
                      }
                      tone={
                        task.status === 'Concluida'
                          ? 'green'
                          : task.status === 'EmAndamento'
                            ? 'cyan'
                            : 'amber'
                      }
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{task.notes}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
