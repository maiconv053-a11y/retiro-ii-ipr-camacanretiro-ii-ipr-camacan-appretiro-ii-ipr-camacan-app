import 'dotenv/config'
import { readFile } from 'node:fs/promises'
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

async function loadEmailLogoSrc() {
  try {
    const fileUrl = new URL('../src/assets/logo-retiro.png', import.meta.url)
    const buffer = await readFile(fileUrl)
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

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

function buildEmailHtml(context, logoSrc) {
  return `
    <div style="margin:0; padding:32px 16px; background:#07110d;">
      <div style="max-width:680px; margin:0 auto; font-family:Arial, Helvetica, sans-serif; color:#e8f5ef;">
        <div style="margin-bottom:16px; text-align:center;">
          <span style="display:inline-block; padding:8px 14px; border:1px solid #1e3b31; border-radius:999px; background:#0d1b15; color:#8fd3b5; font-size:11px; letter-spacing:0.24em; text-transform:uppercase;">
            Cobranca de parcela
          </span>
        </div>
        <div style="background:linear-gradient(180deg,#11241c 0%,#0a1511 100%); border:1px solid #1f3b31; border-radius:28px; overflow:hidden; box-shadow:0 18px 60px rgba(0,0,0,0.35);">
          <div style="padding:32px 28px 18px; background:radial-gradient(circle at top, rgba(71,166,122,0.18), transparent 55%); text-align:center;">
            ${logoSrc ? `<img src="${logoSrc}" alt="Logo do Retiro da II IPR de Camacan" style="display:block; width:120px; max-width:100%; margin:0 auto 18px;" />` : ''}
            <h1 style="margin:0; font-size:30px; line-height:1.2; color:#ffffff;">
              Sua parcela esta em aberto
            </h1>
            <p style="margin:12px 0 0; font-size:15px; line-height:1.8; color:#cde6da;">
              Olá, <strong>${context.participantName}</strong>! Este e-mail foi enviado para lembrar da sua cobrança no
              <strong>Retiro da II IPR de Camacan</strong>.
            </p>
          </div>
          <div style="padding:0 28px 28px;">
            <div style="border:1px solid #24483b; border-radius:22px; background:#0c1713; padding:18px; margin-bottom:18px;">
              <div style="font-size:13px; line-height:1.8; color:#d7e9e0;">
                A sua parcela <strong>nº ${context.installmentNumber}</strong> vence em
                <strong>${context.dueDateLabel}</strong>.
              </div>
            </div>
            <div style="margin-bottom:18px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0 12px;">
                <tr>
                  <td style="width:50%; padding:16px 18px; border:1px solid #1f3b31; border-radius:18px; background:#0d1a15;">
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7fbf9d; margin-bottom:8px;">Valor</div>
                    <div style="font-size:24px; font-weight:700; color:#ffffff;">${formatCurrency(context.installmentAmount)}</div>
                  </td>
                  <td style="width:50%; padding:16px 18px; border:1px solid #1f3b31; border-radius:18px; background:#0d1a15;">
                    <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7fbf9d; margin-bottom:8px;">Forma de acerto</div>
                    <div style="font-size:24px; font-weight:700; color:#ffffff;">${context.paymentMethodLabel}</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="padding:18px; border-left:3px solid #4db57d; border-radius:0 16px 16px 0; background:#0f1d17; color:#d5e8de; font-size:14px; line-height:1.8;">
              Para garantir sua vaga e nos ajudar na organização do retiro, realize o pagamento com a diretoria
              ou envie o comprovante em resposta a esta mensagem.
            </div>
            <div style="margin-top:20px; text-align:center;">
              <a href="${PUBLIC_SITE_URL}" style="display:inline-block; padding:14px 24px; border-radius:999px; background:#39a86c; color:#07110d; font-size:14px; font-weight:700; text-decoration:none;">
                Abrir sistema do retiro
              </a>
            </div>
          </div>
          <div style="padding:18px 28px 28px; text-align:center; color:#8faf9f; font-size:12px; line-height:1.7;">
            Retiro da II IPR de Camacan<br />
            Deus abençoe!
          </div>
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
  const logoSrc = await loadEmailLogoSrc()
  const response = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [context.participantEmail],
    subject: buildEmailSubject(context),
    text: buildEmailText(context),
    html: buildEmailHtml(context, logoSrc),
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
