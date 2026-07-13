import crypto from 'node:crypto'
import type {
  DirectorLoginInput,
  DirectorRegisterInput,
  DirectorSession,
  DirectorUser,
} from '../../shared/types/retreat.js'
import { assertSupabase } from '../lib/supabase.js'

type DirectorUserRow = {
  id: string
  nome: string
  email: string
  senha_hash: string
  ativo: boolean
}

type SessionPayload = {
  sub: string
  email: string
  name: string
  exp: number
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 12
const sessionSecret = process.env.AUTH_SESSION_SECRET || 'dev-director-session-secret'
const setupSecret = process.env.DIRECTOR_SETUP_SECRET || ''

function toDirectorUser(row: DirectorUserRow): DirectorUser {
  return {
    id: row.id,
    name: row.nome,
    email: row.email,
  }
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function createPasswordHash(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derivedKey}`
}

function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split('$')

  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    return false
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(derivedKey), Buffer.from(storedHash))
}

function signSessionToken(payload: SessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = toBase64Url(
    crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest(),
  )

  return `${encodedPayload}.${signature}`
}

function decodeSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = toBase64Url(
    crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest(),
  )

  if (signature !== expectedSignature) {
    return null
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload

  if (payload.exp <= Date.now()) {
    return null
  }

  return payload
}

async function findDirectorByEmail(email: string) {
  const supabase = assertSupabase()
  const { data, error } = await supabase
    .from('diretoria_usuarios')
    .select('id, nome, email, senha_hash, ativo')
    .eq('email', email.toLowerCase())
    .eq('ativo', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as DirectorUserRow | null
}

export async function loginDirector(input: DirectorLoginInput): Promise<DirectorSession> {
  const director = await findDirectorByEmail(input.email)

  if (!director || !verifyPassword(input.password, director.senha_hash)) {
    throw new Error('Email ou senha invalidos')
  }

  const user = toDirectorUser(director)
  const token = signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + SESSION_DURATION_MS,
  })

  const supabase = assertSupabase()
  await supabase
    .from('diretoria_usuarios')
    .update({
      ultimo_login_em: new Date().toISOString(),
    })
    .eq('id', user.id)

  return {
    token,
    user,
  }
}

export async function registerDirector(input: DirectorRegisterInput): Promise<DirectorUser> {
  if (!setupSecret || input.setupSecret !== setupSecret) {
    throw new Error('Cadastro da diretoria nao autorizado')
  }

  const supabase = assertSupabase()
  const existingDirector = await findDirectorByEmail(input.email)

  if (existingDirector) {
    throw new Error('Ja existe um usuario da diretoria com este email')
  }

  const { data, error } = await supabase
    .from('diretoria_usuarios')
    .insert({
      nome: input.name,
      email: input.email.toLowerCase(),
      senha_hash: createPasswordHash(input.password),
      ativo: true,
    })
    .select('id, nome, email, senha_hash, ativo')
    .single()

  if (error) {
    throw error
  }

  return toDirectorUser(data as DirectorUserRow)
}

export async function getDirectorSession(token: string): Promise<DirectorUser | null> {
  const payload = decodeSessionToken(token)

  if (!payload) {
    return null
  }

  const director = await findDirectorByEmail(payload.email)

  if (!director) {
    return null
  }

  return toDirectorUser(director)
}
