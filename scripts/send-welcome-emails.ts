import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { sendPublicRegistrationConfirmationEmail } from '../server/lib/registrationConfirmationEmail.js'
import type { PaymentMethod } from '../shared/types/retreat.js'

type ParticipantRow = {
  id: string
  nome: string
  email: string | null
  status_inscricao: string
  financeiro:
    | {
        valor_total: number
        forma_pagamento: string
        num_parcelas: number
        financeiro_parcelas:
          | {
              numero_parcela: number
              valor_parcela: number
              vencimento: string | null
            }[]
          | null
      }
    | {
        valor_total: number
        forma_pagamento: string
        num_parcelas: number
        financeiro_parcelas:
          | {
              numero_parcela: number
              valor_parcela: number
              vencimento: string | null
            }[]
          | null
      }[]
    | null
}

function hasFlag(flag: string) {
  return process.argv.includes(flag)
}

function toPaymentMethod(value: string | null | undefined): PaymentMethod {
  switch (value) {
    case 'boleto':
      return 'Boleto'
    case 'dinheiro':
      return 'Dinheiro'
    case 'cartao':
      return 'CartaoCredito'
    case 'pix':
    default:
      return 'PIX'
  }
}

function extractSingleFinance(row: ParticipantRow['financeiro']) {
  if (!row) {
    return null
  }

  return Array.isArray(row) ? row[0] ?? null : row
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Defina RESEND_API_KEY e RESEND_FROM_EMAIL.')
  }

  const dryRun = hasFlag('--dry-run')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase
    .from('participantes')
    .select(
      `
        id,
        nome,
        email,
        status_inscricao,
        financeiro (
          valor_total,
          forma_pagamento,
          num_parcelas,
          financeiro_parcelas (
            numero_parcela,
            valor_parcela,
            vencimento
          )
        )
      `,
    )
    .neq('status_inscricao', 'cancelada')
    .not('email', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data as ParticipantRow[]).filter((row) => row.email?.trim())
  const summary = {
    total: rows.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  }

  for (const row of rows) {
    const financial = extractSingleFinance(row.financeiro)

    if (!financial) {
      summary.skipped += 1
      console.log(`WELCOME_EMAIL_SKIPPED ${row.nome} - sem registro financeiro`)
      continue
    }

    const installments = (financial.financeiro_parcelas ?? [])
      .slice()
      .sort((a, b) => a.numero_parcela - b.numero_parcela)

    const payload = {
      fullName: row.nome,
      email: row.email ?? '',
      paymentMethod: toPaymentMethod(financial.forma_pagamento),
      totalAmount: Number(financial.valor_total ?? 0),
      installmentCount: Math.max(
        1,
        Number(financial.num_parcelas ?? (installments.length || 1)),
      ),
      installmentAmounts:
        installments.length > 0
          ? installments.map((item) => Number(item.valor_parcela ?? 0))
          : [Number(financial.valor_total ?? 0)],
      dueDates:
        installments.length > 0
          ? installments.map((item) => item.vencimento).filter((value): value is string => Boolean(value))
          : null,
      cardInstallmentLabel: null,
    }

    if (dryRun) {
      summary.sent += 1
      console.log(`WELCOME_EMAIL_DRY_RUN ${row.nome} <${row.email}>`)
      continue
    }

    try {
      await sendPublicRegistrationConfirmationEmail(payload)
      summary.sent += 1
      console.log(`WELCOME_EMAIL_SENT ${row.nome} <${row.email}>`)
    } catch (sendError) {
      summary.failed += 1
      console.error(`WELCOME_EMAIL_FAILED ${row.nome} <${row.email}>`, sendError)
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('SEND_WELCOME_EMAILS_FAILED', error)
  process.exit(1)
})
