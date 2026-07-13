import { create } from 'zustand'
import type {
  FinancialUpdate,
  LogisticsTask,
  LogisticsTaskInput,
  Participant,
  ParticipantInput,
} from '@shared/types/retreat'
import * as retreatApi from '@/services/retreatApi'

interface RetreatState {
  participants: Participant[]
  logisticsTasks: LogisticsTask[]
  initialized: boolean
  loading: boolean
  syncing: boolean
  error: string | null
  initialize: () => Promise<void>
  clearError: () => void
  addParticipant: (participant: ParticipantInput) => Promise<void>
  updateParticipant: (participantId: string, participant: ParticipantInput) => Promise<void>
  updateParticipantFinancial: (
    participantId: string,
    update: FinancialUpdate,
  ) => Promise<void>
  addLogisticsTask: (task: LogisticsTaskInput) => Promise<void>
  updateLogisticsStatus: (
    taskId: string,
    status: LogisticsTask['status'],
  ) => Promise<void>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado na sincronização'
}

export const useRetreatStore = create<RetreatState>((set, get) => ({
  participants: [],
  logisticsTasks: [],
  initialized: false,
  loading: false,
  syncing: false,
  error: null,
  clearError: () => set({ error: null }),
  initialize: async () => {
    if (get().loading || get().initialized) {
      return
    }

    set({ loading: true, error: null })

    try {
      const [participants, logisticsTasks] = await Promise.all([
        retreatApi.fetchParticipants(),
        retreatApi.fetchLogisticsTasks(),
      ])

      set({
        participants,
        logisticsTasks,
        initialized: true,
        loading: false,
        error: null,
      })
    } catch (error) {
      set({
        loading: false,
        initialized: false,
        error: getErrorMessage(error),
      })
    }
  },
  addParticipant: async (participant) => {
    set({ syncing: true, error: null })

    try {
      const participants = await retreatApi.createParticipant(participant)
      set({ participants, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  updateParticipant: async (participantId, participant) => {
    set({ syncing: true, error: null })

    try {
      const currentAmountPaid =
        get().participants.find((item) => item.id === participantId)?.financial.amountPaid ??
        0

      const participants = await retreatApi.updateParticipant(
        participantId,
        participant,
        currentAmountPaid,
      )

      set({ participants, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  updateParticipantFinancial: async (participantId, update) => {
    set({ syncing: true, error: null })

    try {
      const participants = await retreatApi.updateParticipantFinancial(
        participantId,
        update,
      )

      set({ participants, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  addLogisticsTask: async (task) => {
    set({ syncing: true, error: null })

    try {
      const logisticsTasks = await retreatApi.createLogisticsTask(task)
      set({ logisticsTasks, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  updateLogisticsStatus: async (taskId, status) => {
    set({ syncing: true, error: null })

    try {
      const logisticsTasks = await retreatApi.updateLogisticsStatus(taskId, status)
      set({ logisticsTasks, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
}))
