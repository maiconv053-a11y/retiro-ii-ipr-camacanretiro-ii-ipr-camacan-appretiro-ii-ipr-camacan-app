import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Landmark, Receipt, Wallet } from 'lucide-react'
import {
  getMaxInstallmentsForMethod,
  normalizeInstallmentCount,
  type PaymentMethod,
  type PublicRegistrationInput,
  requiresInstallments,
} from '@shared/types/retreat'
import {
  BASE_REGISTRATION_FEE,
  computeRegistrationPricing,
  EVENT_DATE_ISO,
  getMonthsAvailableUntilEvent,
  PAYMENT_DEADLINE_ISO,
} from '@/utils/registrationPricing'
import { createPublicRegistration, fetchPublicRetreatSettings } from '@/services/retreatApi'
import logoRetiro from '@/assets/logo-retiro.png'
import { PrettySelect } from '@/components/ui/PrettySelect'
import {
  formatBrazilianDateInput,
  formatCurrency,
  formatIsoDatePtBr,
  formatPhone,
  parseBrazilianDateInputToIso,
} from '@/utils/format'

const initialForm: PublicRegistrationInput = {
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  church: '',
  city: '',
  dietaryRestrictions: '',
  medicalRestrictions: '',
  paymentMethod: 'PIX',
  installmentCount: 1,
  termsAccepted: false,
}

const paymentOptions: Array<{
  value: PaymentMethod
  label: string
  description: string
  icon: typeof Wallet
}> = [
  {
    value: 'PIX',
    label: 'À vista no PIX',
    description: 'Pagamento direto e conferência posterior pela diretoria.',
    icon: Wallet,
  },
  {
    value: 'Dinheiro',
    label: 'À vista no Dinheiro',
    description: 'Pagamento presencial com baixa manual pela diretoria.',
    icon: Landmark,
  },
  {
    value: 'Boleto',
    label: 'Boleto',
    description: 'Selecione a quantidade de parcelas desejada.',
    icon: Receipt,
  },
  {
    value: 'CartaoCredito',
    label: 'Cartão de Crédito',
    description: 'Permite parcelamento em até 12x.',
    icon: CreditCard,
  },
]

export default function PublicRegistrationPage() {
  const [form, setForm] = useState<PublicRegistrationInput>(initialForm)
  const [birthDateInput, setBirthDateInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retreatFee, setRetreatFee] = useState(BASE_REGISTRATION_FEE)
  const navigate = useNavigate()
  const monthsAvailableForBoleto = useMemo(() => getMonthsAvailableUntilEvent(new Date()), [])

  useEffect(() => {
    let active = true

    fetchPublicRetreatSettings()
      .then((settings) => {
        if (active && Number.isFinite(settings.retreatFee) && settings.retreatFee > 0) {
          setRetreatFee(settings.retreatFee)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const pricing = useMemo(() => {
    if (!form.birthDate) {
      return null
    }

    try {
      return computeRegistrationPricing({
        birthDateIso: form.birthDate,
        paymentMethod: form.paymentMethod,
        installmentCount: form.installmentCount,
        baseFee: retreatFee,
      })
    } catch {
      return null
    }
  }, [form.birthDate, form.installmentCount, form.paymentMethod, retreatFee])

  const installmentOptions = useMemo(() => {
    const maxInstallments =
      form.paymentMethod === 'Boleto'
        ? Math.min(getMaxInstallmentsForMethod(form.paymentMethod), monthsAvailableForBoleto)
        : getMaxInstallmentsForMethod(form.paymentMethod)

    return Array.from({ length: maxInstallments }, (_, index) => index + 1).map((count) => {
      const label = (() => {
        if (!form.birthDate) {
          return `${count}x`
        }

        try {
          const optionPricing = computeRegistrationPricing({
            birthDateIso: form.birthDate,
            paymentMethod: form.paymentMethod,
            installmentCount: count,
            baseFee: retreatFee,
          })

          if (form.paymentMethod === 'CartaoCredito') {
            return `${count}x de ${formatCurrency(optionPricing.installmentAmounts[0])} (total ${formatCurrency(optionPricing.totalAmount)})`
          }

          return `${count}x de ${formatCurrency(optionPricing.installmentAmounts[0])}`
        } catch {
          return `${count}x`
        }
      })()

      return {
        value: count,
        label,
      }
    })
  }, [form.birthDate, form.paymentMethod, monthsAvailableForBoleto, retreatFee])

  const isValid = useMemo(
    () =>
      form.fullName.trim().length >= 4 &&
      form.birthDate.trim().length === 10 &&
      form.phone.trim().length >= 14 &&
      form.email.trim().length >= 5 &&
      form.church.trim().length >= 2 &&
      form.city.trim().length >= 2 &&
      form.termsAccepted &&
      pricing !== null,
    [form, pricing],
  )

  function updateField<Key extends keyof PublicRegistrationInput>(
    field: Key,
    value: PublicRegistrationInput[Key],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateBirthDateInput(value: string) {
    const formatted = formatBrazilianDateInput(value)
    const birthDateIso = parseBrazilianDateInputToIso(formatted)
    const normalizedBirthDateIso =
      birthDateIso && birthDateIso <= EVENT_DATE_ISO ? birthDateIso : ''

    setBirthDateInput(formatted)
    updateField('birthDate', normalizedBirthDateIso)
  }

  function setPaymentMethod(method: PaymentMethod) {
    setForm((current) => ({
      ...current,
      paymentMethod: method,
      installmentCount: requiresInstallments(method)
        ? Math.min(
            normalizeInstallmentCount(method, current.installmentCount),
            method === 'Boleto' ? monthsAvailableForBoleto : Infinity,
          )
        : 1,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValid) {
      setError('Preencha os dados obrigatórios e aceite o termo de compromisso.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createPublicRegistration({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        church: form.church.trim(),
        city: form.city.trim(),
        dietaryRestrictions: form.dietaryRestrictions.trim(),
        medicalRestrictions: form.medicalRestrictions.trim(),
      })

      const payload = {
        ...response.summary,
        fullName: form.fullName.trim(),
      }

      sessionStorage.setItem('publicRegistrationSummary', JSON.stringify(payload))
      navigate('/sucesso', { replace: true, state: payload })
      setForm(initialForm)
      setBirthDateInput('')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir a inscrição agora.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06110d] px-4 pb-8 pt-2 text-slate-100 md:px-6 md:pb-8 md:pt-3">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(74,222,128,0.08),transparent_22%),linear-gradient(180deg,rgba(8,20,16,0.95),rgba(6,17,13,1))]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-[32px] border border-amber-200/30 bg-[#f4ead7] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] md:h-40 md:w-40">
            <img
              src={logoRetiro}
              alt="Logo Retiro 2027"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[28px] border border-emerald-100/10 bg-[#0b1713]/90 p-6 md:p-8">
          <h1 className="mt-4 font-title text-3xl leading-tight text-white md:text-4xl">
            Inscrição do Retiro da II IPR de Camacan
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Preencha seus dados, escolha a forma de pagamento e confirme o termo de
            compromisso. A inscrição entra no banco online e aguarda validação da
            diretoria.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Valor integral
              </p>
              <p className="mt-3 font-title text-3xl text-white">
                {formatCurrency(retreatFee)}
              </p>
              {pricing ? (
                <div className="mt-3 space-y-1 text-sm text-slate-400">
                  <p>
                    Data do evento:{' '}
                    <span className="text-slate-200">{formatIsoDatePtBr(EVENT_DATE_ISO)}</span>
                  </p>
                  <p>
                    Idade no evento:{' '}
                    <span className="text-slate-200">{pricing.ageAtEvent} anos</span>
                  </p>
                  <p>
                    Valor final:{' '}
                    <span className="text-white">{formatCurrency(pricing.totalAmount)}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  Preencha a data de nascimento para calcular o valor final.
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Parcelamento do boleto
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                <p>
                  Primeira parcela: mesmo dia da inscrição, no mês seguinte.
                </p>
                <p>
                  Última parcela: <span className="text-slate-200">{formatIsoDatePtBr(PAYMENT_DEADLINE_ISO)}</span>.
                </p>
                <p>
                  Limite atual de parcelamento: <span className="text-white">{monthsAvailableForBoleto}x</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Como funciona
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <p>1. Você preenche seus dados pessoais e possíveis restrições.</p>
              <p>2. Escolhe a forma de pagamento e as parcelas, quando aplicável.</p>
              <p>3. Aceita o termo de compromisso e envia a solicitação.</p>
              <p>4. A diretoria confirma o recebimento e valida o pagamento no painel interno.</p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-emerald-100/10 bg-[#0d1814]/90 p-6 md:p-8"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2 md:col-span-2 xl:col-span-6">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Nome completo
              </span>
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                className="field-surface w-full"
                placeholder="Digite seu nome completo"
              />
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Data de nascimento
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                maxLength={10}
                value={birthDateInput}
                onChange={(event) => updateBirthDateInput(event.target.value)}
                className="field-surface w-full"
                placeholder="dd/mm/aaaa"
              />
              <span className="text-xs text-slate-500">
                Digite a data no formato brasileiro: dd/mm/aaaa.
              </span>
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Telefone
              </span>
              <input
                value={form.phone}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                className="field-surface w-full"
                placeholder="(73) 99999-9999"
              />
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                E-mail
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="field-surface w-full"
                placeholder="nome@email.com"
              />
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Qual a sua igreja
              </span>
              <input
                value={form.church}
                onChange={(event) => updateField('church', event.target.value)}
                className="field-surface w-full"
                placeholder="Ex.: II IPR de Camacan"
              />
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Cidade onde mora
              </span>
              <input
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="field-surface w-full"
                placeholder="Ex.: Camacan - BA"
              />
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Restrições alimentares
              </span>
              <textarea
                value={form.dietaryRestrictions}
                onChange={(event) =>
                  updateField('dietaryRestrictions', event.target.value)
                }
                rows={4}
                className="field-surface w-full"
                placeholder="Ex.: vegetariano, sem lactose, sem glúten"
              />
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Restrições médicas
              </span>
              <textarea
                value={form.medicalRestrictions}
                onChange={(event) =>
                  updateField('medicalRestrictions', event.target.value)
                }
                rows={4}
                className="field-surface w-full"
                placeholder="Ex.: alergias, medicação contínua, cuidados especiais"
              />
            </label>
          </div>

          <section className="mt-6 rounded-[24px] border border-emerald-100/10 bg-[#102019]/72 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Escolha do pagamento
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Valor total previsto:{' '}
                  {pricing ? formatCurrency(pricing.totalAmount) : '—'}
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Boleto até 7x e cartão de crédito até 12x.
              </p>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {paymentOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex min-h-[6.75rem] items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition lg:min-h-[7.25rem] ${
                    form.paymentMethod === value
                      ? 'border-cyan-400/24 bg-cyan-400/8 text-cyan-100'
                      : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/16 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            {requiresInstallments(form.paymentMethod) ? (
              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Em quantas vezes deseja parcelar?
                </span>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
                  <PrettySelect
                    value={form.installmentCount}
                    onChange={(value) => updateField('installmentCount', value)}
                    options={installmentOptions}
                    disabled={!form.birthDate}
                  />
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-slate-400">
                    {form.paymentMethod === 'CartaoCredito'
                      ? 'No cartão, a tela de sucesso mostra apenas as parcelas com taxas inclusas.'
                      : `No boleto, a última parcela sempre vence em ${formatIsoDatePtBr(PAYMENT_DEADLINE_ISO)}.`}
                  </div>
                </div>
              </label>
            ) : null}
          </section>

          <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Termo de compromisso
            </p>
            <div className="mt-4 h-56 overflow-y-auto rounded-[20px] border border-emerald-100/10 bg-[#0b1713] p-4 text-sm leading-7 text-slate-300">
              <p>
                Ao confirmar esta inscrição, declaro que as informações prestadas são
                verdadeiras e me comprometo a participar do retiro com responsabilidade,
                respeito à liderança e observância das orientações da organização.
              </p>
              <p className="mt-4">
                Comprometo-me a comunicar com antecedência qualquer impossibilidade de
                comparecimento, restrição alimentar ou necessidade médica relevante para
                minha permanência no evento.
              </p>
              <p className="mt-4">
                Estou ciente de que a vaga somente será considerada validada após a
                conferência do pagamento pela diretoria, inclusive nos casos de PIX,
                dinheiro, boleto ou cartão de crédito parcelado.
              </p>
              <p className="mt-4">
                Também concordo em seguir as normas espirituais, disciplinares e de
                convivência estabelecidas pela organização do Retiro da II IPR de Camacan.
              </p>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-emerald-100/10 bg-[#0b1713]/70 p-4">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => updateField('termsAccepted', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
              />
              <span className="text-sm leading-6 text-slate-300">
                Li e concordo com o termo de compromisso do retiro.
              </span>
            </label>
          </section>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-400">
              Ao enviar, sua inscrição será gravada com status financeiro
              <span className="text-white"> pendente de validação</span>.
            </p>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Enviando inscrição...' : 'Confirmar inscrição'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
