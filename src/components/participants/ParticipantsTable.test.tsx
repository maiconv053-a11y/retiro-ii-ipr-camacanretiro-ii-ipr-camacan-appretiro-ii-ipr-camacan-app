import { describe, expect, it } from 'vitest'
import type { Participant } from '@shared/types/retreat'
import { filterParticipants } from '@/components/participants/participantsFilter'

const participants: Participant[] = [
  {
    id: '1',
    fullName: 'João da Silva',
    age: 24,
    phone: '(73) 99999-0001',
    email: 'joao@email.com',
    church: 'II IPR de Camacan',
    city: 'Camacan - BA',
    dietaryRestrictions: 'Nenhuma',
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
    id: '2',
    fullName: 'Maria Souza',
    age: 29,
    phone: '(73) 98888-0002',
    email: 'maria@email.com',
    church: 'IPR Central',
    city: 'Itabuna - BA',
    dietaryRestrictions: 'Sem lactose',
    medicalRestrictions: 'Nenhuma',
    registrationStatus: 'Pendente',
    registrationSource: 'Publica',
    termsAccepted: true,
    financial: {
      totalAmount: 380,
      amountPaid: 100,
      paymentMethod: 'Boleto',
      installmentCount: 3,
      installments: [
        { id: 'i2', label: '1x', amount: 126.67, status: 'Paga', dueDate: '2026-08-10' },
        { id: 'i3', label: '2x', amount: 126.67, status: 'Pendente', dueDate: '2026-09-10' },
        { id: 'i4', label: '3x', amount: 126.66, status: 'Pendente', dueDate: '2026-10-10' },
      ],
      validationStatus: 'PendenteDeValidacao',
    },
  },
  {
    id: '3',
    fullName: 'Paulo Cancelado',
    age: 40,
    phone: '(73) 97777-0003',
    email: 'paulo@email.com',
    church: 'IPR Esperança',
    city: 'Canavieiras - BA',
    dietaryRestrictions: 'Nenhuma',
    medicalRestrictions: 'Nenhuma',
    registrationStatus: 'Cancelada',
    registrationSource: 'Diretoria',
    termsAccepted: false,
    financial: {
      totalAmount: 380,
      amountPaid: 50,
      paymentMethod: 'Dinheiro',
      installmentCount: 1,
      installments: [
        { id: 'i5', label: '1x', amount: 380, status: 'Pendente', dueDate: '2026-08-10' },
      ],
      validationStatus: 'Rejeitado',
    },
  },
]

describe('filterParticipants', () => {
  it('filtra por nome ignorando acentos', () => {
    const result = filterParticipants(participants, 'joao', 'Todos')
    expect(result).toHaveLength(1)
    expect(result[0].fullName).toBe('João da Silva')
  })

  it('combina busca e filtro de status', () => {
    const result = filterParticipants(participants, 'maria', 'Pendente')
    expect(result).toHaveLength(1)
    expect(result[0].registrationStatus).toBe('Pendente')
  })

  it('não mostra cancelados no filtro padrão de inscrições', () => {
    const result = filterParticipants(participants, '', 'Todos')
    expect(result).toHaveLength(2)
    expect(result.some((participant) => participant.registrationStatus === 'Cancelada')).toBe(false)
  })

  it('mostra cancelados quando o filtro cancelada é selecionado', () => {
    const result = filterParticipants(participants, '', 'Cancelada')
    expect(result).toHaveLength(1)
    expect(result[0].fullName).toBe('Paulo Cancelado')
  })
})
