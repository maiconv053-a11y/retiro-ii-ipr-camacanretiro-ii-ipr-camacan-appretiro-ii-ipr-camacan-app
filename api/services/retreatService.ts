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
  PublicRegistrationSuccessSummary,
  RetreatSettings,
  ValidationStatus,
} from '../../shared/types/retreat.js'
import {
  normalizeInstallmentCount,
  requiresInstallments,
} from '../../shared/types/retreat.js'
import {
  calculateAgeOnDate,
  computeDueDates,
  computeRegistrationPricing,
  EVENT_DATE,
} from '../../shared/utils/registrationPricing.js'
import { assertSupabase } from '../lib/supabase.js'

type ParticipantRow = {
  id: string
  nome: string
  idade: number
  birth_date: string | null
  telefone: string
  email: string | null
  igreja: string | null
  cidade: string | null
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

type InstallmentBoletoRow = {
  id: string
  numero_parcela: number
  valor_parcela: number
  status: string
  vencimento: string | null
  financeiro:
    | {
        id: string
        forma_pagamento: string
        num_parcelas: number
        participante:
          | {
              id: string
              nome: string
              telefone: string | null
              email: string | null
              igreja: string | null
              cidade: string | null
            }
          | {
              id: string
              nome: string
              telefone: string | null
              email: string | null
              igreja: string | null
              cidade: string | null
            }[]
          | null
      }
    | {
        id: string
        forma_pagamento: string
        num_parcelas: number
        participante:
          | {
              id: string
              nome: string
              telefone: string | null
              email: string | null
              igreja: string | null
              cidade: string | null
            }
          | {
              id: string
              nome: string
              telefone: string | null
              email: string | null
              igreja: string | null
              cidade: string | null
            }[]
          | null
      }[]
    | null
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

const DEFAULT_RETREAT_FEE = 750
const SETTINGS_ROW_ID = 'principal'

function createInstallments(
  totalAmount: number,
  installmentCount: number,
  referenceDate: Date = new Date(),
): Installment[] {
  const safeCount = Math.max(1, installmentCount)
  const baseAmount = Number((totalAmount / safeCount).toFixed(2))
  const dueDates = computeDueDates(referenceDate, safeCount)

  return Array.from({ length: safeCount }, (_, index) => ({
    id: `installment-${safeCount}-${index + 1}`,
    label: `${index + 1}x`,
    amount:
      index === safeCount - 1
        ? Number((totalAmount - baseAmount * (safeCount - 1)).toFixed(2))
        : baseAmount,
    status: 'Pendente',
    dueDate: dueDates[index],
  }))
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

  const paymentMethod = toPaymentMethod(financial.forma_pagamento)
  const installmentCount = normalizeInstallmentCount(paymentMethod, financial.num_parcelas)
  const baseInstallments = createInstallments(financial.valor_total, installmentCount)
  const parcelRows = financial.financeiro_parcelas ?? []

  if (parcelRows.length === 0) {
    return {
      totalAmount: financial.valor_total,
      amountPaid: financial.valor_pago,
      paymentMethod,
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
    paymentMethod,
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
    birthDate: row.birth_date ?? '',
    ageAtEvent: row.idade,
    phone: row.telefone,
    email: row.email ?? '',
    church: row.igreja ?? '',
    city: row.cidade ?? '',
    dietaryRestrictions: row.restricoes_alimentares ?? '',
    medicalRestrictions: row.restricoes_medicas ?? '',
    registrationStatus: toRegistrationStatus(row.status_inscricao),
    registrationSource: toRegistrationSource(row.origem_inscricao),
    termsAccepted: row.termo_aceito,
    financial,
  }
}

async function persistFinancialRecordFromPlan(params: {
  participantId: string
  paymentMethod: PaymentMethod
  validationStatus: ValidationStatus
  totalAmount: number
  installmentAmounts: number[]
  dueDates: string[] | null
}) {
  const supabase = assertSupabase()
  const normalizedTotalAmount = Number(params.totalAmount.toFixed(2))
  const amountPaid = 0
  const installmentCount = Math.max(1, params.installmentAmounts.length)

  const { data: financial, error: financialError } = await supabase
    .from('financeiro')
    .upsert(
      {
        participante_id: params.participantId,
        valor_total: normalizedTotalAmount,
        valor_pago: amountPaid,
        forma_pagamento: fromPaymentMethod(params.paymentMethod),
        num_parcelas: installmentCount,
        parcelas_pagas: 0,
        status_geral: deriveFinancialStatus(normalizedTotalAmount, amountPaid),
        status_validacao: fromValidationStatus(params.validationStatus),
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

  const parcelPayload = params.installmentAmounts.map((amount, index) => ({
    financeiro_id: financial.id,
    numero_parcela: index + 1,
    valor_parcela: Number(amount.toFixed(2)),
    status: 'pendente',
    vencimento: params.dueDates ? params.dueDates[index] ?? null : null,
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
    ? normalizeInstallmentCount(update.paymentMethod, update.installmentCount)
    : 1
  const amountPaid = Number((currentAmountPaid ?? update.amountPaid).toFixed(2))
  const { data: currentFinancial } = await supabase
    .from('financeiro')
    .select('status_validacao')
    .eq('participante_id', participantId)
    .maybeSingle()
  const generatedInstallments = createInstallments(update.totalAmount, installmentCount)
  const installmentsWithDueDates = generatedInstallments.map((installment, index) => ({
    ...installment,
    dueDate: update.installments[index]?.dueDate ?? installment.dueDate,
  }))
  const installments = syncInstallmentsAmountPaid(installmentsWithDueDates, amountPaid)

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

export async function getInstallmentBoletoData(installmentId: string) {
  const supabase = assertSupabase()
  const { data, error } = await supabase
    .from('financeiro_parcelas')
    .select(
      `
        id,
        numero_parcela,
        valor_parcela,
        status,
        vencimento,
        financeiro:financeiro_id (
          id,
          forma_pagamento,
          num_parcelas,
          participante:participante_id (
            id,
            nome,
            telefone,
            email,
            igreja,
            cidade
          )
        )
      `,
    )
    .eq('id', installmentId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Parcela não encontrada.')
  }

  const row = data as InstallmentBoletoRow
  const financial = Array.isArray(row.financeiro) ? row.financeiro[0] ?? null : row.financeiro
  const participant = Array.isArray(financial?.participante)
    ? financial?.participante[0] ?? null
    : financial?.participante ?? null

  if (!financial || !participant) {
    throw new Error('Dados financeiros da parcela não encontrados.')
  }

  return {
    installmentId: row.id,
    installmentNumber: row.numero_parcela,
    installmentAmount: Number(row.valor_parcela),
    installmentStatus: row.status === 'paga' ? 'Paga' : 'Pendente',
    dueDate: row.vencimento,
    paymentMethod: financial.forma_pagamento,
    totalInstallments: Math.max(1, Number(financial.num_parcelas || 1)),
    participantId: participant.id,
    participantName: participant.nome,
    participantPhone: participant.telefone,
    participantEmail: participant.email,
    participantChurch: participant.igreja,
    participantCity: participant.cidade,
  }
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
        birth_date,
        telefone,
        email,
        igreja,
        cidade,
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
  const ageAtEvent = calculateAgeOnDate(input.birthDate, EVENT_DATE)
  const { data, error } = await supabase
    .from('participantes')
    .insert({
      nome: input.fullName,
      idade: ageAtEvent,
      birth_date: input.birthDate,
      telefone: input.phone,
      email: input.email,
      igreja: input.church,
      cidade: input.city,
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
  const pricing = computeRegistrationPricing({
    birthDateIso: input.birthDate,
    paymentMethod: input.paymentMethod,
    installmentCount: input.installmentCount,
    baseFee: retreatFee,
  })
  const { data, error } = await supabase
    .from('participantes')
    .insert({
      nome: input.fullName,
      idade: pricing.ageAtEvent,
      birth_date: input.birthDate,
      telefone: input.phone,
      email: input.email,
      igreja: input.church,
      cidade: input.city,
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

  await persistFinancialRecordFromPlan({
    participantId: data.id,
    paymentMethod: pricing.paymentMethod,
    validationStatus: 'PendenteDeValidacao',
    totalAmount: pricing.totalAmount,
    installmentAmounts: pricing.installmentAmounts,
    dueDates: pricing.dueDates,
  })

  return {
    participantId: data.id,
    paymentMethod: pricing.paymentMethod,
    installmentCount: pricing.installmentCount,
    totalAmount: pricing.totalAmount,
    installmentAmounts: pricing.installmentAmounts,
    dueDates: pricing.dueDates,
    cardInstallmentLabel: pricing.cardInstallmentLabel,
    ageAtEvent: pricing.ageAtEvent,
  } satisfies PublicRegistrationSuccessSummary
}

export async function updateParticipantRecord(
  participantId: string,
  input: ParticipantInput,
  currentAmountPaid: number,
) {
  const supabase = assertSupabase()
  const ageAtEvent = calculateAgeOnDate(input.birthDate, EVENT_DATE)
  const { error } = await supabase
    .from('participantes')
    .update({
      nome: input.fullName,
      idade: ageAtEvent,
      birth_date: input.birthDate,
      telefone: input.phone,
      email: input.email,
      igreja: input.church,
      cidade: input.city,
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

export async function deleteParticipantRecord(participantId: string) {
  const supabase = assertSupabase()
  const { data: financialRows, error: financialSelectError } = await supabase
    .from('financeiro')
    .select('id')
    .eq('participante_id', participantId)

  if (financialSelectError) {
    throw financialSelectError
  }

  const financialIds = (financialRows ?? []).map((row) => row.id)

  if (financialIds.length > 0) {
    const { error: installmentsDeleteError } = await supabase
      .from('financeiro_parcelas')
      .delete()
      .in('financeiro_id', financialIds)

    if (installmentsDeleteError) {
      throw installmentsDeleteError
    }
  }

  const { error: financialDeleteError } = await supabase
    .from('financeiro')
    .delete()
    .eq('participante_id', participantId)

  if (financialDeleteError) {
    throw financialDeleteError
  }

  const { error: participantDeleteError } = await supabase
    .from('participantes')
    .delete()
    .eq('id', participantId)

  if (participantDeleteError) {
    throw participantDeleteError
  }
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

export async function updateLogisticsTaskRecord(taskId: string, task: LogisticsTaskInput) {
  const supabase = assertSupabase()
  const { error } = await supabase
    .from('checklist_organizacao')
    .update({
      categoria: task.category === 'Compras' ? 'compras' : 'contratos',
      tarefa: task.title,
      responsavel: task.owner,
      valor_estimado: task.estimatedCost,
      valor_gasto: task.actualCost,
      status: fromTaskStatus(task.status),
      observacoes: task.notes,
    })
    .eq('id', taskId)

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

export async function deleteLogisticsTaskRecord(taskId: string) {
  const supabase = assertSupabase()
  const { error } = await supabase.from('checklist_organizacao').delete().eq('id', taskId)

  if (error) {
    throw error
  }
}
