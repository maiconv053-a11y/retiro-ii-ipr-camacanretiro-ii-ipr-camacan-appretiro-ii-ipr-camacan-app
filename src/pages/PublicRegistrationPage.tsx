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
  getBoletoStartMonthOptions,
  getDefaultBoletoStartMonth,
  getMonthsAvailableFromStartMonth,
  computeRegistrationPricing,
  EVENT_DATE_ISO,
  PAYMENT_DEADLINE_ISO,
  PREFERRED_PAYMENT_DAY_OPTIONS,
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

function createInitialForm(now: Date): PublicRegistrationInput {
  return {
    fullName: '',
    birthDate: '',
    phone: '',
    email: '',
    church: '',
    city: '',
    dietaryRestrictions: '',
    medicalRestrictions: '',
    paymentMethod: 'PIX',
    preferredPaymentDay: 10,
    preferredPaymentStartMonth: getDefaultBoletoStartMonth(now),
    installmentCount: 1,
    termsAccepted: false,
  }
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
  const registrationNow = useMemo(() => new Date(), [])
  const [form, setForm] = useState<PublicRegistrationInput>(() => createInitialForm(registrationNow))
  const [birthDateInput, setBirthDateInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retreatFee, setRetreatFee] = useState(BASE_REGISTRATION_FEE)
  const navigate = useNavigate()
  const currentMonthKey = useMemo(
    () =>
      `${registrationNow.getUTCFullYear()}-${String(registrationNow.getUTCMonth() + 1).padStart(2, '0')}`,
    [registrationNow],
  )
  const currentDayOfMonth = useMemo(() => registrationNow.getUTCDate(), [registrationNow])
  const boletoStartMonthOptions = useMemo(
    () => getBoletoStartMonthOptions(registrationNow),
    [registrationNow],
  )
  const filteredBoletoStartMonthOptions = useMemo(() => {
    const hasRemainingPreferredDayInCurrentMonth = PREFERRED_PAYMENT_DAY_OPTIONS.some(
      (day) => day >= currentDayOfMonth,
    )

    return boletoStartMonthOptions.filter(
      (option) => option.value !== currentMonthKey || hasRemainingPreferredDayInCurrentMonth,
    )
  }, [boletoStartMonthOptions, currentDayOfMonth, currentMonthKey])
  const preferredPaymentDayOptions = useMemo(() => {
    const allowedDays =
      form.preferredPaymentStartMonth === currentMonthKey
        ? PREFERRED_PAYMENT_DAY_OPTIONS.filter((day) => day >= currentDayOfMonth)
        : PREFERRED_PAYMENT_DAY_OPTIONS

    return allowedDays.map((day) => ({
      value: day,
      label: `Dia ${String(day).padStart(2, '0')}`,
    }))
  }, [currentDayOfMonth, currentMonthKey, form.preferredPaymentStartMonth])
  const monthsAvailableForBoleto = useMemo(
    () =>
      getMonthsAvailableFromStartMonth(
        registrationNow,
        form.paymentMethod === 'Boleto' ? form.preferredPaymentStartMonth : undefined,
      ),
    [form.paymentMethod, form.preferredPaymentStartMonth, registrationNow],
  )
  const selectedBoletoStartMonthLabel = useMemo(
    () =>
      filteredBoletoStartMonthOptions.find(
        (option) => option.value === form.preferredPaymentStartMonth,
      )?.label ?? filteredBoletoStartMonthOptions[0]?.label ?? '',
    [filteredBoletoStartMonthOptions, form.preferredPaymentStartMonth],
  )

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
        preferredPaymentDay:
          form.paymentMethod === 'Boleto' ? form.preferredPaymentDay : undefined,
        preferredPaymentStartMonth:
          form.paymentMethod === 'Boleto' ? form.preferredPaymentStartMonth : undefined,
        installmentCount: form.installmentCount,
        baseFee: retreatFee,
      })
    } catch {
      return null
    }
  }, [
    form.birthDate,
    form.installmentCount,
    form.paymentMethod,
    form.preferredPaymentDay,
    form.preferredPaymentStartMonth,
    retreatFee,
  ])

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
            preferredPaymentDay:
              form.paymentMethod === 'Boleto' ? form.preferredPaymentDay : undefined,
            preferredPaymentStartMonth:
              form.paymentMethod === 'Boleto' ? form.preferredPaymentStartMonth : undefined,
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
  }, [
    form.birthDate,
    form.paymentMethod,
    form.preferredPaymentDay,
    form.preferredPaymentStartMonth,
    monthsAvailableForBoleto,
    retreatFee,
  ])

  useEffect(() => {
    if (form.paymentMethod !== 'Boleto') {
      return
    }

    if (
      filteredBoletoStartMonthOptions.some(
        (option) => option.value === form.preferredPaymentStartMonth,
      )
    ) {
      return
    }

    setForm((current) => ({
      ...current,
      preferredPaymentStartMonth:
        filteredBoletoStartMonthOptions[0]?.value ?? current.preferredPaymentStartMonth,
    }))
  }, [
    filteredBoletoStartMonthOptions,
    form.paymentMethod,
    form.preferredPaymentStartMonth,
  ])

  useEffect(() => {
    if (form.paymentMethod !== 'Boleto') {
      return
    }

    if (preferredPaymentDayOptions.some((option) => option.value === form.preferredPaymentDay)) {
      return
    }

    setForm((current) => ({
      ...current,
      preferredPaymentDay: Number(
        preferredPaymentDayOptions[0]?.value ?? PREFERRED_PAYMENT_DAY_OPTIONS[0],
      ),
    }))
  }, [form.paymentMethod, form.preferredPaymentDay, preferredPaymentDayOptions])

  useEffect(() => {
    if (!requiresInstallments(form.paymentMethod)) {
      return
    }

    if (installmentOptions.some((option) => option.value === form.installmentCount)) {
      return
    }

    setForm((current) => ({
      ...current,
      installmentCount: installmentOptions[installmentOptions.length - 1]?.value ?? 1,
    }))
  }, [form.installmentCount, form.paymentMethod, installmentOptions])

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
        participantPhone: form.phone.trim(),
        participantEmail: form.email.trim(),
        participantChurch: form.church.trim(),
        participantCity: form.city.trim(),
      }

      sessionStorage.setItem('publicRegistrationSummary', JSON.stringify(payload))
      navigate('/sucesso', { replace: true, state: payload })
      setForm(createInitialForm(registrationNow))
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
    <div className="min-h-screen bg-[#edf4ee] px-4 pb-8 pt-2 text-slate-800 md:px-6 md:pb-8 md:pt-3">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(160,202,178,0.32),transparent_24%),radial-gradient(circle_at_top_right,rgba(206,226,214,0.5),transparent_24%),linear-gradient(180deg,rgba(248,252,249,0.96),rgba(232,242,235,1))]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-[32px] border border-[#b8d1c0]/70 bg-[#f6faf7] p-3 shadow-[0_12px_28px_rgba(101,136,116,0.12)] md:h-40 md:w-40">
            <img
              src={logoRetiro}
              alt="Logo Retiro 2027"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[28px] border border-[#aac4b3]/40 bg-[#eef5ef]/92 p-6 md:p-8">
          <h1 className="mt-4 font-title text-3xl leading-tight text-[#20352a] md:text-4xl">
            Inscrição do Retiro da II IPR de Camacan
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#42594d]">
            Preencha seus dados, escolha a forma de pagamento e confirme o termo de
            compromisso. A inscrição entra no banco online e aguarda validação da
            diretoria.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Valor integral
              </p>
              <p className="mt-3 font-title text-3xl text-[#20352a]">
                {formatCurrency(retreatFee)}
              </p>
              <div className="mt-3 space-y-1 text-sm text-[#4c6457]">
                <p className="text-[#2b4337]">O valor do retiro inclui:</p>
                <p>Hospedagem.</p>
                <p>Alimentação: café da manhã, almoço e janta.</p>
                <p>Transporte.</p>
              </div>
              {pricing ? (
                <div className="mt-3 space-y-1 text-sm text-[#4c6457]">
                  <p>
                    Data do evento:{' '}
                    <span className="text-[#2b4337]">{formatIsoDatePtBr(EVENT_DATE_ISO)}</span>
                  </p>
                  <p>
                    Idade no evento:{' '}
                    <span className="text-[#2b4337]">{pricing.ageAtEvent} anos</span>
                  </p>
                  <p>
                    Valor final:{' '}
                    <span className="text-[#20352a]">{formatCurrency(pricing.totalAmount)}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#4c6457]">
                  Preencha a data de nascimento para calcular o valor final.
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
                Parcelamento do boleto
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#4c6457]">
                <p>
                  Primeira parcela: no mês e dia escolhidos por você.
                </p>
                <p>
                  Início disponível atual:{' '}
                  <span className="text-[#20352a]">{selectedBoletoStartMonthLabel}</span>.
                </p>
                <p>
                  Última parcela: <span className="text-[#20352a]">{formatIsoDatePtBr(PAYMENT_DEADLINE_ISO)}</span>.
                </p>
                <p>
                  Limite atual de parcelamento: <span className="text-[#20352a]">{monthsAvailableForBoleto}x</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
              Como funciona
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#42594d]">
              <p>1. Você preenche seus dados pessoais e possíveis restrições.</p>
              <p>2. Escolhe a forma de pagamento e as parcelas, quando aplicável.</p>
              <p>3. Aceita o termo de compromisso e envia a solicitação.</p>
              <p>4. A diretoria confirma o recebimento e valida o pagamento no painel interno.</p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
        className="rounded-[28px] border border-[#aac4b3]/40 bg-[#eef5ef]/92 p-6 md:p-8"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2 md:col-span-2 xl:col-span-6">
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs text-[#50675a]">
                Digite a data no formato brasileiro: dd/mm/aaaa.
              </span>
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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

          <section className="mt-6 rounded-[24px] border border-[#aac4b3]/40 bg-[#dcebe1]/85 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
                  Escolha do pagamento
                </p>
                <p className="mt-1 text-sm text-[#4c6457]">
                  Valor total previsto:{' '}
                  {pricing ? formatCurrency(pricing.totalAmount) : '—'}
                </p>
              </div>
              <p className="text-sm text-[#50675a]">
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
                      ? 'border-[#7ea790]/60 bg-[#d9e9de] text-[#1f382c]'
                      : 'border-[#b7d0bf]/40 bg-white/72 text-[#42594d] hover:border-[#89b39a]/55 hover:bg-white'
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-[#4c6457]">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            {form.paymentMethod === 'Boleto' ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                    Em qual mês deseja começar a pagar?
                  </span>
                  <PrettySelect
                    value={form.preferredPaymentStartMonth}
                    onChange={(value) => updateField('preferredPaymentStartMonth', String(value))}
                    options={filteredBoletoStartMonthOptions}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                    Qual o melhor dia do mês para pagar?
                  </span>
                  <PrettySelect
                    value={form.preferredPaymentDay}
                    onChange={(value) => updateField('preferredPaymentDay', Number(value))}
                    options={preferredPaymentDayOptions}
                  />
                </label>
              </div>
            ) : null}

            {requiresInstallments(form.paymentMethod) ? (
              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                  Em quantas vezes deseja parcelar?
                </span>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
                  <PrettySelect
                    value={form.installmentCount}
                    onChange={(value) => updateField('installmentCount', Number(value))}
                    options={installmentOptions}
                    disabled={!form.birthDate}
                  />
                  <div className="rounded-[20px] border border-[#b7d0bf]/40 bg-white/72 px-4 py-3 text-sm leading-6 text-[#4c6457]">
                    {form.paymentMethod === 'CartaoCredito'
                      ? 'No cartão, a tela de sucesso mostra apenas as parcelas com taxas inclusas.'
                      : `No boleto, a última parcela continua limitada por ${formatIsoDatePtBr(PAYMENT_DEADLINE_ISO)}.`}
                  </div>
                </div>
              </label>
            ) : null}
          </section>

          <section className="mt-6 rounded-[24px] border border-[#b7d0bf]/40 bg-white/72 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#567262]">
              Termo de compromisso
            </p>
            <div className="mt-4 h-56 overflow-y-auto rounded-[20px] border border-[#b7d0bf]/40 bg-[#f4faf6] p-4 text-sm leading-7 text-slate-700">
              <p>
                Ao confirmar esta inscrição, declaro que li e concordo com as condições
                de participação no Retiro da II IPR de Camacan, comprometendo-me a agir
                com responsabilidade, respeito e cooperação durante todo o evento.
              </p>
              <div className="mt-4 space-y-4">
                <p>
                  <span className="font-medium text-[#20352a]">1. Informações prestadas.</span>{' '}
                  Declaro que os dados informados nesta inscrição são verdadeiros e
                  atualizados, incluindo informações pessoais, restrições alimentares,
                  necessidades médicas e demais observações relevantes para minha
                  participação.
                </p>
                <p>
                  <span className="font-medium text-[#20352a]">2. Comunicação prévia.</span>{' '}
                  Comprometo-me a comunicar com antecedência qualquer impossibilidade de
                  comparecimento, alteração importante nas informações prestadas ou
                  necessidade especial que possa impactar minha permanência no evento.
                </p>
                <p>
                  <span className="font-medium text-[#20352a]">3. Validação da vaga.</span>{' '}
                  Estou ciente de que a vaga somente será considerada validada após a
                  conferência do pagamento pela diretoria, inclusive nos casos de PIX,
                  dinheiro, boleto ou cartão de crédito parcelado.
                </p>
                <p>
                  <span className="font-medium text-[#20352a]">4. Conduta e convivência.</span>{' '}
                  Comprometo-me a seguir as orientações da organização, bem como as
                  normas espirituais, disciplinares, de convivência, horários e uso dos
                  espaços definidos para o retiro.
                </p>
                <p>
                  <span className="font-medium text-[#20352a]">5. Desistência.</span>{' '}
                  Estou ciente de que, em caso de desistência ou cancelamento por minha
                  iniciativa, os valores já pagos não serão devolvidos.
                </p>
                <p>
                  <span className="font-medium text-[#20352a]">6. Bens pessoais.</span>{' '}
                  Estou ciente de que a guarda de bens e pertences pessoais é de minha
                  responsabilidade, não cabendo à comissão organizadora responsabilidade
                  por perdas, extravios, furtos ou danos ocorridos durante o evento.
                </p>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-[#b7d0bf]/40 bg-white/78 p-4">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => updateField('termsAccepted', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
              />
              <span className="text-sm leading-6 text-slate-700">
                Li e concordo com o termo de compromisso do retiro.
              </span>
            </label>
          </section>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-rose-300/45 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span className="text-rose-800">{error}</span>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-[#c7dacf] pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-[#4c6457]">
              Ao enviar, sua inscrição será gravada com status financeiro
              <span className="text-[#20352a]"> pendente de validação</span>.
            </p>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="rounded-2xl border border-[#89b39a]/55 bg-[#dcebe2] px-5 py-3 text-sm font-medium text-[#29513e] transition hover:border-[#6f9f80]/65 hover:bg-[#d2e5d8] disabled:cursor-not-allowed disabled:opacity-40"
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
