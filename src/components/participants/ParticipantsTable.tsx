import { Pencil, Search, Trash2 } from 'lucide-react'
import type { Participant, RegistrationStatus } from '@shared/types/retreat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { filterParticipants } from '@/components/participants/participantsFilter'
import { formatCurrency, formatPaymentMethodLabel } from '@/utils/format'

interface ParticipantsTableProps {
  participants: Participant[]
  query: string
  statusFilter: 'Todos' | RegistrationStatus
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: 'Todos' | RegistrationStatus) => void
  onEditParticipant: (participant: Participant) => void
  onDeleteParticipant: (participant: Participant) => Promise<void> | void
  isSubmitting?: boolean
}

const statusToneMap = {
  Confirmada: 'green',
  Pendente: 'amber',
  Cancelada: 'rose',
} as const

const filters: Array<'Todos' | RegistrationStatus> = [
  'Todos',
  'Confirmada',
  'Pendente',
  'Cancelada',
]

const filterLabels: Record<'Todos' | RegistrationStatus, string> = {
  Todos: 'Todos',
  Confirmada: 'QUITADOS',
  Pendente: 'Pendente',
  Cancelada: 'Cancelada',
}

const registrationStatusLabels: Record<RegistrationStatus, string> = {
  Confirmada: 'QUITADA',
  Pendente: 'Pendente',
  Cancelada: 'Cancelada',
}

export function ParticipantsTable({
  participants,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onEditParticipant,
  onDeleteParticipant,
  isSubmitting = false,
}: ParticipantsTableProps) {
  const filteredParticipants = filterParticipants(participants, query, statusFilter)

  return (
    <section className="rounded-[28px] border border-emerald-100/10 bg-[#102019]/78 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-title text-[11px] uppercase tracking-[0.32em] text-emerald-200/60">BUSCA RÁPIDA</p>
          <h2 className="mt-2 font-title text-xl text-white">
            Participantes cadastrados
          </h2>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex items-center gap-3 rounded-2xl border border-emerald-100/10 bg-[#0b1713]/82 px-4 py-3 text-slate-300">
            <Search className="h-4 w-4 text-emerald-200/45" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 md:min-w-64"
              placeholder="Buscar por nome, telefone, e-mail, igreja ou cidade"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onStatusFilterChange(filter)}
                className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition ${
                  statusFilter === filter
                    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
                    : 'border-emerald-100/10 bg-[#0b1713]/65 text-slate-500 hover:border-emerald-200/20 hover:text-slate-200'
                }`}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-emerald-100/10 lg:block">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-[#0b1713]/80 text-xs uppercase tracking-[0.24em] text-emerald-200/45">
            <tr>
              <th className="px-4 py-3 font-medium">Participante</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Igreja e cidade</th>
              <th className="px-4 py-3 font-medium">Restrições</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Financeiro</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredParticipants.map((participant) => (
              <tr key={participant.id} className="bg-transparent text-slate-200">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{participant.fullName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {participant.age} anos
                  </p>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{participant.phone}</p>
                  <p className="mt-1 text-xs text-slate-500">{participant.email || 'Sem e-mail'}</p>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{participant.church || 'Igreja não informada'}</p>
                  <p className="mt-1 text-xs text-slate-500">{participant.city || 'Cidade não informada'}</p>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{participant.dietaryRestrictions || 'Nenhuma'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {participant.medicalRestrictions || 'Nenhuma'}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    label={registrationStatusLabels[participant.registrationStatus]}
                    tone={statusToneMap[participant.registrationStatus]}
                  />
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{formatCurrency(participant.financial.amountPaid)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    de {formatCurrency(participant.financial.totalAmount)} ·{' '}
                    {formatPaymentMethodLabel(participant.financial.paymentMethod)}
                  </p>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditParticipant(participant)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteParticipant(participant)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-2 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-400/30 hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:hidden">
        {filteredParticipants.map((participant) => (
          <article
            key={participant.id}
            className="rounded-[24px] border border-emerald-100/10 bg-[#0b1713]/82 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-white">{participant.fullName}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {participant.age} anos · {participant.phone}
                </p>
                <p className="mt-1 text-sm text-slate-500">{participant.email || 'Sem e-mail'}</p>
              </div>
              <StatusBadge
                label={registrationStatusLabels[participant.registrationStatus]}
                tone={statusToneMap[participant.registrationStatus]}
              />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p>
                Igreja: {participant.church || 'Não informada'}
              </p>
              <p>
                Cidade: {participant.city || 'Não informada'}
              </p>
              <p>
                Alimentação: {participant.dietaryRestrictions || 'Nenhuma'}
              </p>
              <p>Médico: {participant.medicalRestrictions || 'Nenhuma'}</p>
              <p>
                Pago: {formatCurrency(participant.financial.amountPaid)} de{' '}
                {formatCurrency(participant.financial.totalAmount)}
              </p>
              <p>
                Forma de pagamento:{' '}
                {formatPaymentMethodLabel(participant.financial.paymentMethod)}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onEditParticipant(participant)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar participante
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteParticipant(participant)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-400/30 hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir participante
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
