import { Router, type Request, type Response } from 'express'
import { getRetreatSettings, listParticipants, updateRetreatFee } from '../services/retreatService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await getRetreatSettings()
    res.status(200).json({
      success: true,
      data: settings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar configuracoes do retiro',
    })
  }
})

router.patch('/retreat-fee', async (req: Request, res: Response) => {
  try {
    const retreatFee = Number(req.body?.retreatFee)

    if (!Number.isFinite(retreatFee) || retreatFee <= 0) {
      res.status(400).json({
        success: false,
        error: 'Informe um valor valido para o retiro',
      })
      return
    }

    const settings = await updateRetreatFee(retreatFee)
    const participants = await listParticipants()

    res.status(200).json({
      success: true,
      data: {
        settings,
        participants,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar valor do retiro',
    })
  }
})

export default router
