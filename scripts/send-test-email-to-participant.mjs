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
const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL ||
  'https://retiro-ii-ipr-camacanretiro-ii-ipr.vercel.app'
const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  'https://raw.githubusercontent.com/maiconv053-a11y/retiro-ii-ipr-camacanretiro-ii-ipr-camacan-appretiro-ii-ipr-camacan-app/main/public/logo-retiro.png'

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
    <div style="margin:0;padding:24px 12px;background:#edf4ee;font-family:Arial,Helvetica,sans-serif;color:#274035;">
      <div style="max-width:620px;margin:0 auto;background:#eef5ef;border:1px solid #b7d0bf;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 24px 12px;text-align:center;background:#d6e8dc;">
          <img src="${EMAIL_LOGO_URL}" alt="Logo do Retiro da II IPR de Camacan" width="88" style="display:block;width:88px;height:auto;margin:0 auto 14px;" />
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7ba08a;">Teste de entrega</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;color:#2d4338;">E-mail funcionando com sucesso</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#4f685c;">
            Olá, <strong>${recipient.name}</strong>! Este é um teste real do sistema de notificações por e-mail do <strong>Retiro II IPR de Camacan</strong>.
          </p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4f685c;">
            Se esta mensagem chegou corretamente, o domínio está validado, o Resend está operacional e o sistema está pronto para disparar e-mails reais.
          </p>
          <div style="text-align:center;">
            <a href="${PUBLIC_SITE_URL}" style="display:inline-block;padding:12px 20px;border:1px solid #9fc1ac;border-radius:999px;background:#cfe3d6;color:#2d4338;font-size:14px;font-weight:700;text-decoration:none;">Abrir sistema do retiro</a>
          </div>
        </div>
        <div style="padding:0 24px 22px;text-align:center;font-size:12px;line-height:1.6;color:#6d8277;">
          Retiro da II IPR de Camacan<br />Deus abençoe!
        </div>
      </div>
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
