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
    <div className="min-h-screen bg-[#edf4ee] px-4 pb-10 pt-4 text-slate-800 md:px-6 md:pb-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(160,202,178,0.32),transparent_24%),radial-gradient(circle_at_top_right,rgba(206,226,214,0.5),transparent_24%),linear-gradient(180deg,rgba(248,252,249,0.96),rgba(232,242,235,1))]" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-[#b8d1c0]/70 bg-[#f6faf7] p-3 shadow-[0_12px_28px_rgba(101,136,116,0.12)] md:h-32 md:w-32">
            <img
              src={logoRetiro}
              alt="Logo Retiro 2027"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <section className="rounded-[28px] border border-[#aac4b3]/40 bg-[#eef5ef]/92 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#6a957d]">
            Inscrição confirmada
          </p>
          <h1 className="mt-3 font-title text-3xl leading-tight text-[#20352a] md:text-4xl">
            Sua inscrição foi registrada
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#42594d]">
            {payload.fullName} · pagamento {formatPaymentMethodLabel(payload.paymentMethod)} ·{' '}
            idade no evento: {payload.ageAtEvent} anos
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">Valor total</p>
              <p className="mt-3 font-title text-3xl text-[#20352a]">
                {formatCurrency(payload.totalAmount)}
              </p>
              <p className="mt-2 text-sm text-[#4c6457]">{installmentLabel}</p>
            </div>

            <div className="rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">Próximos passos</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                O pagamento ficará como pendente de validação até a diretoria confirmar a
                baixa.
              </p>
              {payload.paymentMethod === 'Boleto' && payload.preferredPaymentDay ? (
                <p className="mt-2 text-sm text-[#4c6457]">
                  Melhor dia escolhido para pagar: dia {String(payload.preferredPaymentDay).padStart(2, '0')}.
                </p>
              ) : null}
            </div>
          </div>

          {payload.paymentMethod === 'CartaoCredito' ? (
            <div className="mt-8 rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
                Parcelamento no cartão
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {installmentLabel} · taxas inclusas. As datas de vencimento dependem da fatura
                do seu cartão.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
                Parcelas e vencimentos estimados
              </p>
              <div className="mt-4 space-y-3">
                {installments.map((installment) => (
                  <div
                    key={installment.index}
                    className="flex flex-col gap-1 rounded-[20px] border border-[#b7d0bf]/40 bg-white/72 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <p className="text-sm text-slate-700">
                      Parcela {installment.index} · {formatCurrency(installment.amount)}
                    </p>
                    {installment.dueDate ? (
                      <p className="text-sm text-[#42594d]">
                        Vencimento: {formatIsoDatePtBr(installment.dueDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-[#587264]">Vencimento a combinar</p>
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#89b39a]/55 bg-[#dcebe2] px-5 py-3 text-sm font-medium text-[#29513e] transition hover:border-[#6f9f80]/65 hover:bg-[#d2e5d8]"
              >
                <Download className="h-4 w-4" />
                Baixar boleto
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="rounded-2xl border border-[#b7d0bf]/45 bg-white/78 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#89b39a]/55 hover:bg-white"
            >
              Fazer outra inscrição
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
