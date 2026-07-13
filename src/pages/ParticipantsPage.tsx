import { useState } from 'react'
import type {
  Participant,
  ParticipantInput,
  RegistrationStatus,
} from '@shared/types/retreat'
import { ParticipantForm } from '@/components/participants/ParticipantForm'
import { ParticipantsTable } from '@/components/participants/ParticipantsTable'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'

export default function ParticipantsPage() {
  const participants = useRetreatStore((state) => state.participants)
  const retreatFee = useRetreatStore((state) => state.settings.retreatFee)
  const activeParticipantsCount = participants.filter(
    (participant) => participant.registrationStatus !== 'Cancelada',
  ).length
  const addParticipant = useRetreatStore((state) => state.addParticipant)
  const updateParticipant = useRetreatStore((state) => state.updateParticipant)
  const deleteParticipant = useRetreatStore((state) => state.deleteParticipant)
  const syncing = useRetreatStore((state) => state.syncing)
  const [query, setQuery] = useState('')
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [statusFilter, setStatusFilter] = useState<'Todos' | RegistrationStatus>(
    'Todos',
  )

  function mapParticipantToInput(participant: Participant): ParticipantInput {
    return {
      fullName: participant.fullName,
      age: participant.age,
      phone: participant.phone,
      email: participant.email,
      church: participant.church,
      city: participant.city,
      dietaryRestrictions: participant.dietaryRestrictions,
      medicalRestrictions: participant.medicalRestrictions,
      registrationStatus: participant.registrationStatus,
      totalAmount: participant.financial.totalAmount,
      paymentMethod: participant.financial.paymentMethod,
      installmentCount: participant.financial.installmentCount,
    }
  }

  async function handleSubmit(values: ParticipantInput) {
    if (editingParticipant) {
      await updateParticipant(editingParticipant.id, values)
      setEditingParticipant(null)
      return
    }

    await addParticipant(values)
  }

  async function handleDeleteParticipant(participant: Participant) {
    const confirmed = window.confirm(
      `Deseja excluir o participante "${participant.fullName}"? Essa ação remove também o financeiro vinculado.`,
    )

    if (!confirmed) {
      return
    }

    await deleteParticipant(participant.id)

    if (editingParticipant?.id === participant.id) {
      setEditingParticipant(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Módulo 1"
        title="Inscrição e gerenciamento de participantes"
        description="Cadastre novos inscritos, acompanhe dados essenciais e filtre rapidamente quem já confirmou presença."
        action={
          <StatusBadge label={`${activeParticipantsCount} inscrições`} tone="green" />
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[0.78fr_1.22fr]">
        <ParticipantForm
          onSubmit={handleSubmit}
          defaultTotalAmount={retreatFee}
          mode={editingParticipant ? 'edit' : 'create'}
          initialValues={
            editingParticipant ? mapParticipantToInput(editingParticipant) : undefined
          }
          onCancelEdit={() => setEditingParticipant(null)}
          isSubmitting={syncing}
        />
        <ParticipantsTable
          participants={participants}
          query={query}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onEditParticipant={setEditingParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          isSubmitting={syncing}
        />
      </div>
    </div>
  )
}
