import { create } from 'zustand'
import type {
  FinancialUpdate,
  LogisticsSale,
  LogisticsSaleInput,
  LogisticsTask,
  LogisticsTaskInput,
  Participant,
  ParticipantInput,
  RetreatSettings,
} from '@shared/types/retreat'
import * as retreatApi from '@/services/retreatApi'

interface RetreatState {
  participants: Participant[]
  logisticsTasks: LogisticsTask[]
  logisticsSales: LogisticsSale[]
  settings: RetreatSettings
  initialized: boolean
  loading: boolean
  syncing: boolean
  error: string | null
  initialize: () => Promise<void>
  reset: () => void
  clearError: () => void
  addParticipant: (participant: ParticipantInput) => Promise<void>
  updateParticipant: (participantId: string, participant: ParticipantInput) => Promise<void>
  deleteParticipant: (participantId: string) => Promise<void>
  updateParticipantFinancial: (
    participantId: string,
    update: FinancialUpdate,
  ) => Promise<void>
  validateParticipantPayment: (participantId: string) => Promise<void>
  sendParticipantChargeEmail: (
    participantId: string,
    installmentId?: string,
  ) => Promise<{
    sent: boolean
    email: string
    installmentId: string
    installmentNumber: number
  }>
  updateRetreatFee: (retreatFee: number) => Promise<void>
  addLogisticsTask: (task: LogisticsTaskInput) => Promise<void>
  updateLogisticsTask: (taskId: string, task: LogisticsTaskInput) => Promise<void>
  updateLogisticsStatus: (
    taskId: string,
    status: LogisticsTask['status'],
  ) => Promise<void>
  deleteLogisticsTask: (taskId: string) => Promise<void>
  addLogisticsSale: (sale: LogisticsSaleInput) => Promise<void>
  updateLogisticsSale: (saleId: string, sale: LogisticsSaleInput) => Promise<void>
  deleteLogisticsSale: (saleId: string) => Promise<void>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado na sincronização'
}

export const useRetreatStore = create<RetreatState>((set, get) => ({
  participants: [],
  logisticsTasks: [],
  logisticsSales: [],
  settings: {
    retreatFee: 750,
  },
  initialized: false,
  loading: false,
  syncing: false,
  error: null,
  reset: () =>
    set({
      participants: [],
      logisticsTasks: [],
      logisticsSales: [],
      settings: {
        retreatFee: 750,
      },
      initialized: false,
      loading: false,
      syncing: false,
      error: null,
    }),
  clearError: () => set({ error: null }),
  initialize: async () => {
    if (get().loading || get().initialized) {
      return
    }

    set({ loading: true, error: null })

    try {
      const [participants, logisticsTasks, logisticsSales, settings] = await Promise.all([
        retreatApi.fetchParticipants(),
        retreatApi.fetchLogisticsTasks(),
        retreatApi.fetchLogisticsSales(),
        retreatApi.fetchRetreatSettings(),
      ])

      set({
        participants,
        logisticsTasks,
        logisticsSales,
        settings,
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
  deleteParticipant: async (participantId) => {
    set({ syncing: true, error: null })

    try {
      const participants = await retreatApi.deleteParticipant(participantId)
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
  validateParticipantPayment: async (participantId) => {
    set({ syncing: true, error: null })

    try {
      const participants = await retreatApi.validateParticipantPayment(participantId)

      set({ participants, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  sendParticipantChargeEmail: async (participantId, installmentId) => {
    set({ syncing: true, error: null })

    try {
      const result = await retreatApi.sendParticipantChargeEmail(participantId, installmentId)
      set({ syncing: false })
      return result
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  updateRetreatFee: async (retreatFee) => {
    set({ syncing: true, error: null })

    try {
      const data = await retreatApi.updateRetreatFee(retreatFee)
      set({
        participants: data.participants,
        settings: data.settings,
        syncing: false,
      })
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
  updateLogisticsTask: async (taskId, task) => {
    set({ syncing: true, error: null })

    try {
      const logisticsTasks = await retreatApi.updateLogisticsTask(taskId, task)
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
  deleteLogisticsTask: async (taskId) => {
    set({ syncing: true, error: null })

    try {
      const logisticsTasks = await retreatApi.deleteLogisticsTask(taskId)
      set({ logisticsTasks, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  addLogisticsSale: async (sale) => {
    set({ syncing: true, error: null })

    try {
      const logisticsSales = await retreatApi.createLogisticsSale(sale)
      set({ logisticsSales, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  updateLogisticsSale: async (saleId, sale) => {
    set({ syncing: true, error: null })

    try {
      const logisticsSales = await retreatApi.updateLogisticsSale(saleId, sale)
      set({ logisticsSales, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
  deleteLogisticsSale: async (saleId) => {
    set({ syncing: true, error: null })

    try {
      const logisticsSales = await retreatApi.deleteLogisticsSale(saleId)
      set({ logisticsSales, syncing: false })
    } catch (error) {
      set({ syncing: false, error: getErrorMessage(error) })
      throw error
    }
  },
}))
