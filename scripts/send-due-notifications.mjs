import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  REMINDER_TIMEZONE = 'America/Bahia',
  EVOLUTION_API_URL,
  EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  WHATSAPP_ENABLED = 'true',
  EMAIL_ENABLED = 'true',
  DRY_RUN = 'true',
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
}

const ENABLE_WHATSAPP = WHATSAPP_ENABLED === 'true'
const ENABLE_EMAIL = EMAIL_ENABLED === 'true'
const IS_DRY_RUN = DRY_RUN === 'true'

const SUPPORTED_PAYMENT_METHODS = new Set(['boleto', 'pix', 'dinheiro'])

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
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

const EMAIL_LOGO_SRC = await loadEmailLogoSrc()

function getTodayIsoInTimezone(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

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

function normalizeWhatsappPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')

  if (!digits) {
    return null
  }

  if (digits.startsWith('55')) {
    return digits
  }

  return `55${digits}`
}

function buildReminderContext(item, referenceDate) {
  return {
    referenceDate,
    participantId: item.participant.id,
    participantName: item.participant.nome,
    participantPhone: item.participant.telefone,
    participantEmail: item.participant.email,
    participantChurch: item.participant.igreja || '',
    participantCity: item.participant.cidade || '',
    installmentId: item.installment.id,
    installmentNumber: item.installment.numero_parcela,
    installmentAmount: Number(item.installment.valor_parcela),
    dueDateIso: item.installment.vencimento,
    dueDateLabel: formatDatePtBr(item.installment.vencimento),
    paymentMethod: item.financial.forma_pagamento,
    paymentMethodLabel: formatPaymentMethod(item.financial.forma_pagamento),
  }
}

function buildWhatsappMessage(context) {
  return [
    `Olá, ${context.participantName}! 🛰️`,
    '',
    `Passando para lembrar que hoje (${context.dueDateLabel}) vence a sua parcela nº ${context.installmentNumber} do Retiro da II IPR de Camacan.`,
    `Valor: ${formatCurrency(context.installmentAmount)}`,
    `Forma de acerto: ${context.paymentMethodLabel}`,
    '',
    'Para garantir sua vaga e nos ajudar na organização da pousada, realize o pagamento com a diretoria ou envie o comprovante por aqui.',
    'Deus abençoe! 🙏',
  ].join('\n')
}

function buildEmailSubject(context) {
  return `Lembrete de vencimento da parcela ${context.installmentNumber} - Retiro II IPR de Camacan`
}

function buildEmailText(context) {
  return [
    `Olá, ${context.participantName}! 🛰️`,
    '',
    `Passando para lembrar que hoje (${context.dueDateLabel}) vence a sua parcela nº ${context.installmentNumber} do Retiro da II IPR de Camacan.`,
    `Valor: ${formatCurrency(context.installmentAmount)}`,
    `Forma de acerto: ${context.paymentMethodLabel}`,
    '',
    'Para garantir sua vaga e nos ajudar na organização da pousada, realize o pagamento com a diretoria ou envie o comprovante em resposta a esta mensagem.',
    '',
    'Deus abençoe! 🙏',
  ].join('\n')
}

function buildEmailHtml(context) {
  return `
    <div style="margin:0; padding:32px 16px; background:#07110d;">
      <div style="max-width:680px; margin:0 auto; font-family:Arial, Helvetica, sans-serif; color:#e8f5ef;">
        <div style="margin-bottom:16px; text-align:center;">
          <span style="display:inline-block; padding:8px 14px; border:1px solid #1e3b31; border-radius:999px; background:#0d1b15; color:#8fd3b5; font-size:11px; letter-spacing:0.24em; text-transform:uppercase;">
            Lembrete de vencimento
          </span>
        </div>
        <div style="background:linear-gradient(180deg,#11241c 0%,#0a1511 100%); border:1px solid #1f3b31; border-radius:28px; overflow:hidden; box-shadow:0 18px 60px rgba(0,0,0,0.35);">
          <div style="padding:32px 28px 18px; background:radial-gradient(circle at top, rgba(71,166,122,0.18), transparent 55%); text-align:center;">
            ${EMAIL_LOGO_SRC ? `<img src="${EMAIL_LOGO_SRC}" alt="Logo do Retiro da II IPR de Camacan" style="display:block; width:120px; max-width:100%; margin:0 auto 18px;" />` : ''}
            <h1 style="margin:0; font-size:30px; line-height:1.2; color:#ffffff;">
              Sua parcela vence hoje
            </h1>
            <p style="margin:12px 0 0; font-size:15px; line-height:1.8; color:#cde6da;">
              Olá, <strong>${context.participantName}</strong>! Estamos passando para lembrar do seu compromisso com o
              <strong>Retiro da II IPR de Camacan</strong>.
            </p>
          </div>
          <div style="padding:0 28px 28px;">
            <div style="border:1px solid #24483b; border-radius:22px; background:#0c1713; padding:18px; margin-bottom:18px;">
              <div style="font-size:13px; line-height:1.8; color:#d7e9e0;">
                Hoje, <strong>${context.dueDateLabel}</strong>, vence a sua parcela
                <strong>nº ${context.installmentNumber}</strong>.
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
            Deus abençoe! 🙏
          </div>
        </div>
      </div>
    </div>
  `
}

async function fetchDueInstallments(referenceDate) {
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
    .eq('status', 'pendente')
    .eq('vencimento', referenceDate)

  if (error) {
    throw error
  }

  return (data || [])
    .map((row) => {
      const financial = Array.isArray(row.financeiro) ? row.financeiro[0] : row.financeiro
      const participant = financial?.participante
      const normalizedParticipant = Array.isArray(participant) ? participant[0] : participant

      if (!financial || !normalizedParticipant) {
        return null
      }

      if (!SUPPORTED_PAYMENT_METHODS.has(financial.forma_pagamento)) {
        return null
      }

      return {
        installment: row,
        financial,
        participant: normalizedParticipant,
      }
    })
    .filter(Boolean)
}

async function notificationAlreadySent({ installmentId, channel, referenceDate }) {
  const { data, error } = await supabase
    .from('cobranca_notificacoes')
    .select('id')
    .eq('parcela_id', installmentId)
    .eq('canal', channel)
    .eq('tipo', 'lembrete_vencimento')
    .eq('data_referencia', referenceDate)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return Boolean(data)
}

async function insertNotificationLog(payload) {
  const { error } = await supabase.from('cobranca_notificacoes').insert(payload)

  if (error && error.code !== '23505') {
    throw error
  }
}

async function sendWhatsappMessage({ phone, message }) {
  if (!ENABLE_WHATSAPP) {
    return {
      skipped: true,
      provider: 'evolution',
      reason: 'disabled',
    }
  }

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    throw new Error('Evolution API nao configurada.')
  }

  const normalizedPhone = normalizeWhatsappPhone(phone)

  if (!normalizedPhone) {
    throw new Error('Telefone invalido para WhatsApp.')
  }

  if (IS_DRY_RUN) {
    return {
      dryRun: true,
      provider: 'evolution',
      number: normalizedPhone,
    }
  }

  const response = await fetch(
    `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: normalizedPhone,
        text: message,
      }),
    },
  )

  const providerResponse = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Falha no WhatsApp: ${JSON.stringify(providerResponse)}`)
  }

  return providerResponse
}

async function sendEmailMessage({ to, subject, html, text }) {
  if (!ENABLE_EMAIL) {
    return {
      skipped: true,
      provider: 'resend',
      reason: 'disabled',
    }
  }

  if (!resend || !RESEND_FROM_EMAIL) {
    throw new Error('Resend nao configurado.')
  }

  if (IS_DRY_RUN) {
    return {
      dryRun: true,
      provider: 'resend',
      to,
    }
  }

  const response = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [to],
    subject,
    html,
    text,
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }

  return response
}

async function saveNotificationAttempt({
  context,
  channel,
  recipient,
  provider,
  status,
  content,
  providerResponse,
  errorMessage,
}) {
  await insertNotificationLog({
    parcela_id: context.installmentId,
    participante_id: context.participantId,
    tipo: 'lembrete_vencimento',
    canal: channel,
    data_referencia: context.referenceDate,
    destinatario: recipient,
    provider,
    status,
    conteudo: content,
    provider_response: providerResponse ?? null,
    erro: errorMessage ?? null,
  })
}

async function notifyDueInstallment(item, referenceDate) {
  const context = buildReminderContext(item, referenceDate)
  const whatsappMessage = buildWhatsappMessage(context)

  let delivered = false

  if (context.participantPhone) {
    const alreadySent = await notificationAlreadySent({
      installmentId: context.installmentId,
      channel: 'whatsapp',
      referenceDate,
    })

    if (!alreadySent) {
      try {
        const providerResponse = await sendWhatsappMessage({
          phone: context.participantPhone,
          message: whatsappMessage,
        })

        if (providerResponse?.skipped) {
          console.warn(`WhatsApp ignorado para ${context.participantName}: ${providerResponse.reason}`)
        } else {
          await saveNotificationAttempt({
            context,
            channel: 'whatsapp',
            recipient: normalizeWhatsappPhone(context.participantPhone) || context.participantPhone,
            provider: 'evolution',
            status: 'enviado',
            content: { message: whatsappMessage },
            providerResponse,
          })

          delivered = true
          console.log(`WhatsApp enviado para ${context.participantName}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        await saveNotificationAttempt({
          context,
          channel: 'whatsapp',
          recipient: context.participantPhone,
          provider: 'evolution',
          status: 'erro',
          content: { message: whatsappMessage },
          errorMessage,
        })

        console.error(`Erro ao enviar WhatsApp para ${context.participantName}: ${errorMessage}`)
      }
    }
  }

  if (!delivered && context.participantEmail) {
    const alreadySent = await notificationAlreadySent({
      installmentId: context.installmentId,
      channel: 'email',
      referenceDate,
    })

    if (!alreadySent) {
      const subject = buildEmailSubject(context)
      const text = buildEmailText(context)
      const html = buildEmailHtml(context)

      try {
        const providerResponse = await sendEmailMessage({
          to: context.participantEmail,
          subject,
          text,
          html,
        })

        if (providerResponse?.skipped) {
          console.warn(`E-mail ignorado para ${context.participantName}: ${providerResponse.reason}`)
        } else {
          await saveNotificationAttempt({
            context,
            channel: 'email',
            recipient: context.participantEmail,
            provider: 'resend',
            status: 'enviado',
            content: { subject, text },
            providerResponse,
          })

          delivered = true
          console.log(`E-mail enviado para ${context.participantName}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        await saveNotificationAttempt({
          context,
          channel: 'email',
          recipient: context.participantEmail,
          provider: 'resend',
          status: 'erro',
          content: { subject, text },
          errorMessage,
        })

        console.error(`Erro ao enviar e-mail para ${context.participantName}: ${errorMessage}`)
      }
    }
  }

  if (!delivered) {
    console.warn(`Nenhum envio efetivo realizado para ${context.participantName}`)
  }
}

async function main() {
  const referenceDate = getTodayIsoInTimezone(REMINDER_TIMEZONE)
  console.log(`Iniciando rotina de cobranca para ${referenceDate}`)

  const dueInstallments = await fetchDueInstallments(referenceDate)
  console.log(`Parcelas pendentes vencendo hoje: ${dueInstallments.length}`)

  for (const item of dueInstallments) {
    await notifyDueInstallment(item, referenceDate)
  }

  console.log('Rotina finalizada com sucesso.')
}

main().catch((error) => {
  console.error('Falha geral na rotina de cobranca:', error)
  process.exit(1)
})
