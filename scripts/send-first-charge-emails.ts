import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'

type ParticipantRow = {
  nome: string
  email: string | null
  status_inscricao: string
  financeiro:
    | {
        financeiro_parcelas:
          | {
              numero_parcela: number
              status: string
            }[]
          | null
      }
    | {
        financeiro_parcelas:
          | {
              numero_parcela: number
              status: string
            }[]
          | null
      }[]
    | null
}

function hasFlag(flag: string) {
  return process.argv.includes(flag)
}

function extractSingleFinance(financial: ParticipantRow['financeiro']) {
  if (!financial) {
    return null
  }

  return Array.isArray(financial) ? financial[0] ?? null : financial
}

function runManualChargeEmail(name: string, installment: number, dryRun: boolean) {
  if (dryRun) {
    console.log(`CHARGE_EMAIL_DRY_RUN ${name} parcela ${installment}`)
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/send-manual-charge-email.mjs', '--name', name, '--installment', String(installment)],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('exit', (code) => {
      if (code === 0) {
        if (stdout.trim()) {
          console.log(stdout.trim())
        }
        resolve()
        return
      }

      reject(new Error(stderr.trim() || stdout.trim() || `Falha ao enviar para ${name}`))
    })
  })
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Defina RESEND_API_KEY e RESEND_FROM_EMAIL.')
  }

  const dryRun = hasFlag('--dry-run')
  const installmentNumber = 1

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
        status_inscricao,
        financeiro (
          financeiro_parcelas (
            numero_parcela,
            status
          )
        )
      `,
    )
    .neq('status_inscricao', 'cancelada')
    .not('email', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data as ParticipantRow[])
    .filter((row) => row.email?.trim())
    .filter((row) => {
      const financial = extractSingleFinance(row.financeiro)
      const firstInstallment = (financial?.financeiro_parcelas ?? []).find(
        (item) => Number(item.numero_parcela) === installmentNumber,
      )

      return firstInstallment?.status === 'pendente'
    })

  const summary = {
    total: rows.length,
    sent: 0,
    failed: 0,
  }

  for (const row of rows) {
    try {
      await runManualChargeEmail(row.nome, installmentNumber, dryRun)
      summary.sent += 1
      console.log(`CHARGE_EMAIL_OK ${row.nome} <${row.email}>`)
    } catch (sendError) {
      summary.failed += 1
      console.error(`CHARGE_EMAIL_FAILED ${row.nome} <${row.email}>`, sendError)
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('SEND_FIRST_CHARGE_EMAILS_FAILED', error)
  process.exit(1)
})
