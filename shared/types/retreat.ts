export type RegistrationStatus = 'Confirmada' | 'Pendente' | 'Cancelada'

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Boleto' | 'CartaoCredito'

export type InstallmentStatus = 'Paga' | 'Pendente'

export type TaskStatus = 'Pendente' | 'EmAndamento' | 'Concluida'

export type ValidationStatus =
  | 'PendenteDeValidacao'
  | 'Validado'
  | 'Rejeitado'

export type RegistrationSource = 'Publica' | 'Diretoria'

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
  validationStatus: ValidationStatus
}

export interface Participant {
  id: string
  fullName: string
  age: number
  phone: string
  dietaryRestrictions: string
  medicalRestrictions: string
  registrationStatus: RegistrationStatus
  registrationSource: RegistrationSource
  termsAccepted: boolean
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
  termsAccepted?: boolean
  registrationSource?: RegistrationSource
  validationStatus?: ValidationStatus
}

export interface PublicRegistrationInput {
  fullName: string
  age: number
  phone: string
  dietaryRestrictions: string
  medicalRestrictions: string
  paymentMethod: PaymentMethod
  installmentCount: number
  termsAccepted: boolean
}

export interface FinancialUpdate {
  totalAmount: number
  amountPaid: number
  paymentMethod: PaymentMethod
  installmentCount: number
  installments: Installment[]
  validationStatus?: ValidationStatus
}

export interface RetreatSettings {
  retreatFee: number
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

export interface DirectorUser {
  id: string
  name: string
  email: string
}

export interface DirectorSession {
  token: string
  user: DirectorUser
}

export interface DirectorLoginInput {
  email: string
  password: string
}

export interface DirectorRegisterInput {
  name: string
  email: string
  password: string
  setupSecret?: string
}
