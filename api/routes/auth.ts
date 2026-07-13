import { Router, type Request, type Response } from 'express'
import type {
  DirectorLoginInput,
  DirectorRegisterInput,
} from '../../shared/types/retreat.js'
import {
  getDirectorSession,
  loginDirector,
  registerDirector,
} from '../services/authService.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const director = await registerDirector(req.body as DirectorRegisterInput)

    res.status(201).json({
      success: true,
      data: director,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao cadastrar diretor',
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await loginDirector(req.body as DirectorLoginInput)

    res.status(200).json({
      success: true,
      data: session,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha no login',
    })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authorization = req.headers.authorization
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : ''
    const director = token ? await getDirectorSession(token) : null

    if (!director) {
      res.status(401).json({
        success: false,
        error: 'Sessao invalida ou expirada',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: director,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao validar sessao',
    })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  void req
  res.status(200).json({
    success: true,
    data: {
      loggedOut: true,
    },
  })
})

export default router
