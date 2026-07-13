import type {
  FinancialUpdate,
  LogisticsTask,
  LogisticsTaskInput,
  Participant,
  ParticipantInput,
  PublicRegistrationInput,
  RetreatSettings,
  TaskStatus,
} from '@shared/types/retreat'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

interface RetreatFeeUpdateResponse {
  settings: RetreatSettings
  participants: Participant[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Erro ao comunicar com a API')
  }

  return payload.data
}

export function fetchParticipants() {
  return request<Participant[]>('/api/participants')
}

export function createParticipant(participant: ParticipantInput) {
  return request<Participant[]>('/api/participants', {
    method: 'POST',
    body: JSON.stringify(participant),
  })
}

export function createPublicRegistration(participant: PublicRegistrationInput) {
  return request<{ created: boolean }>('/api/public/registrations', {
    method: 'POST',
    body: JSON.stringify(participant),
  })
}

export function fetchPublicRetreatSettings() {
  return request<RetreatSettings>('/api/public/settings')
}

export function fetchRetreatSettings() {
  return request<RetreatSettings>('/api/settings')
}

export function updateRetreatFee(retreatFee: number) {
  return request<RetreatFeeUpdateResponse>('/api/settings/retreat-fee', {
    method: 'PATCH',
    body: JSON.stringify({ retreatFee }),
  })
}

export function updateParticipant(
  participantId: string,
  participant: ParticipantInput,
  currentAmountPaid: number,
) {
  return request<Participant[]>(`/api/participants/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...participant,
      currentAmountPaid,
    }),
  })
}

export function updateParticipantFinancial(
  participantId: string,
  update: FinancialUpdate,
) {
  return request<Participant[]>(`/api/participants/${participantId}/financial`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  })
}

export function validateParticipantPayment(participantId: string) {
  return request<Participant[]>(`/api/participants/${participantId}/validate-payment`, {
    method: 'PATCH',
  })
}

export function fetchLogisticsTasks() {
  return request<LogisticsTask[]>('/api/logistics')
}

export function createLogisticsTask(task: LogisticsTaskInput) {
  return request<LogisticsTask[]>('/api/logistics', {
    method: 'POST',
    body: JSON.stringify(task),
  })
}

export function updateLogisticsStatus(taskId: string, status: TaskStatus) {
  return request<LogisticsTask[]>(`/api/logistics/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
