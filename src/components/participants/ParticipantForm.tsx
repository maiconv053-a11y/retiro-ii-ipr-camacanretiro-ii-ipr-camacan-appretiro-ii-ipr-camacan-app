import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, RotateCcw } from 'lucide-react'
import type {
  ParticipantInput,
  PaymentMethod,
  RegistrationStatus,
} from '@shared/types/retreat'
import { formatPhone } from '@/utils/format'

interface ParticipantFormProps {
  onSubmit: (participant: ParticipantInput) => Promise<void> | void
  initialValues?: ParticipantInput
  defaultTotalAmount?: number
  mode?: 'create' | 'edit'
  onCancelEdit?: () => void
  isSubmitting?: boolean
}

function createInitialState(defaultTotalAmount: number): ParticipantInput {
  return {
    fullName: '',
    age: 18,
    phone: '',
    dietaryRestrictions: '',
    medicalRestrictions: '',
    registrationStatus: 'Pendente',
    totalAmount: defaultTotalAmount,
    paymentMethod: 'PIX',
    installmentCount: 1,
  }
}

const registrationOptions: RegistrationStatus[] = [
  'Confirmada',
  'Pendente',
  'Cancelada',
]

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'CartaoCredito', label: 'Cartão' },
]

function requiresInstallments(method: PaymentMethod) {
  return method === 'Boleto' || method === 'CartaoCredito'
}

export function ParticipantForm({
  onSubmit,
  initialValues,
  defaultTotalAmount = 380,
  mode = 'create',
  onCancelEdit,
  isSubmitting = false,
}: ParticipantFormProps) {
  const [form, setForm] = useState<ParticipantInput>(() => createInitialState(defaultTotalAmount))

  useEffect(() => {
    setForm(initialValues ?? createInitialState(defaultTotalAmount))
  }, [defaultTotalAmount, initialValues])

  const isValid = useMemo(
    () =>
      form.fullName.trim().length > 3 &&
      form.phone.trim().length >= 14 &&
      form.totalAmount > 0 &&
      form.installmentCount > 0,
    [form],
  )

  function updateField<Key extends keyof ParticipantInput>(
    field: Key,
    value: ParticipantInput[Key],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValid) {
      return
    }

    try {
      await onSubmit({
        ...form,
        fullName: form.fullName.trim(),
      })
    } catch {
      return
    }

    if (mode === 'create') {
      setForm(createInitialState(defaultTotalAmount))
    }
  }

  function setPaymentMethod(paymentMethod: PaymentMethod) {
    updateField('paymentMethod', paymentMethod)
    if (!requiresInstallments(paymentMethod)) {
      updateField('installmentCount', 1)
    }
  }

  const heading = mode === 'edit' ? 'Editar participante' : 'Cadastro de participante'
  const subheading = mode === 'edit' ? 'Edição rápida' : 'Nova inscrição'
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : 'Salvar inscrição'
  const actionLabel = mode === 'edit' ? 'Atualizar participante' : 'Adicionar participante'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-cyan-300/58">
            {subheading}
          </p>
          <h2 className="mt-2 font-title text-xl text-white">
            {heading}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'edit' && onCancelEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
            disabled={isSubmitting}
              aria-label="Cancelar edição"
              title="Cancelar edição"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-slate-300 transition hover:border-white/16 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            aria-label={actionLabel}
            title={actionLabel}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3 text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'edit' ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Nome completo
          </span>
          <input
            value={form.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            className="field-surface w-full"
            placeholder="Digite o nome do participante"
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
            rows={3}
            className="field-surface w-full"
            placeholder="Ex.: vegetariano, sem glúten"
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
            rows={3}
            className="field-surface w-full"
            placeholder="Ex.: alergias, medicação contínua"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Status da inscrição
          </span>
          <div className="grid grid-cols-3 gap-2">
            {registrationOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateField('registrationStatus', status)}
                className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.16em] transition ${
                  form.registrationStatus === status
                    ? 'border-cyan-400/24 bg-cyan-400/8 text-cyan-100'
                    : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/16 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </label>

        <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/[0.02] p-4 md:col-span-2">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Configuração financeira inicial
            </span>
            <p className="mt-1 text-sm text-slate-500">
              Defina o valor total do débito e a forma de pagamento escolhida já na inscrição.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Valor total do débito
              </span>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.totalAmount}
                onChange={(event) =>
                  updateField('totalAmount', Number(event.target.value))
                }
                className="field-surface w-full"
                placeholder={`Ex.: ${defaultTotalAmount}`}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Forma de pagamento
              </span>
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
                className="field-surface w-full"
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {requiresInstallments(form.paymentMethod) ? (
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Parcelamento
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
                    {count}x
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="text-sm text-slate-400">
          {isValid
            ? 'Pronto para salvar. O perfil financeiro inicial será criado ou atualizado automaticamente.'
            : 'Preencha nome, telefone, valor total e forma de pagamento para liberar o cadastro.'}
        </p>
        <div className="flex items-center gap-3">
          {mode === 'edit' && onCancelEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/16 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
