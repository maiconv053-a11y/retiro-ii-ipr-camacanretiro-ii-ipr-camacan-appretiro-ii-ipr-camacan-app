import { Router, type Request, type Response } from 'express'
import type { PublicRegistrationInput } from '../../shared/types/retreat.js'
import {
  createPublicRegistrationRecord,
  getRetreatSettings,
} from '../services/retreatService.js'

const router = Router()

router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await getRetreatSettings()
    res.status(200).json({
      success: true,
      data: settings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar configuracoes publicas',
    })
  }
})

router.post('/registrations', async (req: Request, res: Response) => {
  try {
    const summary = await createPublicRegistrationRecord(req.body as PublicRegistrationInput)

    res.status(201).json({
      success: true,
      data: {
        summary,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar inscricao publica',
    })
  }
})

export default router
