import { Download, Pencil, Search, Trash2 } from 'lucide-react'
import type { Participant, RegistrationStatus } from '@shared/types/retreat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { filterParticipants } from '@/components/participants/participantsFilter'
import { formatCurrency, formatPaymentMethodLabel } from '@/utils/format'
import { downloadParticipantContractPdf } from '@/utils/participantContractPdf'

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

  async function handleDownloadContract(participant: Participant) {
    await downloadParticipantContractPdf(participant)
  }

  return (
    <section className="rounded-[28px] border border-[#98c5aa]/50 bg-[#e3f2e7]/96 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="font-title text-[11px] uppercase tracking-[0.32em] text-[#4f8e6c]">BUSCA RÁPIDA</p>
          <h2 className="mt-2 font-title text-xl text-[#20352a]">
            Participantes cadastrados
          </h2>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
          <label className="flex w-full items-center gap-3 rounded-2xl border border-[#9fcab0]/55 bg-white/86 px-4 py-3 text-slate-700 xl:max-w-[26rem]">
            <Search className="h-4 w-4 text-[#4f8e6c]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#667d71]"
              placeholder="Buscar por nome, CPF, telefone, e-mail, igreja ou cidade"
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
                    ? 'border-[#69a884]/60 bg-[#cfe6d7] text-[#214a34]'
                    : 'border-[#a8ccb6]/45 bg-white/80 text-[#42594d] hover:border-[#79b08f]/60 hover:text-[#20352a]'
                }`}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-[#a8ccb6]/45 lg:block">
        <table className="w-full table-fixed divide-y divide-[#bfd9c9] text-left text-sm">
          <thead className="bg-[#d2e8d8] text-xs uppercase tracking-[0.24em] text-[#456653]">
            <tr>
              <th className="w-[15%] px-3 py-3 font-medium">Participante</th>
              <th className="w-[17%] px-3 py-3 font-medium">Contato</th>
              <th className="w-[12%] px-3 py-3 font-medium">Igreja e cidade</th>
              <th className="w-[14%] px-3 py-3 font-medium">Restrições</th>
              <th className="w-[10%] px-3 py-3 font-medium">Status</th>
              <th className="w-[14%] px-3 py-3 font-medium">Financeiro</th>
              <th className="w-[18%] px-3 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d7e7dc]">
            {filteredParticipants.map((participant) => (
              <tr key={participant.id} className="bg-white/60 text-slate-700">
                <td className="align-top px-3 py-4">
                  <p className="break-words font-medium text-[#20352a]">{participant.fullName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#587264]">
                    {participant.ageAtEvent} anos
                  </p>
                </td>
                <td className="align-top px-3 py-4 text-slate-700">
                  <p className="break-words">{participant.phone}</p>
                  <p className="mt-1 break-words text-xs text-[#587264]">{participant.cpf || 'Sem CPF'}</p>
                  <p className="mt-1 break-words text-xs text-[#587264]">
                    {participant.email || 'Sem e-mail'}
                  </p>
                </td>
                <td className="align-top px-3 py-4 text-slate-700">
                  <p className="break-words">{participant.church || 'Igreja não informada'}</p>
                  <p className="mt-1 break-words text-xs text-[#587264]">
                    {participant.city || 'Cidade não informada'}
                  </p>
                </td>
                <td className="align-top px-3 py-4 text-[#42594d]">
                  <p className="break-words">{participant.dietaryRestrictions || 'Nenhuma'}</p>
                  <p className="mt-1 break-words text-xs text-[#587264]">
                    {participant.medicalRestrictions || 'Nenhuma'}
                  </p>
                </td>
                <td className="align-top px-3 py-4">
                  <StatusBadge
                    label={registrationStatusLabels[participant.registrationStatus]}
                    tone={statusToneMap[participant.registrationStatus]}
                  />
                </td>
                <td className="align-top px-3 py-4 text-[#42594d]">
                  <p className="break-words">{formatCurrency(participant.financial.amountPaid)}</p>
                  <p className="mt-1 break-words text-xs text-[#587264]">
                    de {formatCurrency(participant.financial.totalAmount)} ·{' '}
                    {formatPaymentMethodLabel(participant.financial.paymentMethod)}
                  </p>
                </td>
                <td className="align-top px-3 py-4 text-right">
                  <div className="ml-auto flex max-w-[12rem] flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDownloadContract(participant)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#a2c9b1]/55 bg-white/84 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-700 transition hover:border-[#73a985]/60 hover:bg-[#d1e7d8] hover:text-[#214a34] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Contrato
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditParticipant(participant)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#a2c9b1]/55 bg-white/84 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-700 transition hover:border-[#73a985]/60 hover:bg-[#d1e7d8] hover:text-[#214a34] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteParticipant(participant)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/45 bg-rose-50 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-400/40 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="rounded-[24px] border border-[#a8ccb6]/45 bg-white/84 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-[#20352a]">{participant.fullName}</h3>
                <p className="mt-1 text-sm text-[#42594d]">
                  {participant.ageAtEvent} anos · {participant.phone}
                </p>
                <p className="mt-1 text-sm text-[#587264]">{participant.cpf || 'Sem CPF'}</p>
                <p className="mt-1 text-sm text-[#587264]">{participant.email || 'Sem e-mail'}</p>
              </div>
              <StatusBadge
                label={registrationStatusLabels[participant.registrationStatus]}
                tone={statusToneMap[participant.registrationStatus]}
              />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
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
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleDownloadContract(participant)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#a2c9b1]/55 bg-white/84 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-700 transition hover:border-[#73a985]/60 hover:bg-[#d1e7d8] hover:text-[#214a34] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar contrato
                </button>
                <button
                  type="button"
                  onClick={() => onEditParticipant(participant)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#a2c9b1]/55 bg-white/84 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-700 transition hover:border-[#73a985]/60 hover:bg-[#d1e7d8] hover:text-[#214a34] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar participante
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteParticipant(participant)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/45 bg-rose-50 px-4 py-3 text-xs uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400/40 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
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
