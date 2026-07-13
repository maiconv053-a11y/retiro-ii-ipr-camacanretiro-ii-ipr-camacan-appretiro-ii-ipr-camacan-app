import { Router, type Request, type Response } from 'express'
import type { PublicRegistrationInput } from '../../shared/types/retreat.js'
import { createPublicRegistrationRecord } from '../services/retreatService.js'

const router = Router()

router.post('/registrations', async (req: Request, res: Response) => {
  try {
    await createPublicRegistrationRecord(req.body as PublicRegistrationInput)

    res.status(201).json({
      success: true,
      data: {
        created: true,
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
