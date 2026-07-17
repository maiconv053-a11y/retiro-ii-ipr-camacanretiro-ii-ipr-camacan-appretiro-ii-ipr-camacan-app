import { useState } from 'react'
import { LogisticsBoard } from '@/components/logistics/LogisticsBoard'
import { SalesBoard } from '@/components/logistics/SalesBoard'
import { GoalProgressCard } from '@/components/ui/GoalProgressCard'
import { PageTopLogo } from '@/components/ui/PageTopLogo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'
import { formatCurrency } from '@/utils/format'
import {
  getCollectedAmount,
  getExpectedAmount,
  getLogisticsBaseGoalAmount,
  getLogisticsCoveredAmount,
  getLogisticsSalesExpense,
  getLogisticsSalesProfit,
  getLogisticsSalesRevenue,
} from '@/utils/logisticsMetrics'
import type {
  LogisticsSaleInput,
  LogisticsTask,
  LogisticsTaskInput,
} from '@shared/types/retreat'

export default function LogisticsPage() {
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
  const logisticsSales = useRetreatStore((state) => state.logisticsSales)
  const participants = useRetreatStore((state) => state.participants)
  const addLogisticsTask = useRetreatStore((state) => state.addLogisticsTask)
  const updateLogisticsTask = useRetreatStore((state) => state.updateLogisticsTask)
  const updateLogisticsStatus = useRetreatStore(
    (state) => state.updateLogisticsStatus,
  )
  const deleteLogisticsTask = useRetreatStore((state) => state.deleteLogisticsTask)
  const addLogisticsSale = useRetreatStore((state) => state.addLogisticsSale)
  const updateLogisticsSale = useRetreatStore((state) => state.updateLogisticsSale)
  const deleteLogisticsSale = useRetreatStore((state) => state.deleteLogisticsSale)
  const syncing = useRetreatStore((state) => state.syncing)
  const [editingTask, setEditingTask] = useState<LogisticsTask | null>(null)
  const [activeView, setActiveView] = useState<'checklist' | 'vendas'>('checklist')

  const completedTasks = logisticsTasks.filter(
    (task) => task.status === 'Concluida',
  ).length
  const logisticsBaseGoalAmount = getLogisticsBaseGoalAmount(logisticsTasks)
  const salesRevenueAmount = getLogisticsSalesRevenue(logisticsSales)
  const salesExpenseAmount = getLogisticsSalesExpense(logisticsSales)
  const salesProfitAmount = getLogisticsSalesProfit(logisticsSales)
  const totalCollected = getCollectedAmount(participants)
  const totalCoveredAmount = getLogisticsCoveredAmount(participants, logisticsSales)
  const totalExpected = getExpectedAmount(participants)
  const totalPendingAmount = Math.max(totalExpected - totalCollected, 0)

  async function handleDeleteTask(taskId: string, taskTitle: string) {
    const confirmed = window.confirm(
      `Deseja excluir "${taskTitle}" do checklist? Essa ação não pode ser desfeita.`,
    )

    if (!confirmed) {
      return
    }

    await deleteLogisticsTask(taskId)

    if (editingTask?.id === taskId) {
      setEditingTask(null)
    }
  }

  function mapTaskToInput(task: LogisticsTask): LogisticsTaskInput {
    return {
      category: task.category,
      title: task.title,
      owner: task.owner,
      estimatedCost: task.estimatedCost,
      actualCost: task.actualCost,
      status: task.status,
      notes: task.notes,
    }
  }

  async function handleSubmitTask(task: LogisticsTaskInput) {
    if (editingTask) {
      await updateLogisticsTask(editingTask.id, task)
      setEditingTask(null)
      return
    }

    await addLogisticsTask(task)
  }

  async function handleSubmitSale(sale: LogisticsSaleInput) {
    await addLogisticsSale(sale)
  }

  return (
    <div className="space-y-6">
      <PageTopLogo />
      <SectionHeader
        eyebrow="Módulo 3"
        title="Checklist e logística da organização"
        description="Acompanhe compras, contratos e grandes pagamentos com sinalização digital luminosa para cada etapa do retiro."
        action={
          <StatusBadge
            label={`${completedTasks}/${logisticsTasks.length} concluídas`}
            tone="cyan"
          />
        }
      />

      <GoalProgressCard
        eyebrow="Cobertura financeira"
        title="Meta de logística (gasto) x inscrições"
        description="A meta continua sendo o total de compras e contratos. Nas vendas, o sistema desconta os gastos da entrada e considera o valor líquido como pago, porque esse dinheiro já está em caixa."
        goalAmount={logisticsBaseGoalAmount}
        paidAmount={totalCoveredAmount}
        pendingAmount={totalPendingAmount}
      />

      <section className="rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-title text-[10px] uppercase tracking-[0.24em] text-[#6a957d]">
              Abatimento das metas
            </p>
            <h2 className="mt-2 font-title text-xl text-[#20352a]">
              Custos, vendas e lucro líquido
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveView('checklist')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeView === 'checklist'
                  ? 'bg-[#6f9f80] text-white'
                  : 'border border-[#aac4b3]/60 text-[#345041] hover:bg-white/70'
              }`}
            >
              Checklist
            </button>
            <button
              type="button"
              onClick={() => setActiveView('vendas')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeView === 'vendas'
                  ? 'bg-[#6f9f80] text-white'
                  : 'border border-[#aac4b3]/60 text-[#345041] hover:bg-white/70'
              }`}
            >
              Vendas
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Meta bruta</p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(logisticsBaseGoalAmount)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Entradas</p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(salesRevenueAmount)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">Saídas</p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(salesExpenseAmount)}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c7ded0]/40 bg-white/75 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#567262]">
              Lucro em caixa
            </p>
            <p className="mt-1 text-base font-medium text-[#20352a]">
              {formatCurrency(salesProfitAmount)}
            </p>
          </div>
        </div>
      </section>

      {activeView === 'checklist' ? (
        <LogisticsBoard
          tasks={logisticsTasks}
          onAddTask={handleSubmitTask}
          onEditTask={setEditingTask}
          onStatusChange={updateLogisticsStatus}
          onDeleteTask={handleDeleteTask}
          editingTask={editingTask ? mapTaskToInput(editingTask) : null}
          onCancelEdit={() => setEditingTask(null)}
          isSubmitting={syncing}
        />
      ) : (
        <SalesBoard
          sales={logisticsSales}
          onAddSale={handleSubmitSale}
          onEditSale={updateLogisticsSale}
          onDeleteSale={deleteLogisticsSale}
        />
      )}
    </div>
  )
}
