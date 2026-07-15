import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, RotateCcw } from 'lucide-react'
import {
  getMaxInstallmentsForMethod,
  normalizeInstallmentCount,
  Participant,
  requiresInstallments,
  ParticipantInput,
  PaymentMethod,
  RegistrationStatus,
} from '@shared/types/retreat'
import { formatCurrency, formatIsoDatePtBr, formatPhone } from '@/utils/format'

interface ParticipantFormProps {
  onSubmit: (participant: ParticipantInput) => Promise<void> | void
  initialValues?: ParticipantInput
  participantDetails?: Participant | null
  defaultTotalAmount?: number
  mode?: 'create' | 'edit'
  onCancelEdit?: () => void
  onSendChargeEmail?: (participantId: string, installmentId?: string) => Promise<void> | void
  chargeEmailFeedback?: {
    tone: 'success' | 'error'
    message: string
  } | null
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
  participantDetails,
  defaultTotalAmount = 750,
  mode = 'create',
  onCancelEdit,
  onSendChargeEmail,
  chargeEmailFeedback,
  isSubmitting = false,
}: ParticipantFormProps) {
  const [form, setForm] = useState<ParticipantInput>(() => createInitialState(defaultTotalAmount))
  const [selectedChargeInstallmentId, setSelectedChargeInstallmentId] = useState('')

  useEffect(() => {
    setForm(initialValues ?? createInitialState(defaultTotalAmount))
  }, [defaultTotalAmount, initialValues])

  const pendingInstallments = useMemo(
    () =>
      participantDetails?.financial.installments.filter(
        (installment) => installment.status === 'Pendente',
      ) ?? [],
    [participantDetails],
  )

  useEffect(() => {
    setSelectedChargeInstallmentId(pendingInstallments[0]?.id ?? '')
  }, [participantDetails?.id, pendingInstallments])

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

  async function handleSendChargeEmail() {
    if (!participantDetails || !onSendChargeEmail) {
      return
    }

    try {
      await onSendChargeEmail(participantDetails.id, selectedChargeInstallmentId || undefined)
    } catch {
      return
    }
  }

  const heading = mode === 'edit' ? 'Editar participante' : 'Cadastro de participante'
  const subheading = mode === 'edit' ? 'Edição rápida' : 'Nova inscrição'
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : 'Salvar inscrição'
  const actionLabel = mode === 'edit' ? 'Atualizar participante' : 'Adicionar participante'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[#98c5aa]/50 bg-[#e3f2e7]/96 p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#4f8e6c]">
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
            className="rounded-2xl border border-[#a2c9b1]/55 bg-white/84 p-3 text-slate-700 transition hover:border-[#73a985]/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            aria-label={actionLabel}
            title={actionLabel}
            className="rounded-2xl border border-[#73a985]/60 bg-[#cfe6d7] p-3 text-[#214a34] transition hover:border-[#5f9874]/70 hover:bg-[#c4dfcd] disabled:cursor-not-allowed disabled:opacity-40"
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
                    ? 'border-[#6fa883]/60 bg-[#cfe6d7] text-[#214a34]'
                    : 'border-[#a8ccb6]/45 bg-white/78 text-[#42594d] hover:border-[#79b08f]/60 hover:text-[#20352a]'
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

      {mode === 'edit' && participantDetails ? (
        <div className="mt-6 rounded-[22px] border border-[#a8ccb6]/45 bg-white/82 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                Cobrança manual
              </span>
              <p className="mt-1 text-sm text-[#4c6457]">
                Dispare manualmente o e-mail de cobrança para a parcela pendente do participante.
              </p>
              <p className="mt-2 text-sm text-[#20352a]">
                Destino: {participantDetails.email || 'Sem e-mail cadastrado'}
              </p>
            </div>
            <div className="grid gap-3 md:min-w-[21rem]">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#587264]">
                  Parcela pendente
                </span>
                <select
                  value={selectedChargeInstallmentId}
                  onChange={(event) => setSelectedChargeInstallmentId(event.target.value)}
                  disabled={pendingInstallments.length === 0 || isSubmitting}
                  className="field-surface w-full"
                >
                  {pendingInstallments.length === 0 ? (
                    <option value="">Nenhuma parcela pendente</option>
                  ) : (
                    pendingInstallments.map((installment) => (
                      <option key={installment.id} value={installment.id}>
                        {installment.label} · {formatCurrency(installment.amount)} · vence{' '}
                        {installment.dueDate
                          ? formatIsoDatePtBr(installment.dueDate)
                          : 'a definir'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleSendChargeEmail()}
                disabled={
                  isSubmitting ||
                  !onSendChargeEmail ||
                  !participantDetails.email?.trim() ||
                  pendingInstallments.length === 0
                }
                className="rounded-2xl border border-[#73a985]/60 bg-[#cfe6d7] px-5 py-3 text-sm font-medium text-[#214a34] transition hover:border-[#5f9874]/70 hover:bg-[#c4dfcd] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar e-mail de cobrança'}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {!participantDetails.email?.trim() ? (
              <p className="rounded-2xl border border-rose-300/45 bg-rose-50 px-4 py-3 text-rose-700">
                Cadastre um e-mail no participante para liberar o envio manual da cobrança.
              </p>
            ) : null}
            {pendingInstallments.length === 0 ? (
              <p className="rounded-2xl border border-[#b7d0bf]/45 bg-[#eef5ef] px-4 py-3 text-[#4c6457]">
                Esse participante não possui parcela pendente no momento.
              </p>
            ) : null}
            {chargeEmailFeedback ? (
              <p
                className={`rounded-2xl px-4 py-3 ${
                  chargeEmailFeedback.tone === 'success'
                    ? 'border border-[#79b08f]/55 bg-[#d9ede0] text-[#214a34]'
                    : 'border border-rose-300/45 bg-rose-50 text-rose-700'
                }`}
              >
                {chargeEmailFeedback.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

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
              className="rounded-2xl border border-[#a2c9b1]/55 bg-white/84 px-5 py-3 text-sm font-medium text-[#42594d] transition hover:border-[#73a985]/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-2xl border border-[#73a985]/60 bg-[#cfe6d7] px-5 py-3 text-sm font-medium text-[#214a34] transition hover:border-[#5f9874]/70 hover:bg-[#c4dfcd] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
