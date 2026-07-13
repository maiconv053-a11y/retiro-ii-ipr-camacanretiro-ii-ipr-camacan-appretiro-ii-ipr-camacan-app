import { LogisticsBoard } from '@/components/logistics/LogisticsBoard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useRetreatStore } from '@/store/retreatStore'

export default function LogisticsPage() {
  const logisticsTasks = useRetreatStore((state) => state.logisticsTasks)
  const addLogisticsTask = useRetreatStore((state) => state.addLogisticsTask)
  const updateLogisticsStatus = useRetreatStore(
    (state) => state.updateLogisticsStatus,
  )
  const syncing = useRetreatStore((state) => state.syncing)

  const completedTasks = logisticsTasks.filter(
    (task) => task.status === 'Concluida',
  ).length

  return (
    <div className="space-y-6">
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
        isSubmitting={syncing}
      />
    </div>
  )
}
