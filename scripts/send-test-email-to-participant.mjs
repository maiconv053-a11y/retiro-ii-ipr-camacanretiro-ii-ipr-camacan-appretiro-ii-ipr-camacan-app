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

async function loadEmailLogoSrc() {
  try {
    const fileUrl = new URL('../src/assets/logo-retiro.png', import.meta.url)
    const buffer = await readFile(fileUrl)
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

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
  const logoSrc = await loadEmailLogoSrc()
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
    <div style="margin:0; padding:32px 16px; background:#07110d;">
      <div style="max-width:680px; margin:0 auto; font-family:Arial, Helvetica, sans-serif; color:#e8f5ef;">
        <div style="margin-bottom:16px; text-align:center;">
          <span style="display:inline-block; padding:8px 14px; border:1px solid #1e3b31; border-radius:999px; background:#0d1b15; color:#8fd3b5; font-size:11px; letter-spacing:0.24em; text-transform:uppercase;">
            Teste de entrega
          </span>
        </div>
        <div style="background:linear-gradient(180deg,#11241c 0%,#0a1511 100%); border:1px solid #1f3b31; border-radius:28px; overflow:hidden; box-shadow:0 18px 60px rgba(0,0,0,0.35);">
          <div style="padding:32px 28px 18px; background:radial-gradient(circle at top, rgba(71,166,122,0.18), transparent 55%); text-align:center;">
            ${logoSrc ? `<img src="${logoSrc}" alt="Logo do Retiro da II IPR de Camacan" style="display:block; width:120px; max-width:100%; margin:0 auto 18px;" />` : ''}
            <h1 style="margin:0; font-size:30px; line-height:1.2; color:#ffffff;">
              E-mail funcionando com sucesso
            </h1>
            <p style="margin:12px 0 0; font-size:15px; line-height:1.8; color:#cde6da;">
              Olá, <strong>${recipient.name}</strong>! Este é um teste real do sistema de notificações por e-mail do
              <strong>Retiro II IPR de Camacan</strong>.
            </p>
          </div>
          <div style="padding:0 28px 28px;">
            <div style="padding:18px; border:1px solid #24483b; border-radius:22px; background:#0c1713; color:#d7e9e0; font-size:14px; line-height:1.8;">
              Se esta mensagem chegou corretamente, o domínio está validado, o Resend está operacional e o sistema
              está pronto para disparar e-mails reais.
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
