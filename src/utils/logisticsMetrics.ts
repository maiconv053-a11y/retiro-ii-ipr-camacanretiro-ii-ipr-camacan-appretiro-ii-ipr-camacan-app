import type { LogisticsSale, LogisticsTask, Participant } from '@shared/types/retreat'

export function getLogisticsBaseGoalAmount(tasks: LogisticsTask[]) {
  return tasks.reduce(
    (sum, task) => sum + (task.actualCost > 0 ? task.actualCost : task.estimatedCost),
    0,
  )
}

export function getLogisticsSalesRevenue(sales: LogisticsSale[]) {
  return sales.reduce((sum, sale) => sum + sale.revenueAmount, 0)
}

export function getLogisticsSalesExpense(sales: LogisticsSale[]) {
  return sales.reduce((sum, sale) => sum + sale.expenseAmount, 0)
}

export function getLogisticsSalesProfit(sales: LogisticsSale[]) {
  return getLogisticsSalesRevenue(sales) - getLogisticsSalesExpense(sales)
}

export function getLogisticsSalesPaidAmount(sales: LogisticsSale[]) {
  return Math.max(getLogisticsSalesProfit(sales), 0)
}

export function getLogisticsCoveredAmount(
  participants: Participant[],
  sales: LogisticsSale[],
) {
  return getCollectedAmount(participants) + getLogisticsSalesPaidAmount(sales)
}

export function getActiveParticipants(participants: Participant[]) {
  return participants.filter((participant) => participant.registrationStatus !== 'Cancelada')
}

export function getCollectedAmount(participants: Participant[]) {
  return getActiveParticipants(participants).reduce(
    (sum, participant) => sum + participant.financial.amountPaid,
    0,
  )
}

export function getExpectedAmount(participants: Participant[]) {
  return getActiveParticipants(participants).reduce(
    (sum, participant) => sum + participant.financial.totalAmount,
    0,
  )
}
