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

const name = getArgValue('--name')
const toOverride = getArgValue('--to')

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

if (!name && !toOverride) {
  throw new Error('Informe --name "Nome do participante" ou --to "email@destino".')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const resend = new Resend(RESEND_API_KEY)

async function resolveRecipient() {
  if (toOverride) {
    return { name: name || 'Participante', email: toOverride }
  }

  const { data, error } = await supabase
    .from('participantes')
    .select('nome,email')
    .ilike('nome', `%${name}%`)
    .limit(5)

  if (error) {
    throw error
  }

  const participant = (data || []).find((row) => row?.email) || null
  if (!participant) {
    throw new Error('Participante não encontrado (ou sem e-mail cadastrado).')
  }

  return { name: participant.nome, email: participant.email }
}

async function main() {
  const recipient = await resolveRecipient()
  const subject = 'Teste de envio - Retiro II IPR de Camacan'
  const text = [
    `Olá, ${recipient.name}!`,
    '',
    'Este é um teste do sistema de notificações por e-mail (Resend) do Retiro II IPR de Camacan.',
    '',
    'Se você recebeu esta mensagem, o domínio está validado e o envio está funcionando.',
    '',
    'Deus abençoe!',
  ].join('\n')
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <p>Olá, <strong>${recipient.name}</strong>!</p>
      <p>Este é um teste do sistema de notificações por e-mail (Resend) do <strong>Retiro II IPR de Camacan</strong>.</p>
      <p>Se você recebeu esta mensagem, o domínio está validado e o envio está funcionando.</p>
      <p>Deus abençoe!</p>
    </div>
  `

  const response = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [recipient.email],
    subject,
    text,
    html,
  })

  if (response.error) {
    throw new Error(JSON.stringify(response.error))
  }

  console.log('EMAIL_SENT')
}

main().catch((error) => {
  console.error('SEND_TEST_EMAIL_FAILED', error)
  process.exit(1)
})
