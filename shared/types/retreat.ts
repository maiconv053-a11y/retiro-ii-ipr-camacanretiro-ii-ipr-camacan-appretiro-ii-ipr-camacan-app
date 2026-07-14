export type RegistrationStatus = 'Confirmada' | 'Pendente' | 'Cancelada'

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Boleto' | 'CartaoCredito'

export const MAX_INSTALLMENTS_BY_METHOD: Record<PaymentMethod, number> = {
  PIX: 1,
  Dinheiro: 1,
  Boleto: 7,
  CartaoCredito: 12,
}

export function requiresInstallments(method: PaymentMethod) {
  return method === 'Boleto' || method === 'CartaoCredito'
}

export function getMaxInstallmentsForMethod(method: PaymentMethod) {
  return MAX_INSTALLMENTS_BY_METHOD[method]
}

export function normalizeInstallmentCount(
  method: PaymentMethod,
  installmentCount: number,
) {
  const safeCount = Math.max(1, Math.trunc(installmentCount || 1))
  return Math.min(safeCount, getMaxInstallmentsForMethod(method))
}

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
  birthDate: string
  ageAtEvent: number
  phone: string
  email: string
  church: string
  city: string
  dietaryRestrictions: string
  medicalRestrictions: string
  registrationStatus: RegistrationStatus
  registrationSource: RegistrationSource
  termsAccepted: boolean
  financial: FinancialRecord
}

export interface ParticipantInput {
  fullName: string
  birthDate: string
  phone: string
  email: string
  church: string
  city: string
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
  birthDate: string
  phone: string
  email: string
  church: string
  city: string
  dietaryRestrictions: string
  medicalRestrictions: string
  paymentMethod: PaymentMethod
  installmentCount: number
  termsAccepted: boolean
}

export interface PublicRegistrationSuccessSummary {
  participantId: string
  paymentMethod: PaymentMethod
  installmentCount: number
  totalAmount: number
  installmentAmounts: number[]
  dueDates: string[] | null
  cardInstallmentLabel: string | null
  ageAtEvent: number
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
