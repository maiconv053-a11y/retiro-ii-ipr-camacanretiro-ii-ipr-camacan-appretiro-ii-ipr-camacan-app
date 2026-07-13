import { Pencil, Search } from 'lucide-react'
import type { Participant, RegistrationStatus } from '@shared/types/retreat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { filterParticipants } from '@/components/participants/participantsFilter'
import { formatCurrency } from '@/utils/format'

interface ParticipantsTableProps {
  participants: Participant[]
  query: string
  statusFilter: 'Todos' | RegistrationStatus
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: 'Todos' | RegistrationStatus) => void
  onEditParticipant: (participant: Participant) => void
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

export function ParticipantsTable({
  participants,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onEditParticipant,
}: ParticipantsTableProps) {
  const filteredParticipants = filterParticipants(participants, query, statusFilter)

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#071120]/80 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-title text-[11px] uppercase tracking-[0.32em] text-violet-300/70">
            Busca rápida
          </p>
          <h2 className="mt-2 font-title text-xl text-white">
            Participantes cadastrados
          </h2>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-300">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 md:min-w-64"
              placeholder="Buscar por nome ou telefone"
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
                    ? 'border-violet-400/30 bg-violet-400/10 text-violet-200'
                    : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-white/10 lg:block">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-[0.24em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Participante</th>
              <th className="px-4 py-3 font-medium">Contato</th>
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
                <td className="px-4 py-4 text-slate-300">{participant.phone}</td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{participant.dietaryRestrictions || 'Nenhuma'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {participant.medicalRestrictions || 'Nenhuma'}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    label={participant.registrationStatus}
                    tone={statusToneMap[participant.registrationStatus]}
                  />
                </td>
                <td className="px-4 py-4 text-slate-300">
                  <p>{formatCurrency(participant.financial.amountPaid)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    de {formatCurrency(participant.financial.totalAmount)} ·{' '}
                    {participant.financial.paymentMethod}
                  </p>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEditParticipant(participant)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
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
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-white">{participant.fullName}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {participant.age} anos · {participant.phone}
                </p>
              </div>
              <StatusBadge
                label={participant.registrationStatus}
                tone={statusToneMap[participant.registrationStatus]}
              />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <p>
                Alimentação: {participant.dietaryRestrictions || 'Nenhuma'}
              </p>
              <p>Médico: {participant.medicalRestrictions || 'Nenhuma'}</p>
              <p>
                Pago: {formatCurrency(participant.financial.amountPaid)} de{' '}
                {formatCurrency(participant.financial.totalAmount)}
              </p>
              <p>Forma de pagamento: {participant.financial.paymentMethod}</p>
              <button
                type="button"
                onClick={() => onEditParticipant(participant)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar participante
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
