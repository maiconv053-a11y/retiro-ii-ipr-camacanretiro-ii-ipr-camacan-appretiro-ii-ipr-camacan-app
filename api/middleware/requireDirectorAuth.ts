import type { Request, Response, NextFunction } from 'express'
import { getDirectorSession } from '../services/authService.js'

export type DirectorRequest = Request & {
  director?: {
    id: string
    name: string
    email: string
  }
}

function extractBearerToken(headerValue: string | undefined) {
  if (!headerValue?.startsWith('Bearer ')) {
    return null
  }

  return headerValue.slice('Bearer '.length).trim()
}

export async function requireDirectorAuth(
  req: DirectorRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = extractBearerToken(req.headers.authorization)

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Acesso restrito a diretoria',
      })
      return
    }

    const director = await getDirectorSession(token)

    if (!director) {
      res.status(401).json({
        success: false,
        error: 'Sessao invalida ou expirada',
      })
      return
    }

    req.director = director
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha na autenticacao',
    })
  }
}
