import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { sendPublicRegistrationConfirmationEmail } from '../server/lib/registrationConfirmationEmail.js'
import type { PaymentMethod } from '../shared/types/retreat.js'

type ParticipantRow = {
  nome: string
  email: string | null
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

function getArg(flag: string) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
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

async function main() {
  const name = getArg('--name')

  if (!name) {
    throw new Error('Use --name "Nome do participante".')
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Defina RESEND_API_KEY e RESEND_FROM_EMAIL.')
  }

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
        nome,
        email,
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
    .eq('nome', name)
    .single()

  if (error) {
    throw error
  }

  if (!data.email?.trim()) {
    throw new Error('Participante sem e-mail cadastrado.')
  }

  const financial = Array.isArray(data.financeiro) ? data.financeiro[0] ?? null : data.financeiro
  if (!financial) {
    throw new Error('Participante sem registro financeiro.')
  }

  const installments = (financial.financeiro_parcelas ?? [])
    .slice()
    .sort((a, b) => a.numero_parcela - b.numero_parcela)

  await sendPublicRegistrationConfirmationEmail({
    fullName: data.nome,
    email: data.email,
    paymentMethod: toPaymentMethod(financial.forma_pagamento),
    totalAmount: Number(financial.valor_total ?? 0),
    installmentCount: Math.max(1, Number(financial.num_parcelas ?? (installments.length || 1))),
    installmentAmounts: installments.length
      ? installments.map((item) => Number(item.valor_parcela ?? 0))
      : [Number(financial.valor_total ?? 0)],
    dueDates: installments.length
      ? installments.map((item) => item.vencimento).filter((value): value is string => Boolean(value))
      : null,
    cardInstallmentLabel: null,
  })

  console.log(
    JSON.stringify(
      {
        sent: true,
        participant: data.nome,
        email: data.email,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('SEND_WELCOME_EMAIL_TO_PARTICIPANT_FAILED', error)
  process.exit(1)
})
