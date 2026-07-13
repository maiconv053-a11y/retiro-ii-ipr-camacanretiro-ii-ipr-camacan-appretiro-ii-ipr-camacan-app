import {
  AlertTriangle,
  CircleDollarSign,
  ListChecks,
  Sparkles,
  Users,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'
import { formatCurrency } from '@/utils/format'

export default function DashboardPage() {
  const participants = useRetreatStore((state) => state.participants)
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
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

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Painel central"
        title="Operação unificada do retiro"
        description="Acompanhe inscrições, recebimentos e tarefas críticas em uma única superfície com leitura instantânea."
        action={<StatusBadge label="Modo sincronizado" tone="cyan" />}
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          label="Participantes"
          value={String(activeParticipants.length)}
          hint={`${activeParticipants.filter((item) => item.registrationStatus === 'Confirmada').length} confirmados`}
          icon={<Users className="h-5 w-5" />}
          to="/participantes"
          ctaLabel="Abrir participantes"
        />
        <StatCard
          label="Arrecadado"
          value={formatCurrency(totalCollected)}
          hint={`Meta atual ${formatCurrency(totalExpected)}`}
          accent="violet"
          icon={<CircleDollarSign className="h-5 w-5" />}
          to="/financeiro"
          ctaLabel="Abrir financeiro"
        />
        <StatCard
          label="Pendências"
          value={String(pendingParticipants.length)}
          hint="Participantes com saldo em aberto"
          accent="green"
          icon={<AlertTriangle className="h-5 w-5" />}
          to="/financeiro"
          ctaLabel="Ver cobranças"
        />
        <StatCard
          label="Checklist"
          value={`${completedTasks}/${logisticsTasks.length}`}
          hint="Tarefas concluídas pela organização"
          accent="violet"
          icon={<ListChecks className="h-5 w-5" />}
          to="/logistica"
          ctaLabel="Abrir logística"
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#071120]/82 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-title text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">
                Radar financeiro
              </p>
              <h2 className="mt-2 font-title text-xl text-white">
                Participantes com saldo pendente
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-cyan-200" />
          </div>

          <div className="mt-5 space-y-3">
            {pendingParticipants.map((participant) => (
              <article
                key={participant.id}
                className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {participant.fullName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Pago {formatCurrency(participant.financial.amountPaid)} de{' '}
                    {formatCurrency(participant.financial.totalAmount)}
                  </p>
                </div>
                <StatusBadge
                  label={participant.financial.paymentMethod}
                  tone="violet"
                />
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#071120]/82 p-6">
          <p className="font-title text-[11px] uppercase tracking-[0.3em] text-violet-300/70">
            Operação logística
          </p>
          <h2 className="mt-2 font-title text-xl text-white">
            Próximos pontos de atenção
          </h2>

          <div className="mt-5 space-y-3">
            {logisticsTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
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
                <p className="mt-4 text-sm text-slate-400">{task.notes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
