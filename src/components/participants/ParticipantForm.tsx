import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, RotateCcw } from 'lucide-react'
import {
  getMaxInstallmentsForMethod,
  normalizeInstallmentCount,
  requiresInstallments,
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
    birthDate: '',
    phone: '',
    email: '',
    church: '',
    city: '',
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

const registrationLabels: Record<RegistrationStatus, string> = {
  Confirmada: 'QUITADA',
  Pendente: 'Pendente',
  Cancelada: 'Cancelada',
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'CartaoCredito', label: 'Cartão' },
]

export function ParticipantForm({
  onSubmit,
  initialValues,
  defaultTotalAmount = 750,
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
      form.birthDate.trim().length === 10 &&
      form.phone.trim().length >= 14 &&
      form.email.trim().length >= 5 &&
      form.church.trim().length >= 2 &&
      form.city.trim().length >= 2 &&
      form.totalAmount >= 0 &&
      form.installmentCount > 0 &&
      form.installmentCount <= getMaxInstallmentsForMethod(form.paymentMethod),
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
        email: form.email.trim(),
        church: form.church.trim(),
        city: form.city.trim(),
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
    updateField(
      'installmentCount',
      requiresInstallments(paymentMethod)
        ? normalizeInstallmentCount(paymentMethod, form.installmentCount)
        : 1,
    )
  }

  const heading = mode === 'edit' ? 'Editar participante' : 'Cadastro de participante'
  const subheading = mode === 'edit' ? 'Edição rápida' : 'Nova inscrição'
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : 'Salvar inscrição'
  const actionLabel = mode === 'edit' ? 'Atualizar participante' : 'Adicionar participante'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[#aac4b3]/40 bg-[#eef5ef]/92 p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#6a957d]">
            {subheading}
          </p>
          <h2 className="mt-2 font-title text-xl text-[#20352a]">
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
            className="rounded-2xl border border-[#b7d0bf]/45 bg-white/78 p-3 text-slate-700 transition hover:border-[#89b39a]/55 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            aria-label={actionLabel}
            title={actionLabel}
            className="rounded-2xl border border-[#89b39a]/55 bg-[#dcebe2] p-3 text-[#29513e] transition hover:border-[#6f9f80]/65 hover:bg-[#d2e5d8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'edit' ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
          <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
            Data de nascimento
          </span>
          <input
            type="date"
            value={form.birthDate}
            lang="pt-BR"
            onChange={(event) => updateField('birthDate', event.target.value)}
            className="field-surface w-full"
          />
        </label>

        <label className="space-y-2">
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

        <label className="space-y-2">
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

        <label className="space-y-2">
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

        <label className="space-y-2">
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

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
          <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
          <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
                    ? 'border-[#7ea790]/60 bg-[#d9e9de] text-[#1f382c]'
                    : 'border-[#b7d0bf]/40 bg-white/72 text-[#42594d] hover:border-[#89b39a]/55 hover:text-[#20352a]'
                }`}
              >
                {registrationLabels[status]}
              </button>
            ))}
          </div>
        </label>

        <div className="space-y-3 rounded-[22px] border border-[#b7d0bf]/40 bg-white/72 p-4 md:col-span-2">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
              Configuração financeira inicial
            </span>
            <p className="mt-1 text-sm text-[#4c6457]">
              Defina o valor total do débito e a forma de pagamento escolhida já na inscrição.
              Boleto vai até 7x e cartão vai até 12x.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                Valor total do débito
              </span>
              <input
                type="number"
                min={0}
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
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
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                Parcelamento
              </span>
              <select
                value={form.installmentCount}
                onChange={(event) =>
                  updateField('installmentCount', Number(event.target.value))
                }
                className="field-surface w-full"
              >
                {Array.from(
                  { length: getMaxInstallmentsForMethod(form.paymentMethod) },
                  (_, index) => index + 1,
                ).map((count) => (
                  <option key={count} value={count}>
                    {count}x
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#c7dacf] pt-4">
        <p className="text-sm text-[#4c6457]">
          {isValid
            ? 'Pronto para salvar. O perfil financeiro inicial será criado ou atualizado automaticamente.'
            : 'Preencha nome, telefone, e-mail, igreja, cidade, valor total e forma de pagamento para liberar o cadastro.'}
        </p>
        <div className="flex items-center gap-3">
          {mode === 'edit' && onCancelEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="rounded-2xl border border-[#b7d0bf]/45 bg-white/78 px-5 py-3 text-sm font-medium text-[#42594d] transition hover:border-[#89b39a]/55 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-2xl border border-[#89b39a]/55 bg-[#dcebe2] px-5 py-3 text-sm font-medium text-[#29513e] transition hover:border-[#6f9f80]/65 hover:bg-[#d2e5d8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
