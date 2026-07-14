import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import type { Installment, PublicRegistrationSuccessSummary } from '@shared/types/retreat'
import logoRetiro from '@/assets/logo-retiro.png'
import { downloadBoletoBookletPdf } from '@/utils/boletoPdf'
import { formatCurrency, formatIsoDatePtBr, formatPaymentMethodLabel } from '@/utils/format'

type SuccessPayload = PublicRegistrationSuccessSummary & {
  fullName: string
  participantPhone: string
  participantEmail: string
  participantChurch: string
  participantCity: string
}

function readSummaryFromSessionStorage() {
  const raw = sessionStorage.getItem('publicRegistrationSummary')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SuccessPayload
  } catch {
    return null
  }
}

export default function PublicRegistrationSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [payload, setPayload] = useState<SuccessPayload | null>(() => {
    if (location.state) {
      return location.state as SuccessPayload
    }

    return readSummaryFromSessionStorage()
  })

  useEffect(() => {
    if (payload) {
      return
    }

    const fallback = readSummaryFromSessionStorage()
    if (fallback) {
      setPayload(fallback)
      return
    }

    navigate('/', { replace: true })
  }, [navigate, payload])

  const installments = useMemo(() => {
    if (!payload) {
      return []
    }

    return payload.installmentAmounts.map(
      (amount, index): Installment & { index: number } => ({
        id: `public-success-installment-${index + 1}`,
        index: index + 1,
        label: `${index + 1}x`,
        amount,
        status: 'Pendente',
        dueDate: payload.dueDates ? payload.dueDates[index] ?? undefined : undefined,
      }),
    )
  }, [payload])

  async function handleDownloadBoleto() {
    if (!payload || payload.paymentMethod !== 'Boleto') {
      return
    }

    await downloadBoletoBookletPdf({
      participantName: payload.fullName,
      participantPhone: payload.participantPhone,
      participantEmail: payload.participantEmail,
      participantChurch: payload.participantChurch,
      participantCity: payload.participantCity,
      installments,
    })
  }

  if (!payload) {
    return null
  }

  const installmentLabel =
    payload.paymentMethod === 'CartaoCredito'
      ? `${payload.installmentCount}x de ${formatCurrency(payload.installmentAmounts[0] ?? 0)}`
      : `${payload.installmentCount}x de ${formatCurrency(payload.installmentAmounts[0] ?? 0)}`

  return (
    <div className="min-h-screen bg-[#06110d] px-4 pb-10 pt-4 text-slate-100 md:px-6 md:pb-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(74,222,128,0.08),transparent_22%),linear-gradient(180deg,rgba(8,20,16,0.95),rgba(6,17,13,1))]" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-amber-200/30 bg-[#f4ead7] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] md:h-32 md:w-32">
            <img
              src={logoRetiro}
              alt="Logo Retiro 2027"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <section className="rounded-[28px] border border-emerald-100/10 bg-[#0b1713]/90 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/60">
            Inscrição confirmada
          </p>
          <h1 className="mt-3 font-title text-3xl leading-tight text-white md:text-4xl">
            Sua inscrição foi registrada
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            {payload.fullName} · pagamento {formatPaymentMethodLabel(payload.paymentMethod)} ·{' '}
            idade no evento: {payload.ageAtEvent} anos
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Valor total</p>
              <p className="mt-3 font-title text-3xl text-white">
                {formatCurrency(payload.totalAmount)}
              </p>
              <p className="mt-2 text-sm text-slate-400">{installmentLabel}</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Próximos passos</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                O pagamento ficará como pendente de validação até a diretoria confirmar a
                baixa.
              </p>
            </div>
          </div>

          {payload.paymentMethod === 'CartaoCredito' ? (
            <div className="mt-8 rounded-[24px] border border-emerald-100/10 bg-[#102019]/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Parcelamento no cartão
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {installmentLabel} · taxas inclusas. As datas de vencimento dependem da fatura
                do seu cartão.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-emerald-100/10 bg-[#102019]/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Parcelas e vencimentos estimados
              </p>
              <div className="mt-4 space-y-3">
                {installments.map((installment) => (
                  <div
                    key={installment.index}
                    className="flex flex-col gap-1 rounded-[20px] border border-white/10 bg-white/[0.02] px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <p className="text-sm text-slate-200">
                      Parcela {installment.index} · {formatCurrency(installment.amount)}
                    </p>
                    {installment.dueDate ? (
                      <p className="text-sm text-slate-400">
                        Vencimento: {formatIsoDatePtBr(installment.dueDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">Vencimento a combinar</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
            {payload.paymentMethod === 'Boleto' ? (
              <button
                type="button"
                onClick={() => void handleDownloadBoleto()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/25 bg-amber-200/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-200/35 hover:bg-amber-200/15"
              >
                <Download className="h-4 w-4" />
                Baixar boleto
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/16 hover:bg-white/[0.05]"
            >
              Fazer outra inscrição
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
