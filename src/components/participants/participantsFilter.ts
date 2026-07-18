import type { Participant, RegistrationStatus } from '@shared/types/retreat'
import { slugify } from '@/utils/format'
import { sanitizeCpf } from '@shared/utils/cpf'

export function filterParticipants(
  participants: Participant[],
  query: string,
  statusFilter: 'Todos' | RegistrationStatus,
) {
  const safeQuery = slugify(query.trim())

  return participants.filter((participant) => {
    const matchesQuery =
      safeQuery.length === 0 ||
      slugify(participant.fullName).includes(safeQuery) ||
      participant.phone.includes(query) ||
      sanitizeCpf(participant.cpf).includes(sanitizeCpf(query)) ||
      slugify(participant.email).includes(safeQuery) ||
      slugify(participant.church).includes(safeQuery) ||
      slugify(participant.city).includes(safeQuery)

    const matchesStatus =
      statusFilter === 'Todos'
        ? participant.registrationStatus !== 'Cancelada'
        : participant.registrationStatus === statusFilter

    return matchesQuery && matchesStatus
  })
}
