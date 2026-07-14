import { LogisticsBoard } from '@/components/logistics/LogisticsBoard'
import { PageTopLogo } from '@/components/ui/PageTopLogo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'

export default function LogisticsPage() {
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
  const addLogisticsTask = useRetreatStore((state) => state.addLogisticsTask)
  const updateLogisticsStatus = useRetreatStore(
    (state) => state.updateLogisticsStatus,
  )
  const deleteLogisticsTask = useRetreatStore((state) => state.deleteLogisticsTask)
  const syncing = useRetreatStore((state) => state.syncing)

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
        onAddTask={addLogisticsTask}
        onStatusChange={updateLogisticsStatus}
        onDeleteTask={handleDeleteTask}
        isSubmitting={syncing}
      />
    </div>
  )
}
