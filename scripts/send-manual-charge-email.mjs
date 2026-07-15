import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return null
  }
  return process.argv[index + 1] ?? null
}

const participantName = getArgValue('--name')
const installmentNumberArg = getArgValue('--installment')

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
}

if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
  throw new Error('Defina RESEND_API_KEY e RESEND_FROM_EMAIL.')
}

if (!participantName) {
  throw new Error('Informe --name "Nome do participante".')
}

const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL ||
  'https://retiro-ii-ipr-camacanretiro-ii-ipr.vercel.app'
const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  'https://raw.githubusercontent.com/maiconv053-a11y/retiro-ii-ipr-camacanretiro-ii-ipr-camacan-appretiro-ii-ipr-camacan-app/main/public/logo-retiro.png'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const resend = new Resend(RESEND_API_KEY)

function formatDatePtBr(dateIso) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateIso}T00:00:00Z`))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function formatPaymentMethod(method) {
  switch (method) {
    case 'boleto':
      return 'Boleto'
    case 'pix':
      return 'PIX'
    case 'dinheiro':
      return 'Dinheiro'
    default:
      return method
  }
}

function buildEmailSubject(context) {
  return `Cobranca da parcela ${context.installmentNumber} - Retiro II IPR de Camacan`
}

function buildEmailText(context) {
  return [
    `Olá, ${context.participantName}!`,
    '',
    `Passando para lembrar que a parcela nº ${context.installmentNumber} do Retiro da II IPR de Camacan vence em ${context.dueDateLabel}.`,
    `Valor: ${formatCurrency(context.installmentAmount)}`,
    `Forma de acerto: ${context.paymentMethodLabel}`,
    '',
    'Para garantir sua vaga e nos ajudar na organização do retiro, realize o pagamento com a diretoria ou envie o comprovante em resposta a esta mensagem.',
    '',
    'Deus abençoe!',
  ].join('\n')
}

function buildEmailHtml(context) {
  return `
    <div style="margin:0;padding:24px 12px;background:#07110d;font-family:Arial,Helvetica,sans-serif;color:#e8f5ef;">
      <div style="max-width:620px;margin:0 auto;background:#0d1713;border:1px solid #1f3b31;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 24px 12px;text-align:center;background:#10211a;">
          <img src="${EMAIL_LOGO_URL}" alt="Logo do Retiro da II IPR de Camacan" width="88" style="display:block;width:88px;height:auto;margin:0 auto 14px;" />
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8fd3b5;">Cobranca de parcela</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;color:#ffffff;">Sua parcela esta em aberto</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#d7e9e0;">
            Olá, <strong>${context.participantName}</strong>! A sua parcela <strong>nº ${context.installmentNumber}</strong> vence em <strong>${context.dueDateLabel}</strong>.
          </p>
          <div style="margin:0 0 16px;padding:16px;border:1px solid #24483b;border-radius:16px;background:#0b1410;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#d7e9e0;"><strong>Valor:</strong> ${formatCurrency(context.installmentAmount)}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#d7e9e0;"><strong>Forma de acerto:</strong> ${context.paymentMethodLabel}</p>
          </div>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#d7e9e0;">
            Para garantir sua vaga e nos ajudar na organização do retiro, realize o pagamento com a diretoria ou envie o comprovante em resposta a esta mensagem.
          </p>
          <div style="text-align:center;">
            <a href="${PUBLIC_SITE_URL}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#39a86c;color:#07110d;font-size:14px;font-weight:700;text-decoration:none;">Abrir sistema do retiro</a>
          </div>
        </div>
        <div style="padding:0 24px 22px;text-align:center;font-size:12px;line-height:1.6;color:#8faf9f;">
          Retiro da II IPR de Camacan<br />Deus abençoe!
        </div>
      </div>
    </div>
  `
}

async function loadInstallmentContext() {
  const { data, error } = await supabase
    .from('financeiro_parcelas')
    .select(`
      id,
      numero_parcela,
      valor_parcela,
      status,
      vencimento,
      financeiro:financeiro_id (
        id,
        forma_pagamento,
        participante:participante_id (
          id,
          nome,
          email
        )
      )
    `)
    .eq('status', 'pendente')
    .order('vencimento', { ascending: true })

  if (error) {
    throw error
  }

  const normalized = (data || [])
    .map((row) => {
      const financeiro = Array.isArray(row.financeiro) ? row.financeiro[0] : row.financeiro
      const participante = Array.isArray(financeiro?.participante)
        ? financeiro.participante[0]
        : financeiro?.participante

      return {
        installmentId: row.id,
        installmentNumber: row.numero_parcela,
        installmentAmount: Number(row.valor_parcela),
        dueDateIso: row.vencimento,
        dueDateLabel: formatDatePtBr(row.vencimento),
        paymentMethodLabel: formatPaymentMethod(financeiro?.forma_pagamento),
        participantId: participante?.id ?? null,
        participantName: participante?.nome ?? null,
        participantEmail: participante?.email ?? null,
      }
    })
    .filter((row) => String(row.participantName || '').toLowerCase().includes(participantName.toLowerCase()))

  const chosen = installmentNumberArg
    ? normalized.find((row) => String(row.installmentNumber) === String(installmentNumberArg))
    : normalized[0]

  if (!chosen) {
    throw new Error('Nenhuma parcela pendente encontrada para o participante informado.')
  }

  return chosen
}

async function main() {
  const context = await loadInstallmentContext()
  const response = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [context.participantEmail],
    subject: buildEmailSubject(context),
    text: buildEmailText(context),
    html: buildEmailHtml(context),
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }

  console.log(
    JSON.stringify(
      {
        sent: true,
        participant: context.participantName,
        email: context.participantEmail,
        installment: context.installmentNumber,
        dueDate: context.dueDateIso,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('SEND_MANUAL_CHARGE_EMAIL_FAILED', error)
  process.exit(1)
})
