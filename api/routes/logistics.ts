import { Router } from 'express'
import type { Request, Response } from 'express'
import type {
  LogisticsSaleInput,
  LogisticsTaskInput,
  TaskStatus,
} from '../../shared/types/retreat.js'
import {
  createLogisticsSaleRecord,
  createLogisticsTaskRecord,
  deleteLogisticsSaleRecord,
  deleteLogisticsTaskRecord,
  listLogisticsSales,
  listLogisticsTasks,
  updateLogisticsSaleRecord,
  updateLogisticsTaskRecord,
  updateLogisticsTaskStatusRecord,
} from '../services/retreatService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const tasks = await listLogisticsTasks()
    res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar checklist',
    })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body as LogisticsTaskInput
    await createLogisticsTaskRecord(payload)
    const tasks = await listLogisticsTasks()

    res.status(201).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar tarefa logística',
    })
  }
})

router.get('/sales', async (_req: Request, res: Response) => {
  try {
    const sales = await listLogisticsSales()
    res.status(200).json({
      success: true,
      data: sales,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar vendas',
    })
  }
})

router.post('/sales', async (req: Request, res: Response) => {
  try {
    const payload = req.body as LogisticsSaleInput
    await createLogisticsSaleRecord(payload)
    const sales = await listLogisticsSales()

    res.status(201).json({
      success: true,
      data: sales,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar venda',
    })
  }
})

router.patch('/sales/:id', async (req: Request, res: Response) => {
  try {
    const payload = req.body as LogisticsSaleInput
    await updateLogisticsSaleRecord(req.params.id, payload)
    const sales = await listLogisticsSales()

    res.status(200).json({
      success: true,
      data: sales,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar venda',
    })
  }
})

router.delete('/sales/:id', async (req: Request, res: Response) => {
  try {
    await deleteLogisticsSaleRecord(req.params.id)
    const sales = await listLogisticsSales()

    res.status(200).json({
      success: true,
      data: sales,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir venda',
    })
  }
})

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const payload = req.body as LogisticsTaskInput
    await updateLogisticsTaskRecord(req.params.id, payload)
    const tasks = await listLogisticsTasks()

    res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar tarefa logística',
    })
  }
})

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const payload = req.body as { status: TaskStatus }
    await updateLogisticsTaskStatusRecord(req.params.id, payload.status)
    const tasks = await listLogisticsTasks()

    res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar status da tarefa',
    })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteLogisticsTaskRecord(req.params.id)
    const tasks = await listLogisticsTasks()

    res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir tarefa logística',
    })
  }
})

export default router
