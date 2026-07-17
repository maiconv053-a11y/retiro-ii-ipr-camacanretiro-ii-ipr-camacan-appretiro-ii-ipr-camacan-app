import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  computeDueDates,
  PREFERRED_PAYMENT_DAY_OPTIONS,
} from '../shared/utils/registrationPricing'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

type InstallmentRow = {
  id: string
  numero_parcela: number
  status: string
  vencimento: string | null
}

type FinancialRow = {
  id: string
  num_parcelas: number
  parcelas_pagas: number
  forma_pagamento: string
  participante:
    | {
        id: string
        nome: string
      }
    | {
        id: string
        nome: string
      }[]
    | null
  financeiro_parcelas: InstallmentRow[] | null
}

function getDayFromIso(dateIso: string) {
  return Number(dateIso.slice(8, 10))
}

function inferPreferredPaymentDay(dueDates: string[]) {
  const optionSet = new Set<number>(PREFERRED_PAYMENT_DAY_OPTIONS)
  const candidate = dueDates
    .map(getDayFromIso)
    .find((day) => optionSet.has(day))

  return candidate ?? getDayFromIso(dueDates[0]!)
}

function normalizeParticipant(
  participant: FinancialRow['participante'],
): { id: string; nome: string } | null {
  if (!participant) {
    return null
  }

  return Array.isArray(participant) ? participant[0] ?? null : participant
}

async function main() {
  const { data, error } = await supabase
    .from('financeiro')
    .select(
      `
        id,
        num_parcelas,
        parcelas_pagas,
        forma_pagamento,
        participante:participante_id (
          id,
          nome
        ),
        financeiro_parcelas (
          id,
          numero_parcela,
          status,
          vencimento
        )
      `,
    )
    .eq('forma_pagamento', 'boleto')
    .lt('num_parcelas', 7)

  if (error) {
    throw error
  }

  const financialRows = ((data as FinancialRow[] | null) ?? []).filter(
    (row) => Number(row.parcelas_pagas || 0) === 0,
  )

  const updates: Array<{
    participantName: string
    before: string[]
    after: string[]
  }> = []

  for (const financial of financialRows) {
    const participant = normalizeParticipant(financial.participante)
    const installments = (financial.financeiro_parcelas ?? [])
      .filter((item) => item.vencimento)
      .sort((a, b) => a.numero_parcela - b.numero_parcela)

    if (!participant || installments.length === 0) {
      continue
    }

    const currentDueDates = installments.map((item) => item.vencimento!).filter(Boolean)
    const startMonth = currentDueDates[0]!.slice(0, 7)
    const preferredPaymentDay = inferPreferredPaymentDay(currentDueDates)
    const referenceNow = new Date(`${currentDueDates[0]}T00:00:00Z`)
    const recalculatedDueDates = computeDueDates(
      referenceNow,
      financial.num_parcelas,
      preferredPaymentDay,
      startMonth,
    )

    if (JSON.stringify(currentDueDates) === JSON.stringify(recalculatedDueDates)) {
      continue
    }

    for (const installment of installments) {
      const nextDueDate = recalculatedDueDates[installment.numero_parcela - 1]

      if (!nextDueDate) {
        continue
      }

      const { error: updateError } = await supabase
        .from('financeiro_parcelas')
        .update({ vencimento: nextDueDate })
        .eq('id', installment.id)

      if (updateError) {
        throw updateError
      }
    }

    updates.push({
      participantName: participant.nome,
      before: currentDueDates,
      after: recalculatedDueDates,
    })
  }

  console.log(JSON.stringify({ updatedCount: updates.length, updates }, null, 2))
}

main().catch((error) => {
  console.error('FIX_EXISTING_BOLETO_DUE_DATES_FAILED', error)
  process.exit(1)
})

