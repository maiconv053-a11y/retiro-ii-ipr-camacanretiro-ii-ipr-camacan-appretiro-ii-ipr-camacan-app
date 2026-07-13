import { Router } from 'express'
import type { Request, Response } from 'express'
import type { LogisticsTaskInput, TaskStatus } from '../../shared/types/retreat.js'
import {
  createLogisticsTaskRecord,
  listLogisticsTasks,
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

export default router
