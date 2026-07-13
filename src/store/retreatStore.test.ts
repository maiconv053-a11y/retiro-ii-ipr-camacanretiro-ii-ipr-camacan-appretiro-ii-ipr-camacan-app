import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LogisticsTask, Participant } from '@shared/types/retreat'
import * as retreatApi from '@/services/retreatApi'
import { useRetreatStore } from '@/store/retreatStore'
import { createInstallments } from '@/utils/finance'

vi.mock('@/services/retreatApi', () => ({
  fetchParticipants: vi.fn(),
  fetchLogisticsTasks: vi.fn(),
  fetchRetreatSettings: vi.fn(),
  fetchPublicRetreatSettings: vi.fn(),
  createParticipant: vi.fn(),
  updateParticipant: vi.fn(),
  updateParticipantFinancial: vi.fn(),
  updateRetreatFee: vi.fn(),
  validateParticipantPayment: vi.fn(),
  createLogisticsTask: vi.fn(),
  updateLogisticsStatus: vi.fn(),
}))

const mockedApi = vi.mocked(retreatApi)

const participantsFixture: Participant[] = [
  {
    id: 'participant-1',
    fullName: 'Ana Clara Santos',
    age: 23,
    phone: '(73) 99911-2233',
    email: 'ana@email.com',
    church: 'II IPR de Camacan',
    city: 'Camacan - BA',
    dietaryRestrictions: 'Sem lactose',
    medicalRestrictions: 'Nenhuma',
    registrationStatus: 'Confirmada',
    registrationSource: 'Diretoria',
    termsAccepted: true,
    financial: {
      totalAmount: 380,
      amountPaid: 380,
      paymentMethod: 'PIX',
      installmentCount: 1,
      installments: [
        { id: 'i1', label: '1x', amount: 380, status: 'Paga', dueDate: '2026-08-10' },
      ],
      validationStatus: 'Validado',
    },
  },
  {
    id: 'participant-2',
    fullName: 'Mateus Oliveira',
    age: 31,
    phone: '(73) 98877-1144',
    email: 'mateus@email.com',
    church: 'IPR Central',
    city: 'Itabuna - BA',
    dietaryRestrictions: 'Vegetariano',
    medicalRestrictions: 'Hipertensão controlada',
    registrationStatus: 'Pendente',
    registrationSource: 'Publica',
    termsAccepted: true,
    financial: {
      totalAmount: 380,
      amountPaid: 190,
      paymentMethod: 'CartaoCredito',
      installmentCount: 2,
      installments: [
        { id: 'i2', label: '1x', amount: 190, status: 'Paga', dueDate: '2026-08-10' },
        { id: 'i3', label: '2x', amount: 190, status: 'Pendente', dueDate: '2026-09-10' },
      ],
      validationStatus: 'PendenteDeValidacao',
    },
  },
]

const logisticsFixture: LogisticsTask[] = [
  {
    id: 'task-1',
    category: 'Compras',
    title: 'Mercado',
    owner: 'Equipe',
    estimatedCost: 100,
    actualCost: 80,
    status: 'Pendente',
    notes: 'Itens básicos',
  },
]

describe('retreatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRetreatStore.setState({
      participants: [],
      logisticsTasks: [],
      settings: {
        retreatFee: 380,
      },
      initialized: false,
      loading: false,
      syncing: false,
      error: null,
    })

    mockedApi.fetchParticipants.mockResolvedValue(participantsFixture)
    mockedApi.fetchLogisticsTasks.mockResolvedValue(logisticsFixture)
    mockedApi.fetchRetreatSettings.mockResolvedValue({ retreatFee: 380 })
    mockedApi.createParticipant.mockResolvedValue([
      {
        ...participantsFixture[0],
        id: 'participant-3',
        fullName: 'Novo Participante',
      },
      ...participantsFixture,
    ])
    mockedApi.updateParticipant.mockResolvedValue([
      {
        ...participantsFixture[1],
        fullName: 'Mateus Oliveira Atualizado',
      },
      participantsFixture[0],
    ])
    mockedApi.updateParticipantFinancial.mockResolvedValue(participantsFixture)
    mockedApi.updateRetreatFee.mockResolvedValue({
      settings: { retreatFee: 450 },
      participants: participantsFixture.map((participant) => ({
        ...participant,
        financial: {
          ...participant.financial,
          totalAmount:
            participant.financial.amountPaid < participant.financial.totalAmount
              ? 450
              : participant.financial.totalAmount,
        },
      })),
    })
    mockedApi.validateParticipantPayment.mockResolvedValue(participantsFixture)
    mockedApi.createLogisticsTask.mockResolvedValue(logisticsFixture)
    mockedApi.updateLogisticsStatus.mockResolvedValue(logisticsFixture)
  })

  it('carrega participantes e checklist na inicialização', async () => {
    await useRetreatStore.getState().initialize()

    expect(mockedApi.fetchParticipants).toHaveBeenCalledTimes(1)
    expect(mockedApi.fetchLogisticsTasks).toHaveBeenCalledTimes(1)
    expect(mockedApi.fetchRetreatSettings).toHaveBeenCalledTimes(1)
    expect(useRetreatStore.getState().participants).toHaveLength(2)
    expect(useRetreatStore.getState().logisticsTasks).toHaveLength(1)
    expect(useRetreatStore.getState().settings.retreatFee).toBe(380)
    expect(useRetreatStore.getState().initialized).toBe(true)
  })

  it('cria participante usando a API e atualiza o estado local', async () => {
    await useRetreatStore.getState().addParticipant({
      fullName: 'Novo Participante',
      age: 27,
      phone: '(73) 99999-9999',
      email: 'novo@email.com',
      church: 'II IPR de Camacan',
      city: 'Camacan - BA',
      dietaryRestrictions: 'Nenhuma',
      medicalRestrictions: 'Nenhuma',
      registrationStatus: 'Pendente',
      totalAmount: 480,
      paymentMethod: 'Boleto',
      installmentCount: 4,
    })

    expect(mockedApi.createParticipant).toHaveBeenCalledTimes(1)
    expect(useRetreatStore.getState().participants[0].fullName).toBe('Novo Participante')
  })

  it('edita dados do participante usando o valor já pago atual', async () => {
    useRetreatStore.setState({ participants: participantsFixture })

    await useRetreatStore.getState().updateParticipant('participant-2', {
      fullName: 'Mateus Oliveira Atualizado',
      age: 32,
      phone: '(73) 97777-1111',
      email: 'mateus.atualizado@email.com',
      church: 'IPR Renovada',
      city: 'Itabuna - BA',
      dietaryRestrictions: 'Sem açúcar',
      medicalRestrictions: 'Nenhuma',
      registrationStatus: 'Confirmada',
      totalAmount: 500,
      paymentMethod: 'PIX',
      installmentCount: 1,
    })

    expect(mockedApi.updateParticipant).toHaveBeenCalledWith(
      'participant-2',
      expect.objectContaining({
        fullName: 'Mateus Oliveira Atualizado',
      }),
      190,
    )
    expect(useRetreatStore.getState().participants[0].fullName).toBe(
      'Mateus Oliveira Atualizado',
    )
  })

  it('gera parcelas que respeitam o valor total', () => {
    const installments = createInstallments(380, 3)
    const total = installments.reduce((sum, installment) => sum + installment.amount, 0)

    expect(installments).toHaveLength(3)
    expect(Number(total.toFixed(2))).toBe(380)
  })

  it('atualiza o valor do retiro e sincroniza participantes pendentes', async () => {
    await useRetreatStore.getState().updateRetreatFee(450)

    expect(mockedApi.updateRetreatFee).toHaveBeenCalledWith(450)
    expect(useRetreatStore.getState().settings.retreatFee).toBe(450)
    expect(useRetreatStore.getState().participants[1].financial.totalAmount).toBe(450)
  })
})
