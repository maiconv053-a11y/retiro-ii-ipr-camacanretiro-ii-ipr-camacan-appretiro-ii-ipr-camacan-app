import { useState } from 'react'
import { LogisticsBoard } from '@/components/logistics/LogisticsBoard'
import { PageTopLogo } from '@/components/ui/PageTopLogo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'
import type { LogisticsTask, LogisticsTaskInput } from '@shared/types/retreat'

export default function LogisticsPage() {
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
  const addLogisticsTask = useRetreatStore((state) => state.addLogisticsTask)
  const updateLogisticsTask = useRetreatStore((state) => state.updateLogisticsTask)
  const updateLogisticsStatus = useRetreatStore(
    (state) => state.updateLogisticsStatus,
  )
  const deleteLogisticsTask = useRetreatStore((state) => state.deleteLogisticsTask)
  const syncing = useRetreatStore((state) => state.syncing)
  const [editingTask, setEditingTask] = useState<LogisticsTask | null>(null)

  const completedTasks = logisticsTasks.filter(
    (task) => task.status === 'Concluida',
  ).length

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
    </div>
  )
}
