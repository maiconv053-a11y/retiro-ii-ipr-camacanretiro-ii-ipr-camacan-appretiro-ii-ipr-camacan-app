import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function main() {
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
          email,
          telefone
        )
      )
    `)
    .order('vencimento', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data || [])
    .map((row) => {
      const financeiro = Array.isArray(row.financeiro) ? row.financeiro[0] : row.financeiro
      const participante = Array.isArray(financeiro?.participante)
        ? financeiro.participante[0]
        : financeiro?.participante

      return {
        id: row.id,
        numero_parcela: row.numero_parcela,
        valor_parcela: row.valor_parcela,
        status: row.status,
        vencimento: row.vencimento,
        forma_pagamento: financeiro?.forma_pagamento ?? null,
        participante: participante?.nome ?? null,
        email: participante?.email ?? null,
        telefone: participante?.telefone ?? null,
      }
    })
    .filter((row) => String(row.participante || '').toLowerCase().includes('maycon'))

  console.log(JSON.stringify(rows, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
