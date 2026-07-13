import { useMemo, useState, type FormEvent } from 'react'
import { ClipboardPlus } from 'lucide-react'
import type { LogisticsTask, LogisticsTaskInput, TaskStatus } from '@shared/types/retreat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'

interface LogisticsBoardProps {
  tasks: LogisticsTask[]
  onAddTask: (task: LogisticsTaskInput) => Promise<void> | void
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void> | void
  isSubmitting?: boolean
}

const initialTask: LogisticsTaskInput = {
  category: 'Compras',
  title: '',
  owner: '',
  estimatedCost: 0,
  actualCost: 0,
  status: 'Pendente',
  notes: '',
}

const statusOptions: TaskStatus[] = ['Pendente', 'EmAndamento', 'Concluida']

const statusTone = {
  Pendente: 'amber',
  EmAndamento: 'cyan',
  Concluida: 'green',
} as const

export function LogisticsBoard({
  tasks,
  onAddTask,
  onStatusChange,
  isSubmitting = false,
}: LogisticsBoardProps) {
  const [form, setForm] = useState<LogisticsTaskInput>(initialTask)

  const groupedTasks = useMemo(
    () => ({
      Compras: tasks.filter((task) => task.category === 'Compras'),
      Contratos: tasks.filter((task) => task.category === 'Contratos'),
    }),
    [tasks],
  )

  function updateField<Key extends keyof LogisticsTaskInput>(
    field: Key,
    value: LogisticsTaskInput[Key],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim() || !form.owner.trim()) {
      return
    }

    try {
      await onAddTask({
        ...form,
        title: form.title.trim(),
        owner: form.owner.trim(),
        notes: form.notes.trim(),
      })
    } catch {
      return
    }

    setForm(initialTask)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-title text-[10px] uppercase tracking-[0.24em] text-cyan-300/58">
              Controle operacional
            </p>
            <h2 className="mt-2 font-title text-xl text-white">Nova tarefa</h2>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Adicionar tarefa"
            title="Adicionar tarefa"
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3 text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ClipboardPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(['Compras', 'Contratos'] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => updateField('category', category)}
                className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.2em] transition ${
                  form.category === category
                    ? 'border-cyan-400/24 bg-cyan-400/8 text-cyan-100'
                    : 'border-white/10 bg-white/[0.02] text-slate-500 hover:border-white/16 hover:text-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="field-surface"
            placeholder="Nome da tarefa ou contrato"
          />
          <input
            value={form.owner}
            onChange={(event) => updateField('owner', event.target.value)}
            className="field-surface"
            placeholder="Responsável"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              value={form.estimatedCost}
              onChange={(event) =>
                updateField('estimatedCost', Number(event.target.value))
              }
              className="field-surface"
              placeholder="Valor estimado"
            />
            <input
              type="number"
              value={form.actualCost}
              onChange={(event) => updateField('actualCost', Number(event.target.value))}
              className="field-surface"
              placeholder="Valor gasto"
            />
          </div>

          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={4}
            className="field-surface"
            placeholder="Observações e detalhes"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl border border-violet-400/20 bg-violet-400/8 px-5 py-3 text-sm font-medium text-violet-100 transition hover:border-violet-400/30 hover:bg-violet-400/12"
          >
            {isSubmitting ? 'Salvando...' : 'Adicionar ao checklist'}
          </button>
        </div>
      </form>

      <div className="grid gap-6">
        {(['Compras', 'Contratos'] as const).map((category) => (
          <section
            key={category}
            className="rounded-[24px] border border-white/10 bg-[#08111f]/88 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-title text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  {category === 'Compras' ? 'Mercado e materiais' : 'Fornecedores e acordos'}
                </p>
                <h3 className="mt-2 font-title text-xl text-white">{category}</h3>
              </div>
              <div className="text-right text-sm text-slate-400">
                <p>
                  Estimado:{' '}
                  {formatCurrency(
                    groupedTasks[category].reduce(
                      (sum, task) => sum + task.estimatedCost,
                      0,
                    ),
                  )}
                </p>
                <p className="mt-1">
                  Gasto:{' '}
                  {formatCurrency(
                    groupedTasks[category].reduce(
                      (sum, task) => sum + task.actualCost,
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {groupedTasks[category].map((task) => (
                <article
                  key={task.id}
                className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-medium text-white">{task.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">
                        Responsável: {task.owner}
                      </p>
                      <p className="mt-3 text-sm text-slate-400">{task.notes}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <StatusBadge
                        label={
                          task.status === 'EmAndamento'
                            ? 'Em andamento'
                            : task.status === 'Concluida'
                              ? 'Concluída'
                              : 'Pendente'
                        }
                        tone={statusTone[task.status]}
                      />
                      <select
                        value={task.status}
                        onChange={(event) =>
                          void Promise.resolve(
                            onStatusChange(task.id, event.target.value as TaskStatus),
                          ).catch(() => undefined)
                        }
                        disabled={isSubmitting}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                    <p>Estimado: {formatCurrency(task.estimatedCost)}</p>
                    <p>Gasto: {formatCurrency(task.actualCost)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
