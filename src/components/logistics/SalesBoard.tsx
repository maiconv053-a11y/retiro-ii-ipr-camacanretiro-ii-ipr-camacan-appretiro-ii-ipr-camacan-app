import { useMemo, useState, type FormEvent } from 'react'
import type { LogisticsSale, LogisticsSaleInput } from '@shared/types/retreat'
import { formatCurrency } from '@/utils/format'

type SalesBoardProps = {
  sales: LogisticsSale[]
  onAddSale: (sale: LogisticsSaleInput) => Promise<void>
  onEditSale: (saleId: string, sale: LogisticsSaleInput) => Promise<void>
  onDeleteSale: (saleId: string) => Promise<void>
}

type SaleFormState = LogisticsSaleInput

const EMPTY_FORM: SaleFormState = {
  saleDate: '',
  itemSold: '',
  revenueAmount: 0,
  expenseAmount: 0,
}

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateIso}T00:00:00`))
}

export function SalesBoard({
  sales,
  onAddSale,
  onEditSale,
  onDeleteSale,
}: SalesBoardProps) {
  const [form, setForm] = useState<SaleFormState>(EMPTY_FORM)
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const sortedSales = useMemo(
    () =>
      [...sales].sort((a, b) => {
        if (a.saleDate === b.saleDate) {
          return a.itemSold.localeCompare(b.itemSold)
        }

        return b.saleDate.localeCompare(a.saleDate)
      }),
    [sales],
  )

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenueAmount, 0)
  const totalExpense = sales.reduce((sum, sale) => sum + sale.expenseAmount, 0)
  const totalProfit = totalRevenue - totalExpense

  function updateField<Key extends keyof SaleFormState>(field: Key, value: SaleFormState[Key]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingSaleId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const payload = {
        saleDate: form.saleDate,
        itemSold: form.itemSold.trim(),
        revenueAmount: Number(form.revenueAmount || 0),
        expenseAmount: Number(form.expenseAmount || 0),
      }

      if (editingSaleId) {
        await onEditSale(editingSaleId, payload)
        setFeedback('Venda atualizada com sucesso.')
      } else {
        await onAddSale(payload)
        setFeedback('Venda cadastrada com sucesso.')
      }

      resetForm()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao salvar venda.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(sale: LogisticsSale) {
    setEditingSaleId(sale.id)
    setForm({
      saleDate: sale.saleDate,
      itemSold: sale.itemSold,
      revenueAmount: sale.revenueAmount,
      expenseAmount: sale.expenseAmount,
    })
    setFeedback(null)
  }

  async function handleDelete(saleId: string) {
    setFeedback(null)

    try {
      await onDeleteSale(saleId)
      if (editingSaleId === saleId) {
        resetForm()
      }
      setFeedback('Venda removida com sucesso.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao excluir venda.')
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#6a957d]">
                Vendas
              </p>
              <h2 className="mt-2 font-title text-xl text-[#20352a]">
                Registrar entrada e gasto
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#42594d]">
                O sistema calcula automaticamente o lucro de cada venda e abate esse valor das
                metas do retiro.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-[#345041]">
              <span>Data da venda</span>
              <input
                type="date"
                value={form.saleDate}
                onChange={(event) => updateField('saleDate', event.target.value)}
                required
                className="rounded-[16px] border border-[#b7d0bf]/50 bg-white px-4 py-3 text-[#20352a] outline-none transition focus:border-[#6f9f80]"
              />
            </label>

            <label className="grid gap-2 text-sm text-[#345041]">
              <span>O que foi vendido</span>
              <input
                type="text"
                value={form.itemSold}
                onChange={(event) => updateField('itemSold', event.target.value)}
                placeholder="Ex.: trufas, rifa, camisas"
                required
                className="rounded-[16px] border border-[#b7d0bf]/50 bg-white px-4 py-3 text-[#20352a] outline-none transition focus:border-[#6f9f80]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#345041]">
                <span>Valor vendido</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.revenueAmount)}
                  onChange={(event) =>
                    updateField('revenueAmount', Number(event.target.value || 0))
                  }
                  required
                  className="rounded-[16px] border border-[#b7d0bf]/50 bg-white px-4 py-3 text-[#20352a] outline-none transition focus:border-[#6f9f80]"
                />
              </label>

              <label className="grid gap-2 text-sm text-[#345041]">
                <span>Quanto gastamos</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.expenseAmount)}
                  onChange={(event) =>
                    updateField('expenseAmount', Number(event.target.value || 0))
                  }
                  required
                  className="rounded-[16px] border border-[#b7d0bf]/50 bg-white px-4 py-3 text-[#20352a] outline-none transition focus:border-[#6f9f80]"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#c7ded0]/40 bg-white/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">
              Lucro desta venda
            </p>
            <p className="mt-1 text-lg font-medium text-[#20352a]">
              {formatCurrency(form.revenueAmount - form.expenseAmount)}
            </p>
          </div>

          {feedback ? <p className="mt-4 text-sm text-[#345041]">{feedback}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#6f9f80] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#628f72] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingSaleId ? 'Salvar venda' : 'Cadastrar venda'}
            </button>
            {editingSaleId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#aac4b3]/60 px-5 py-3 text-sm font-medium text-[#345041] transition hover:bg-white/70"
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>

        <div className="rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-6">
          <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#6a957d]">
            Resumo de vendas
          </p>
          <h2 className="mt-2 font-title text-xl text-[#20352a]">Entradas, saídas e lucro</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Entradas</p>
              <p className="mt-1 text-base font-medium text-[#20352a]">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Saídas</p>
              <p className="mt-1 text-base font-medium text-[#20352a]">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Lucro</p>
              <p className="mt-1 text-base font-medium text-[#20352a]">
                {formatCurrency(totalProfit)}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {sortedSales.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#b7d0bf]/60 bg-white/65 px-4 py-6 text-sm text-[#567262]">
                Nenhuma venda cadastrada ainda.
              </div>
            ) : (
              sortedSales.map((sale) => {
                const profit = sale.revenueAmount - sale.expenseAmount

                return (
                  <article
                    key={sale.id}
                    className="rounded-[20px] border border-[#c7ded0]/40 bg-white/78 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">
                          {formatDate(sale.saleDate)}
                        </p>
                        <h3 className="mt-1 font-title text-lg text-[#20352a]">
                          {sale.itemSold}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#42594d]">
                          <span>Entrou {formatCurrency(sale.revenueAmount)}</span>
                          <span>Gastou {formatCurrency(sale.expenseAmount)}</span>
                          <span>Lucro {formatCurrency(profit)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(sale)}
                          className="rounded-full border border-[#aac4b3]/60 px-4 py-2 text-sm font-medium text-[#345041] transition hover:bg-[#edf4ee]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(sale.id)}
                          className="rounded-full border border-[#e0c8c8]/70 px-4 py-2 text-sm font-medium text-[#8d4f4f] transition hover:bg-[#fff3f3]"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
