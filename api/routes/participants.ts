import { Router } from 'express'
import type { Request, Response } from 'express'
import type { FinancialUpdate, ParticipantInput } from '../../shared/types/retreat.js'
import {
  createParticipantRecord,
  listParticipants,
  updateParticipantFinancialRecord,
  updateParticipantRecord,
} from '../services/retreatService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const participants = await listParticipants()
    res.status(200).json({
      success: true,
      data: participants,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar participantes',
    })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body as ParticipantInput
    await createParticipantRecord(payload)
    const participants = await listParticipants()

    res.status(201).json({
      success: true,
      data: participants,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar participante',
    })
  }
})

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const payload = req.body as ParticipantInput & { currentAmountPaid?: number }
    await updateParticipantRecord(
      req.params.id,
      payload,
      payload.currentAmountPaid ?? 0,
    )
    const participants = await listParticipants()

    res.status(200).json({
      success: true,
      data: participants,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar participante',
    })
  }
})

router.patch('/:id/financial', async (req: Request, res: Response) => {
  try {
    const payload = req.body as FinancialUpdate
    await updateParticipantFinancialRecord(req.params.id, payload)
    const participants = await listParticipants()

    res.status(200).json({
      success: true,
      data: participants,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar financeiro',
    })
  }
})

export default router
