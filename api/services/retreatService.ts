import type {
  FinancialRecord,
  FinancialUpdate,
  Installment,
  LogisticsTask,
  LogisticsTaskInput,
  Participant,
  ParticipantInput,
  PaymentMethod,
  PublicRegistrationInput,
  RetreatSettings,
  ValidationStatus,
} from '../../shared/types/retreat.js'
import { assertSupabase } from '../lib/supabase.js'

type ParticipantRow = {
  id: string
  nome: string
  idade: number
  telefone: string
  restricoes_medicas: string | null
  restricoes_alimentares: string | null
  status_inscricao: string
  termo_aceito: boolean
  origem_inscricao: string
  financeiro:
    | FinancialRow
    | FinancialRow[]
    | null
}

type FinancialRow = {
  id: string
  participante_id: string
  valor_total: number
  valor_pago: number
  forma_pagamento: string
  num_parcelas: number
  parcelas_pagas: number
  status_geral: string
  status_validacao: string
  financeiro_parcelas:
    | FinancialInstallmentRow[]
    | null
}

type FinancialInstallmentRow = {
  id: string
  numero_parcela: number
  valor_parcela: number
  status: string
  vencimento: string | null
}

type LogisticsRow = {
  id: string
  categoria: string
  tarefa: string
  responsavel: string | null
  valor_estimado: number
  valor_gasto: number
  status: string
  observacoes: string | null
}

type RetreatSettingsRow = {
  id: string
  valor_inscricao: number
}

const DEFAULT_RETREAT_FEE = 380
const SETTINGS_ROW_ID = 'principal'

function createInstallments(totalAmount: number, installmentCount: number): Installment[] {
  const safeCount = Math.max(1, installmentCount)
  const baseAmount = Number((totalAmount / safeCount).toFixed(2))

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `installment-${safeCount}-${index + 1}`,
    label: `${index + 1}x`,
    amount:
      index === safeCount - 1
        ? Number((totalAmount - baseAmount * (safeCount - 1)).toFixed(2))
        : baseAmount,
    status: 'Pendente',
    dueDate: `2026-${String(index + 8).padStart(2, '0')}-10`,
  }))
}

function requiresInstallments(method: PaymentMethod) {
  return method === 'Boleto' || method === 'CartaoCredito'
}

function syncInstallmentsAmountPaid(installments: Installment[], amountPaid: number) {
  let remaining = amountPaid

  return installments.map<Installment>((installment) => {
    if (remaining >= installment.amount) {
      remaining -= installment.amount
      return {
        ...installment,
        status: 'Paga',
      }
    }

    return {
      ...installment,
      status: 'Pendente',
    }
  })
}

function deriveFinancialStatus(totalAmount: number, amountPaid: number) {
  if (amountPaid <= 0) {
    return 'pendente'
  }

  if (amountPaid >= totalAmount) {
    return 'quitado'
  }

  return 'parcial'
}

function toPaymentMethod(value: string): PaymentMethod {
  switch (value) {
    case 'pix':
      return 'PIX'
    case 'dinheiro':
      return 'Dinheiro'
    case 'boleto':
      return 'Boleto'
    case 'cartao':
      return 'CartaoCredito'
    default:
      return 'PIX'
  }
}

function fromPaymentMethod(value: PaymentMethod) {
  switch (value) {
    case 'PIX':
      return 'pix'
    case 'Dinheiro':
      return 'dinheiro'
    case 'Boleto':
      return 'boleto'
    case 'CartaoCredito':
      return 'cartao'
  }
}

function toRegistrationStatus(value: string): Participant['registrationStatus'] {
  switch (value) {
    case 'confirmada':
      return 'Confirmada'
    case 'cancelada':
      return 'Cancelada'
    default:
      return 'Pendente'
  }
}

function fromRegistrationStatus(value: Participant['registrationStatus']) {
  switch (value) {
    case 'Confirmada':
      return 'confirmada'
    case 'Cancelada':
      return 'cancelada'
    default:
      return 'pendente'
  }
}

function toRegistrationSource(value: string): Participant['registrationSource'] {
  return value === 'publica' ? 'Publica' : 'Diretoria'
}

function fromRegistrationSource(value: Participant['registrationSource']) {
  return value === 'Publica' ? 'publica' : 'diretoria'
}

function toValidationStatus(value: string): ValidationStatus {
  switch (value) {
    case 'validado':
      return 'Validado'
    case 'rejeitado':
      return 'Rejeitado'
    default:
      return 'PendenteDeValidacao'
  }
}

function fromValidationStatus(value: ValidationStatus) {
  switch (value) {
    case 'Validado':
      return 'validado'
    case 'Rejeitado':
      return 'rejeitado'
    default:
      return 'pendente_validacao'
  }
}

function toTaskStatus(value: string): LogisticsTask['status'] {
  switch (value) {
    case 'concluido':
      return 'Concluida'
    case 'em_andamento':
      return 'EmAndamento'
    default:
      return 'Pendente'
  }
}

function fromTaskStatus(value: LogisticsTask['status']) {
  switch (value) {
    case 'Concluida':
      return 'concluido'
    case 'EmAndamento':
      return 'em_andamento'
    default:
      return 'pendente'
  }
}

function extractSingleFinance(financial: ParticipantRow['financeiro']) {
  if (!financial) {
    return null
  }

  return Array.isArray(financial) ? financial[0] ?? null : financial
}

function mapFinancialRecord(financial: FinancialRow | null): FinancialRecord {
  if (!financial) {
    const installments = createInstallments(0, 1)
    return {
      totalAmount: 0,
      amountPaid: 0,
      paymentMethod: 'PIX',
      installmentCount: 1,
      installments,
      validationStatus: 'PendenteDeValidacao',
    }
  }

  const installmentCount = Math.max(financial.num_parcelas, 1)
  const baseInstallments = createInstallments(financial.valor_total, installmentCount)
  const parcelRows = financial.financeiro_parcelas ?? []

  if (parcelRows.length === 0) {
    return {
      totalAmount: financial.valor_total,
      amountPaid: financial.valor_pago,
      paymentMethod: toPaymentMethod(financial.forma_pagamento),
      installmentCount,
      installments: syncInstallmentsAmountPaid(baseInstallments, financial.valor_pago),
      validationStatus: toValidationStatus(financial.status_validacao),
    }
  }

  const installments = parcelRows
    .sort((a, b) => a.numero_parcela - b.numero_parcela)
    .map<Installment>((parcel) => ({
      id: parcel.id,
      label: `${parcel.numero_parcela}x`,
      amount: parcel.valor_parcela,
      status: parcel.status === 'paga' ? 'Paga' : 'Pendente',
      dueDate: parcel.vencimento ?? undefined,
    }))

  return {
    totalAmount: financial.valor_total,
    amountPaid: financial.valor_pago,
    paymentMethod: toPaymentMethod(financial.forma_pagamento),
    installmentCount,
    installments,
    validationStatus: toValidationStatus(financial.status_validacao),
  }
}

function mapParticipant(row: ParticipantRow): Participant {
  const financial = mapFinancialRecord(extractSingleFinance(row.financeiro))

  return {
    id: row.id,
    fullName: row.nome,
    age: row.idade,
    phone: row.telefone,
    dietaryRestrictions: row.restricoes_alimentares ?? '',
    medicalRestrictions: row.restricoes_medicas ?? '',
    registrationStatus: toRegistrationStatus(row.status_inscricao),
    registrationSource: toRegistrationSource(row.origem_inscricao),
    termsAccepted: row.termo_aceito,
    financial,
  }
}

function mapLogisticsTask(row: LogisticsRow): LogisticsTask {
  return {
    id: row.id,
    category: row.categoria === 'compras' ? 'Compras' : 'Contratos',
    title: row.tarefa,
    owner: row.responsavel ?? 'Não definido',
    estimatedCost: row.valor_estimado,
    actualCost: row.valor_gasto,
    status: toTaskStatus(row.status),
    notes: row.observacoes ?? '',
  }
}

async function persistFinancialRecord(
  participantId: string,
  update: FinancialUpdate,
  currentAmountPaid?: number,
) {
  const supabase = assertSupabase()
  const installmentCount = requiresInstallments(update.paymentMethod)
    ? update.installmentCount
    : 1
  const amountPaid = Number((currentAmountPaid ?? update.amountPaid).toFixed(2))
  const { data: currentFinancial } = await supabase
    .from('financeiro')
    .select('status_validacao')
    .eq('participante_id', participantId)
    .maybeSingle()
  const installments = syncInstallmentsAmountPaid(
    createInstallments(update.totalAmount, installmentCount),
    amountPaid,
  )

  const { data: financial, error: financialError } = await supabase
    .from('financeiro')
    .upsert(
      {
        participante_id: participantId,
        valor_total: update.totalAmount,
        valor_pago: amountPaid,
        forma_pagamento: fromPaymentMethod(update.paymentMethod),
        num_parcelas: installmentCount,
        parcelas_pagas: installments.filter((item) => item.status === 'Paga').length,
        status_geral: deriveFinancialStatus(update.totalAmount, amountPaid),
        status_validacao: fromValidationStatus(
          update.validationStatus ??
            toValidationStatus(currentFinancial?.status_validacao ?? 'pendente_validacao'),
        ),
      },
      {
        onConflict: 'participante_id',
      },
    )
    .select('id')
    .single()

  if (financialError) {
    throw financialError
  }

  await supabase.from('financeiro_parcelas').delete().eq('financeiro_id', financial.id)

  const parcelPayload = installments.map((installment, index) => ({
    financeiro_id: financial.id,
    numero_parcela: index + 1,
    valor_parcela: installment.amount,
    status: installment.status === 'Paga' ? 'paga' : 'pendente',
    vencimento: installment.dueDate ?? null,
  }))

  if (parcelPayload.length > 0) {
    const { error: parcelError } = await supabase
      .from('financeiro_parcelas')
      .insert(parcelPayload)

    if (parcelError) {
      throw parcelError
    }
  }
}

async function ensureRetreatSettingsRecord() {
  const supabase = assertSupabase()
  const { data: existingSettings, error: selectError } = await supabase
    .from('configuracoes_retiro')
    .select('id, valor_inscricao')
    .eq('id', SETTINGS_ROW_ID)
    .maybeSingle()

  if (selectError) {
    throw selectError
  }

  if (existingSettings) {
    return existingSettings as RetreatSettingsRow
  }

  const { data, error } = await supabase
    .from('configuracoes_retiro')
    .insert({
      id: SETTINGS_ROW_ID,
      valor_inscricao: DEFAULT_RETREAT_FEE,
    })
    .select('id, valor_inscricao')
    .single()

  if (error) {
    throw error
  }

  return data as RetreatSettingsRow
}

function mapRetreatSettings(row: RetreatSettingsRow): RetreatSettings {
  return {
    retreatFee: Number(row.valor_inscricao),
  }
}

async function loadRetreatFee() {
  const settings = await ensureRetreatSettingsRecord()
  return Number(settings.valor_inscricao)
}

async function recalculateFutureInvoices(newRetreatFee: number) {
  const participants = await listParticipants()

  for (const participant of participants) {
    const currentFinancial = participant.financial
    const hasOpenBalance = currentFinancial.amountPaid < currentFinancial.totalAmount

    if (!hasOpenBalance) {
      continue
    }

    const newInstallments = syncInstallmentsAmountPaid(
      createInstallments(newRetreatFee, currentFinancial.installmentCount),
      currentFinancial.amountPaid,
    )

    await persistFinancialRecord(
      participant.id,
      {
        totalAmount: newRetreatFee,
        amountPaid: currentFinancial.amountPaid,
        paymentMethod: currentFinancial.paymentMethod,
        installmentCount: currentFinancial.installmentCount,
        installments: newInstallments,
        validationStatus: currentFinancial.validationStatus,
      },
      currentFinancial.amountPaid,
    )
  }
}

export async function getRetreatSettings() {
  const settings = await ensureRetreatSettingsRecord()
  return mapRetreatSettings(settings)
}

export async function updateRetreatFee(newRetreatFee: number) {
  const supabase = assertSupabase()
  const normalizedFee = Number(newRetreatFee.toFixed(2))

  const { data, error } = await supabase
    .from('configuracoes_retiro')
    .upsert(
      {
        id: SETTINGS_ROW_ID,
        valor_inscricao: normalizedFee,
      },
      { onConflict: 'id' },
    )
    .select('id, valor_inscricao')
    .single()

  if (error) {
    throw error
  }

  await recalculateFutureInvoices(normalizedFee)

  return mapRetreatSettings(data as RetreatSettingsRow)
}

export async function listParticipants() {
  const supabase = assertSupabase()
  const { data, error } = await supabase
    .from('participantes')
    .select(
      `
        id,
        nome,
        idade,
        telefone,
        restricoes_medicas,
        restricoes_alimentares,
        status_inscricao,
        termo_aceito,
        origem_inscricao,
        financeiro (
          id,
          participante_id,
          valor_total,
          valor_pago,
          forma_pagamento,
          num_parcelas,
          parcelas_pagas,
          status_geral,
          status_validacao,
          financeiro_parcelas (
            id,
            numero_parcela,
            valor_parcela,
            status,
            vencimento
          )
        )
      `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as ParticipantRow[]).map(mapParticipant)
}

export async function createParticipantRecord(input: ParticipantInput) {
  const supabase = assertSupabase()
  const { data, error } = await supabase
    .from('participantes')
    .insert({
      nome: input.fullName,
      idade: input.age,
      telefone: input.phone,
      restricoes_medicas: input.medicalRestrictions,
      restricoes_alimentares: input.dietaryRestrictions,
      status_inscricao: fromRegistrationStatus(input.registrationStatus),
      termo_aceito: input.termsAccepted ?? false,
      termo_aceito_em: input.termsAccepted ? new Date().toISOString() : null,
      origem_inscricao: fromRegistrationSource(input.registrationSource ?? 'Diretoria'),
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  await persistFinancialRecord(
    data.id,
    {
      totalAmount: input.totalAmount,
      amountPaid: 0,
      paymentMethod: input.paymentMethod,
      installmentCount: input.installmentCount,
      installments: [],
      validationStatus: input.validationStatus ?? 'Validado',
    },
    0,
  )
}

export async function createPublicRegistrationRecord(input: PublicRegistrationInput) {
  const supabase = assertSupabase()
  const retreatFee = await loadRetreatFee()
  const { data, error } = await supabase
    .from('participantes')
    .insert({
      nome: input.fullName,
      idade: input.age,
      telefone: input.phone,
      restricoes_medicas: input.medicalRestrictions,
      restricoes_alimentares: input.dietaryRestrictions,
      status_inscricao: 'pendente',
      termo_aceito: input.termsAccepted,
      termo_aceito_em: input.termsAccepted ? new Date().toISOString() : null,
      origem_inscricao: 'publica',
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  await persistFinancialRecord(
    data.id,
    {
      totalAmount: retreatFee,
      amountPaid: 0,
      paymentMethod: input.paymentMethod,
      installmentCount: input.installmentCount,
      installments: [],
      validationStatus: 'PendenteDeValidacao',
    },
    0,
  )
}

export async function updateParticipantRecord(
  participantId: string,
  input: ParticipantInput,
  currentAmountPaid: number,
) {
  const supabase = assertSupabase()
  const { error } = await supabase
    .from('participantes')
    .update({
      nome: input.fullName,
      idade: input.age,
      telefone: input.phone,
      restricoes_medicas: input.medicalRestrictions,
      restricoes_alimentares: input.dietaryRestrictions,
      status_inscricao: fromRegistrationStatus(input.registrationStatus),
      termo_aceito: input.termsAccepted ?? false,
      termo_aceito_em: input.termsAccepted ? new Date().toISOString() : null,
      origem_inscricao: fromRegistrationSource(input.registrationSource ?? 'Diretoria'),
    })
    .eq('id', participantId)

  if (error) {
    throw error
  }

  await persistFinancialRecord(
    participantId,
    {
      totalAmount: input.totalAmount,
      amountPaid: currentAmountPaid,
      paymentMethod: input.paymentMethod,
      installmentCount: input.installmentCount,
      installments: [],
      validationStatus: input.validationStatus,
    },
    currentAmountPaid,
  )
}

export async function updateParticipantFinancialRecord(
  participantId: string,
  update: FinancialUpdate,
) {
  await persistFinancialRecord(participantId, update, update.amountPaid)
}

export async function validateParticipantPaymentRecord(
  participantId: string,
  directorId?: string,
) {
  const supabase = assertSupabase()

  const { error: financialError } = await supabase
    .from('financeiro')
    .update({
      status_validacao: 'validado',
      validado_por: directorId ?? null,
      validado_em: new Date().toISOString(),
    })
    .eq('participante_id', participantId)

  if (financialError) {
    throw financialError
  }

  const { error: participantError } = await supabase
    .from('participantes')
    .update({
      status_inscricao: 'confirmada',
    })
    .eq('id', participantId)
    .neq('status_inscricao', 'cancelada')

  if (participantError) {
    throw participantError
  }
}

export async function listLogisticsTasks() {
  const supabase = assertSupabase()
  const { data, error } = await supabase
    .from('checklist_organizacao')
    .select('id, categoria, tarefa, responsavel, valor_estimado, valor_gasto, status, observacoes')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as LogisticsRow[]).map(mapLogisticsTask)
}

export async function createLogisticsTaskRecord(task: LogisticsTaskInput) {
  const supabase = assertSupabase()
  const { error } = await supabase.from('checklist_organizacao').insert({
    categoria: task.category === 'Compras' ? 'compras' : 'contratos',
    tarefa: task.title,
    responsavel: task.owner,
    valor_estimado: task.estimatedCost,
    valor_gasto: task.actualCost,
    status: fromTaskStatus(task.status),
    observacoes: task.notes,
  })

  if (error) {
    throw error
  }
}

export async function updateLogisticsTaskStatusRecord(
  taskId: string,
  status: LogisticsTask['status'],
) {
  const supabase = assertSupabase()
  const { error } = await supabase
    .from('checklist_organizacao')
    .update({
      status: fromTaskStatus(status),
    })
    .eq('id', taskId)

  if (error) {
    throw error
  }
}
