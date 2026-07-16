import { Resend } from 'resend'
import type { PaymentMethod } from '../../shared/types/retreat.js'

type RegistrationAlertEmailInput = {
  participantName: string
  participantEmail: string
  participantPhone: string
  participantChurch: string
  participantCity: string
  paymentMethod: PaymentMethod
  totalAmount: number
  installmentCount: number
}

const ALERT_RECIPIENT_EMAIL = 'maiconv053@gmail.com'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
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

function buildText(input: RegistrationAlertEmailInput) {
  return [
    'Nova inscrição realizada no Retiro da II IPR de Camacan.',
    '',
    `Nome: ${input.participantName}`,
    `E-mail: ${input.participantEmail}`,
    `Telefone: ${input.participantPhone}`,
    `Igreja: ${input.participantChurch}`,
    `Cidade: ${input.participantCity}`,
    `Forma de pagamento: ${formatPaymentMethodLabel(input.paymentMethod)}`,
    `Valor total: ${formatCurrency(input.totalAmount)}`,
    `Parcelas: ${input.installmentCount}`,
  ].join('\n')
}

function buildHtml(input: RegistrationAlertEmailInput) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#20352a;background:#edf4ee;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #c7ded0;border-radius:16px;padding:20px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#6a957d;">
          Nova inscrição
        </p>
        <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#20352a;">
          Novo participante cadastrado
        </h1>
        <p style="margin:0 0 8px;"><strong>Nome:</strong> ${input.participantName}</p>
        <p style="margin:0 0 8px;"><strong>E-mail:</strong> ${input.participantEmail}</p>
        <p style="margin:0 0 8px;"><strong>Telefone:</strong> ${input.participantPhone}</p>
        <p style="margin:0 0 8px;"><strong>Igreja:</strong> ${input.participantChurch}</p>
        <p style="margin:0 0 8px;"><strong>Cidade:</strong> ${input.participantCity}</p>
        <p style="margin:0 0 8px;"><strong>Forma de pagamento:</strong> ${formatPaymentMethodLabel(input.paymentMethod)}</p>
        <p style="margin:0 0 8px;"><strong>Valor total:</strong> ${formatCurrency(input.totalAmount)}</p>
        <p style="margin:0;"><strong>Parcelas:</strong> ${input.installmentCount}</p>
      </div>
    </div>
  `
}

export async function sendRegistrationAlertEmail(input: RegistrationAlertEmailInput) {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL

  if (!resendApiKey || !resendFromEmail) {
    console.warn('REGISTRATION_ALERT_EMAIL_SKIPPED', 'RESEND_API_KEY ou RESEND_FROM_EMAIL não definidos.')
    return
  }

  const resend = new Resend(resendApiKey)
  const response = await resend.emails.send({
    from: resendFromEmail,
    to: [ALERT_RECIPIENT_EMAIL],
    subject: `Nova inscrição no retiro: ${input.participantName}`,
    text: buildText(input),
    html: buildHtml(input),
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }
}

