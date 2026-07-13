import { useMemo, useState, type FormEvent } from 'react'
import { CreditCard, Landmark, Receipt, ShieldCheck, Wallet } from 'lucide-react'
import type { PaymentMethod, PublicRegistrationInput } from '@shared/types/retreat'
import { createPublicRegistration } from '@/services/retreatApi'
import { formatCurrency, formatPhone } from '@/utils/format'

const REGISTRATION_FEE = 380

const initialForm: PublicRegistrationInput = {
  fullName: '',
  age: 18,
  phone: '',
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
    description: 'Permite parcelamento em até 10x.',
    icon: CreditCard,
  },
]

function requiresInstallments(method: PaymentMethod) {
  return method === 'Boleto' || method === 'CartaoCredito'
}

export default function PublicRegistrationPage() {
  const [form, setForm] = useState<PublicRegistrationInput>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isValid = useMemo(
    () =>
      form.fullName.trim().length >= 4 &&
      form.age > 0 &&
      form.phone.trim().length >= 14 &&
      form.termsAccepted,
    [form],
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

  function setPaymentMethod(method: PaymentMethod) {
    setForm((current) => ({
      ...current,
      paymentMethod: method,
      installmentCount: requiresInstallments(method) ? current.installmentCount : 1,
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
    setSuccess(null)

    try {
      await createPublicRegistration({
        ...form,
        fullName: form.fullName.trim(),
        dietaryRestrictions: form.dietaryRestrictions.trim(),
        medicalRestrictions: form.medicalRestrictions.trim(),
      })

      setSuccess(
        'Inscrição enviada com sucesso. O pagamento ficou como pendente de validação pela diretoria.',
      )
      setForm(initialForm)
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
    <div className="min-h-screen bg-[#020611] px-4 py-8 text-slate-100 md:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.07),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,1))]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#08111d]/88 p-6 md:p-8">
          <p className="font-title text-[10px] uppercase tracking-[0.32em] text-cyan-300/60">
            Área pública
          </p>
          <h1 className="mt-4 font-title text-3xl leading-tight text-white md:text-4xl">
            Auto-inscrição do Retiro da II IPR de Camacan
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Preencha seus dados, escolha a forma de pagamento e confirme o termo de
            compromisso. A inscrição entra no banco online e aguarda validação da
            diretoria.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Valor da inscrição
              </p>
              <p className="mt-3 font-title text-3xl text-white">
                {formatCurrency(REGISTRATION_FEE)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Registrado automaticamente com status pendente de validação.
              </p>
            </div>

            <div className="rounded-[24px] border border-emerald-400/14 bg-emerald-400/[0.04] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-medium text-white">Fluxo seguro</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Participantes enviam apenas a própria inscrição. A diretoria valida
                    pagamentos no painel interno da organização.
                  </p>
                </div>
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
          className="rounded-[28px] border border-white/10 bg-[#08111f]/88 p-6 md:p-8"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
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

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Idade
              </span>
              <input
                type="number"
                min={1}
                value={form.age}
                onChange={(event) => updateField('age', Number(event.target.value))}
                className="field-surface w-full"
              />
            </label>

            <label className="space-y-2">
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

            <label className="space-y-2">
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

            <label className="space-y-2">
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

          <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Escolha do pagamento
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Valor total previsto: {formatCurrency(REGISTRATION_FEE)}
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Parcelamento liberado para boleto e cartão.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {paymentOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
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
                <select
                  value={form.installmentCount}
                  onChange={(event) =>
                    updateField('installmentCount', Number(event.target.value))
                  }
                  className="field-surface w-full"
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}x de {formatCurrency(REGISTRATION_FEE / count)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>

          <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Termo de compromisso
            </p>
            <div className="mt-4 h-56 overflow-y-auto rounded-[20px] border border-white/8 bg-[#060d18] p-4 text-sm leading-7 text-slate-300">
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

            <label className="mt-4 flex items-start gap-3 rounded-[20px] border border-white/8 bg-white/[0.02] p-4">
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

          {success ? (
            <div className="mt-6 rounded-[20px] border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
              {success}
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
  )
}
