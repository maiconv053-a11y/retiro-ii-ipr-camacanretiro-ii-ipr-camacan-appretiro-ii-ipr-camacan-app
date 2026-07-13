export type RegistrationStatus = 'Confirmada' | 'Pendente' | 'Cancelada'

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Boleto' | 'CartaoCredito'

export type InstallmentStatus = 'Paga' | 'Pendente'

export type TaskStatus = 'Pendente' | 'EmAndamento' | 'Concluida'

export interface Installment {
  id: string
  label: string
  amount: number
  status: InstallmentStatus
  dueDate?: string
}

export interface FinancialRecord {
  totalAmount: number
  amountPaid: number
  paymentMethod: PaymentMethod
  installmentCount: number
  installments: Installment[]
}

export interface Participant {
  id: string
  fullName: string
  age: number
  phone: string
  dietaryRestrictions: string
  medicalRestrictions: string
  registrationStatus: RegistrationStatus
  financial: FinancialRecord
}

export interface ParticipantInput {
  fullName: string
  age: number
  phone: string
  dietaryRestrictions: string
  medicalRestrictions: string
  registrationStatus: RegistrationStatus
  totalAmount: number
  paymentMethod: PaymentMethod
  installmentCount: number
}

export interface FinancialUpdate {
  totalAmount: number
  amountPaid: number
  paymentMethod: PaymentMethod
  installmentCount: number
  installments: Installment[]
}

export interface LogisticsTask {
  id: string
  category: 'Compras' | 'Contratos'
  title: string
  owner: string
  estimatedCost: number
  actualCost: number
  status: TaskStatus
  notes: string
}

export interface LogisticsTaskInput {
  category: 'Compras' | 'Contratos'
  title: string
  owner: string
  estimatedCost: number
  actualCost: number
  status: TaskStatus
  notes: string
}
