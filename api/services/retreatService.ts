import type {
  FinancialRecord,
  FinancialUpdate,
  Installment,
  LogisticsTask,
  LogisticsTaskInput,
  Participant,
  ParticipantInput,
  PaymentMethod,
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
        financeiro (
          id,
          participante_id,
          valor_total,
          valor_pago,
          forma_pagamento,
          num_parcelas,
          parcelas_pagas,
          status_geral,
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
