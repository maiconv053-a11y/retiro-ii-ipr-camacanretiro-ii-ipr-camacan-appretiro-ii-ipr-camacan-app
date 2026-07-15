import { Resend } from 'resend'
import type { PaymentMethod } from '../../shared/types/retreat.js'

const DEFAULT_PUBLIC_SITE_URL = 'https://retiro-ii-ipr-camacanretiro-ii-ipr.vercel.app'
const DEFAULT_LOGO_URL =
  'https://raw.githubusercontent.com/maiconv053-a11y/retiro-ii-ipr-camacanretiro-ii-ipr-camacan-appretiro-ii-ipr-camacan-app/main/public/logo-retiro.png'

type RegistrationConfirmationEmailInput = {
  fullName: string
  email: string
  paymentMethod: PaymentMethod
  totalAmount: number
  installmentCount: number
  installmentAmounts: number[]
  dueDates: string[] | null
  cardInstallmentLabel: string | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function formatDatePtBr(dateIso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateIso}T00:00:00Z`))
}

function formatPaymentMethodLabel(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case 'Boleto':
      return 'Boleto'
    case 'Dinheiro':
      return 'Dinheiro'
    case 'CartaoCredito':
      return 'Cartão de crédito'
    case 'PIX':
    default:
      return 'PIX'
  }
}

function buildInstallmentsLabel(input: RegistrationConfirmationEmailInput) {
  if (input.paymentMethod === 'CartaoCredito' && input.cardInstallmentLabel) {
    return input.cardInstallmentLabel
  }

  if (input.installmentCount <= 1) {
    return `1x de ${formatCurrency(input.installmentAmounts[0] ?? input.totalAmount)}`
  }

  return `${input.installmentCount}x de ${formatCurrency(
    input.installmentAmounts[0] ?? input.totalAmount,
  )}`
}

function buildInstallmentLines(input: RegistrationConfirmationEmailInput) {
  if (!input.dueDates?.length) {
    return ''
  }

  return input.installmentAmounts
    .map((amount, index) => {
      const dueDate = input.dueDates?.[index]
      const dueDateLabel = dueDate ? formatDatePtBr(dueDate) : 'A combinar'
      return `<li style="margin:0 0 8px;color:#425d51;">Parcela ${index + 1}: ${formatCurrency(amount)} - vencimento ${dueDateLabel}</li>`
    })
    .join('')
}

function buildEmailText(input: RegistrationConfirmationEmailInput) {
  const installmentLines =
    input.dueDates?.length && input.paymentMethod !== 'CartaoCredito'
      ? [
          '',
          'Parcelas previstas:',
          ...input.installmentAmounts.map((amount, index) => {
            const dueDate = input.dueDates?.[index]
            const dueDateLabel = dueDate ? formatDatePtBr(dueDate) : 'A combinar'
            return `- Parcela ${index + 1}: ${formatCurrency(amount)} - vencimento ${dueDateLabel}`
          }),
        ]
      : []

  return [
    `Olá, ${input.fullName}!`,
    '',
    'Sua inscrição no Retiro da II IPR de Camacan foi concluída com sucesso.',
    'Recebemos seus dados e ficamos muito felizes em ter você conosco nesse tempo especial.',
    '',
    'Resumo da sua inscrição:',
    `- Forma de pagamento: ${formatPaymentMethodLabel(input.paymentMethod)}`,
    `- Valor total: ${formatCurrency(input.totalAmount)}`,
    `- Plano de pagamento: ${buildInstallmentsLabel(input)}`,
    ...installmentLines,
    '',
    'O valor do retiro inclui hospedagem, alimentação (café da manhã, almoço e janta) e transporte.',
    'Guarde este e-mail para consulta e, se precisar de ajuda, responda esta mensagem.',
    '',
    'Que Deus abençoe essa caminhada. Nos vemos no retiro!',
  ].join('\n')
}

function buildEmailHtml(input: RegistrationConfirmationEmailInput) {
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL
  const logoUrl = process.env.EMAIL_LOGO_URL || DEFAULT_LOGO_URL
  const paymentMethodLabel = formatPaymentMethodLabel(input.paymentMethod)
  const installmentsLabel = buildInstallmentsLabel(input)
  const firstDueDate = input.dueDates?.[0]
  const installmentList =
    input.dueDates?.length && input.paymentMethod !== 'CartaoCredito'
      ? `
          <div style="margin:18px 0 0;padding:16px;border:1px solid #b7d0bf;border-radius:16px;background:#f7fbf8;">
            <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#567262;">Parcelas previstas</p>
            <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;">
              ${buildInstallmentLines(input)}
            </ul>
          </div>
        `
      : ''
  const firstDueDateLine =
    firstDueDate && input.paymentMethod !== 'CartaoCredito'
      ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#425d51;"><strong>Primeiro vencimento:</strong> ${formatDatePtBr(firstDueDate)}</p>`
      : ''

  return `
    <div style="margin:0;padding:24px 12px;background:#edf4ee;font-family:Arial,Helvetica,sans-serif;color:#274035;">
      <div style="max-width:620px;margin:0 auto;background:#eef5ef;border:1px solid #b7d0bf;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 24px 12px;text-align:center;background:#d6e8dc;">
          <img src="${logoUrl}" alt="Logo do Retiro da II IPR de Camacan" width="88" style="display:block;width:88px;height:auto;margin:0 auto 14px;" />
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#5f8a73;">Inscrição concluída</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;color:#20352a;">Seja bem-vindo ao Retiro</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#425d51;">
            Olá, <strong>${input.fullName}</strong>! Sua inscrição no <strong>Retiro da II IPR de Camacan</strong> foi concluída com sucesso.
          </p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#425d51;">
            Recebemos seus dados e estamos felizes por ter você conosco. Guarde esta mensagem, pois ela resume as principais informações da sua inscrição.
          </p>
          <div style="margin:0 0 16px;padding:16px;border:1px solid #a8c5b3;border-radius:16px;background:#f7fbf8;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#425d51;"><strong>Forma de pagamento:</strong> ${paymentMethodLabel}</p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#425d51;"><strong>Valor total:</strong> ${formatCurrency(input.totalAmount)}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#425d51;"><strong>Plano de pagamento:</strong> ${installmentsLabel}</p>
            ${firstDueDateLine}
          </div>
          ${installmentList}
          <div style="margin:18px 0 0;padding:16px;border:1px solid #a8c5b3;border-radius:16px;background:#dcebe1;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#567262;">O que está incluso</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#2f4f3f;">
              Hospedagem, alimentação (café da manhã, almoço e janta) e transporte.
            </p>
          </div>
          <p style="margin:18px 0 18px;font-size:14px;line-height:1.7;color:#425d51;">
            Se precisar de ajuda, tiver dúvidas sobre pagamento ou quiser confirmar algum dado, basta responder este e-mail.
          </p>
          <div style="text-align:center;">
            <a href="${publicSiteUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#4a8b63;color:#f7fbf8;font-size:14px;font-weight:700;text-decoration:none;">Abrir sistema do retiro</a>
          </div>
        </div>
        <div style="padding:0 24px 22px;text-align:center;font-size:12px;line-height:1.6;color:#6d8277;">
          Retiro da II IPR de Camacan<br />Que Deus abençoe sua caminhada. Nos vemos no retiro!
        </div>
      </div>
    </div>
  `
}

export async function sendPublicRegistrationConfirmationEmail(
  input: RegistrationConfirmationEmailInput,
) {
  if (!input.email?.trim()) {
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL

  if (!resendApiKey || !resendFromEmail) {
    console.warn('WELCOME_EMAIL_SKIPPED', 'RESEND_API_KEY ou RESEND_FROM_EMAIL não definidos.')
    return
  }

  const resend = new Resend(resendApiKey)
  const response = await resend.emails.send({
    from: resendFromEmail,
    to: [input.email],
    subject: 'Inscrição concluída - Retiro II IPR de Camacan',
    text: buildEmailText(input),
    html: buildEmailHtml(input),
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }
}
