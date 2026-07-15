import { Resend } from 'resend'
import {
  buildInstallmentBoletoUrl,
  createInstallmentBoletoAttachment,
} from '../../scripts/lib/boletoChargeEmail.mjs'

const DEFAULT_PUBLIC_SITE_URL = 'https://retiro-ii-ipr-camacanretiro-ii-ipr.vercel.app'
const DEFAULT_LOGO_URL =
  'https://raw.githubusercontent.com/maiconv053-a11y/retiro-ii-ipr-camacanretiro-ii-ipr-camacan-appretiro-ii-ipr-camacan-app/main/public/logo-retiro.png'

type ManualChargeEmailContext = {
  installmentId: string
  installmentNumber: number
  installmentAmount: number
  installmentStatus: 'Paga' | 'Pendente'
  dueDateIso: string | null
  paymentMethod: string | null
  totalInstallments: number
  participantName: string
  participantEmail: string
  participantPhone: string | null
  participantChurch: string | null
  participantCity: string | null
}

function formatDatePtBr(dateIso: string | null) {
  if (!dateIso) {
    return 'A definir'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateIso}T00:00:00Z`))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function formatPaymentMethod(value: string | null) {
  switch (value) {
    case 'boleto':
      return 'Boleto'
    case 'pix':
      return 'PIX'
    case 'dinheiro':
      return 'Dinheiro'
    case 'cartao':
      return 'Cartão de crédito'
    default:
      return value || 'Pagamento'
  }
}

function buildEmailSubject(context: ManualChargeEmailContext) {
  return `Cobranca da parcela ${context.installmentNumber} - Retiro II IPR de Camacan`
}

function buildEmailText(
  context: ManualChargeEmailContext,
  boletoUrl: string | null,
) {
  const boletoLine =
    boletoUrl && context.paymentMethod === 'boleto'
      ? ['', `Abrir boleto: ${boletoUrl}`]
      : []

  return [
    `Olá, ${context.participantName}!`,
    '',
    `Passando para lembrar que a parcela nº ${context.installmentNumber} do Retiro da II IPR de Camacan vence em ${formatDatePtBr(context.dueDateIso)}.`,
    `Valor: ${formatCurrency(context.installmentAmount)}`,
    `Forma de acerto: ${formatPaymentMethod(context.paymentMethod)}`,
    ...boletoLine,
    '',
    'Para garantir sua vaga e nos ajudar na organização do retiro, realize o pagamento com a diretoria ou envie o comprovante em resposta a esta mensagem.',
    '',
    'Deus abençoe!',
  ].join('\n')
}

function buildEmailHtml(
  context: ManualChargeEmailContext,
  boletoUrl: string | null,
) {
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL
  const logoUrl = process.env.EMAIL_LOGO_URL || DEFAULT_LOGO_URL
  const buttonLabel =
    boletoUrl && context.paymentMethod === 'boleto'
      ? 'Abrir boleto'
      : 'Abrir sistema do retiro'
  const buttonHref =
    boletoUrl && context.paymentMethod === 'boleto' ? boletoUrl : publicSiteUrl
  const boletoHint =
    boletoUrl && context.paymentMethod === 'boleto'
      ? `
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4f685c;">
            O boleto desta parcela segue anexado neste e-mail. Se preferir, use o botão abaixo para abrir o arquivo diretamente.
          </p>
        `
      : ''

  return `
    <div style="margin:0;padding:24px 12px;background:#edf4ee;font-family:Arial,Helvetica,sans-serif;color:#274035;">
      <div style="max-width:620px;margin:0 auto;background:#eef5ef;border:1px solid #b7d0bf;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 24px 12px;text-align:center;background:#d6e8dc;">
          <img src="${logoUrl}" alt="Logo do Retiro da II IPR de Camacan" width="88" style="display:block;width:88px;height:auto;margin:0 auto 14px;" />
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7ba08a;">Cobranca de parcela</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;color:#2d4338;">Sua parcela esta em aberto</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#4f685c;">
            Olá, <strong>${context.participantName}</strong>! A sua parcela <strong>nº ${context.installmentNumber}</strong> vence em <strong>${formatDatePtBr(context.dueDateIso)}</strong>.
          </p>
          <div style="margin:0 0 16px;padding:16px;border:1px solid #a8c5b3;border-radius:16px;background:#f7fbf8;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4f685c;"><strong>Valor:</strong> ${formatCurrency(context.installmentAmount)}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#4f685c;"><strong>Forma de acerto:</strong> ${formatPaymentMethod(context.paymentMethod)}</p>
          </div>
          ${boletoHint}
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4f685c;">
            Para garantir sua vaga e nos ajudar na organização do retiro, realize o pagamento com a diretoria ou envie o comprovante em resposta a esta mensagem.
          </p>
          <div style="text-align:center;">
            <a href="${buttonHref}" style="display:inline-block;padding:12px 20px;border:1px solid #9fc1ac;border-radius:999px;background:#cfe3d6;color:#2d4338;font-size:14px;font-weight:700;text-decoration:none;">${buttonLabel}</a>
          </div>
        </div>
        <div style="padding:0 24px 22px;text-align:center;font-size:12px;line-height:1.6;color:#6d8277;">
          Retiro da II IPR de Camacan<br />Deus abençoe!
        </div>
      </div>
    </div>
  `
}

export async function sendParticipantManualChargeEmail(
  context: ManualChargeEmailContext,
) {
  if (!context.participantEmail?.trim()) {
    throw new Error('Participante sem e-mail cadastrado.')
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL

  if (!resendApiKey || !resendFromEmail) {
    throw new Error('RESEND_API_KEY ou RESEND_FROM_EMAIL não definidos.')
  }

  const boletoUrl =
    context.paymentMethod === 'boleto'
      ? buildInstallmentBoletoUrl(context.installmentId)
      : null

  const attachment =
    context.paymentMethod === 'boleto'
      ? await createInstallmentBoletoAttachment({
          ...context,
          boletoUrl,
        })
      : null

  const resend = new Resend(resendApiKey)
  const response = await resend.emails.send({
    from: resendFromEmail,
    to: [context.participantEmail],
    subject: buildEmailSubject(context),
    text: buildEmailText(context, boletoUrl),
    html: buildEmailHtml(context, boletoUrl),
    attachments: attachment ? [attachment] : undefined,
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }

  return {
    sent: true,
    email: context.participantEmail,
    installmentId: context.installmentId,
    installmentNumber: context.installmentNumber,
  }
}
