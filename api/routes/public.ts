import { Router, type Request, type Response } from 'express'
import type { PublicRegistrationInput } from '../../shared/types/retreat.js'
import {
  generateInstallmentBoletoPdfBuffer,
  getInstallmentBoletoFileName,
} from '../lib/boletoPdf.js'
import { verifyInstallmentBoletoToken } from '../lib/boletoTokens.js'
import {
  createPublicRegistrationRecord,
  getInstallmentBoletoData,
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

router.get('/installments/:installmentId/boleto', async (req: Request, res: Response) => {
  try {
    const installmentId = String(req.params.installmentId || '')
    const token =
      typeof req.query.token === 'string'
        ? req.query.token
        : Array.isArray(req.query.token)
          ? typeof req.query.token[0] === 'string'
            ? req.query.token[0]
            : null
          : null

    if (!verifyInstallmentBoletoToken(installmentId, token)) {
      res.status(403).json({
        success: false,
        error: 'Link de boleto invalido.',
      })
      return
    }

    const boletoData = await getInstallmentBoletoData(installmentId)

    if (boletoData.paymentMethod !== 'boleto') {
      res.status(400).json({
        success: false,
        error: 'Esta parcela não possui boleto disponível.',
      })
      return
    }

    const pdfBuffer = await generateInstallmentBoletoPdfBuffer({
      participantName: boletoData.participantName,
      participantPhone: boletoData.participantPhone,
      participantEmail: boletoData.participantEmail,
      participantChurch: boletoData.participantChurch,
      participantCity: boletoData.participantCity,
      installmentNumber: boletoData.installmentNumber,
      totalInstallments: boletoData.totalInstallments,
      installmentAmount: boletoData.installmentAmount,
      installmentStatus: boletoData.installmentStatus,
      dueDate: boletoData.dueDate,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${getInstallmentBoletoFileName({
        participantName: boletoData.participantName,
        installmentNumber: boletoData.installmentNumber,
        totalInstallments: boletoData.totalInstallments,
        installmentAmount: boletoData.installmentAmount,
        installmentStatus: boletoData.installmentStatus,
        dueDate: boletoData.dueDate,
      })}"`,
    )
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    res.status(200).send(pdfBuffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar boleto',
    })
  }
})

export default router
