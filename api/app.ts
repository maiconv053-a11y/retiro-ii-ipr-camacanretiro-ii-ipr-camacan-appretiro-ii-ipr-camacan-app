/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import participantsRoutes from './routes/participants.js'
import logisticsRoutes from './routes/logistics.js'
import { requireDirectorAuth } from './middleware/requireDirectorAuth.js'

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/participants', requireDirectorAuth, participantsRoutes)
app.use('/api/logistics', requireDirectorAuth, logisticsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    void req

    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  void req
  void next

  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
