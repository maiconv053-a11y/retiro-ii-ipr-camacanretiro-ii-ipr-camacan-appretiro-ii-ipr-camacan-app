import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { jsPDF } from 'jspdf'

const PIX_KEY = '(73) 982313389'
const DEFAULT_PUBLIC_SITE_URL = 'https://retiro-ii-ipr-camacanretiro-ii-ipr.vercel.app'
const DEFAULT_LOGO_URL =
  'https://raw.githubusercontent.com/maiconv053-a11y/retiro-ii-ipr-camacanretiro-ii-ipr-camacan-appretiro-ii-ipr-camacan-app/main/public/logo-retiro.png'

const PAGE_COLORS = {
  background: [238, 245, 239],
  cardBorder: [167, 197, 179],
  softBorder: [199, 220, 206],
  title: [32, 53, 42],
  text: [67, 93, 81],
  muted: [95, 122, 109],
  accent: [74, 139, 99],
  accentSoft: [220, 235, 226],
  gold: [195, 178, 118],
  white: [247, 251, 248],
}

let logoDataUrlPromise = null

function getBoletoTokenSecret() {
  return process.env.BOLETO_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function createDigest(installmentId, secret) {
  return crypto.createHmac('sha256', secret).update(`boleto:${installmentId}`).digest('hex')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

function formatDueDate(date) {
  if (!date) {
    return 'A definir'
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function sanitizeFileName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

async function loadImageAsDataUrl(src) {
  const response = await fetch(src)

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a imagem da logo')
  }

  const mimeType = response.headers.get('content-type') || 'image/png'
  const bytes = Buffer.from(await response.arrayBuffer())
  return `data:${mimeType};base64,${bytes.toString('base64')}`
}

async function getLogoDataUrl() {
  if (!logoDataUrlPromise) {
    const logoUrl = process.env.EMAIL_LOGO_URL || DEFAULT_LOGO_URL
    logoDataUrlPromise = loadImageAsDataUrl(logoUrl).catch(() => null)
  }

  return logoDataUrlPromise
}

function drawRoundedLabel(pdf, text, x, y, width, height) {
  pdf.setFillColor(...PAGE_COLORS.accent)
  pdf.roundedRect(x, y, width, height, 2.5, 2.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...PAGE_COLORS.white)
  pdf.text(text, x + width / 2, y + height / 2 + 1.2, { align: 'center' })
}

function drawCard(pdf, x, y, width, height) {
  pdf.setDrawColor(...PAGE_COLORS.cardBorder)
  pdf.setFillColor(255, 255, 255)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(x, y, width, height, 3.5, 3.5, 'FD')
}

function drawParticipantRow(pdf, label, value, x, y, width, height, labelWidth = 25) {
  const safeValue = String(value || '').trim() || '-'
  const valueLines = pdf
    .splitTextToSize(safeValue, Math.max(width - labelWidth - 10, 12))
    .slice(0, 2)

  pdf.setDrawColor(...PAGE_COLORS.softBorder)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(x, y, width, height, 2.5, 2.5, 'FD')

  pdf.setFillColor(...PAGE_COLORS.accentSoft)
  pdf.roundedRect(x + 2, y + 2, labelWidth, height - 4, 1.8, 1.8, 'F')
  pdf.setDrawColor(...PAGE_COLORS.softBorder)
  pdf.line(x + labelWidth + 4, y + 2.5, x + labelWidth + 4, y + height - 2.5)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.2)
  pdf.setTextColor(...PAGE_COLORS.muted)
  pdf.text(label, x + 2 + labelWidth / 2, y + height / 2 + 0.7, {
    align: 'center',
  })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(valueLines.length > 1 ? 8 : 9)
  pdf.setTextColor(...PAGE_COLORS.text)
  pdf.text(valueLines, x + labelWidth + 7, y + (valueLines.length > 1 ? 5.4 : height / 2 + 0.7))
}

function drawMetricCard(pdf, label, value, x, y, width, height) {
  drawCard(pdf, x, y, width, height)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.4)
  pdf.setTextColor(...PAGE_COLORS.muted)
  pdf.text(label, x + width / 2, y + 7, { align: 'center' })

  const lines = pdf.splitTextToSize(value, Math.max(width - 10, 10)).slice(0, 2)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(lines.length > 1 ? 9 : 10.5)
  pdf.setTextColor(...PAGE_COLORS.text)
  pdf.text(lines, x + width / 2, y + 15, { align: 'center' })
}

function drawCenteredTextBlock(pdf, text, x, y, width, fontSize, color) {
  const lines = pdf.splitTextToSize(text, width)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(fontSize)
  pdf.setTextColor(...color)
  pdf.text(lines, x + width / 2, y, { align: 'center' })
}

export function buildInstallmentBoletoUrl(installmentId) {
  const secret = getBoletoTokenSecret()

  if (!secret) {
    throw new Error('Segredo do link de boleto nao configurado.')
  }

  const baseUrl = process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL
  const token = createDigest(installmentId, secret)
  const url = new URL(`/api/public/installments/${installmentId}/boleto`, baseUrl)
  url.searchParams.set('token', token)
  return url.toString()
}

export function getInstallmentBoletoFileName(context) {
  const safeParticipantName = sanitizeFileName(context.participantName || 'participante')
  return `boleto-parcela-${context.installmentNumber}-${safeParticipantName}.pdf`
}

export async function createInstallmentBoletoAttachment(context) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const logoDataUrl = await getLogoDataUrl()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentX = margin
  const contentY = 12
  const contentW = pageWidth - margin * 2
  const topRowH = 82
  const gap = 6
  const logoW = 60
  const rightW = contentW - logoW - gap
  const logoX = contentX
  const headerX = logoX + logoW + gap
  const participantCardY = contentY + 18
  const participantCardH = topRowH - 18
  const participantInnerX = headerX + 5
  const participantInnerW = rightW - 10
  const halfGap = 4
  const halfW = (participantInnerW - halfGap) / 2
  const nameRowH = 15
  const infoRowH = 11
  const summaryY = contentY + topRowH + 6
  const summaryH = 23
  const summaryGap = 4
  const summaryW = (contentW - summaryGap * 2) / 3
  const pixY = summaryY + summaryH + 8
  const pixH = 66
  const instructionsX = contentX + 7
  const instructionsW = 52
  const qrBoxX = instructionsX + instructionsW + 4
  const qrBoxY = pixY + 13
  const qrBoxSize = 36
  const separatorX = qrBoxX + qrBoxSize + 7
  const keyAreaX = separatorX + 7
  const keyAreaW = contentX + contentW - keyAreaX - 7
  const footerY = pixY + pixH + 8
  const footerH = 18

  pdf.setFillColor(...PAGE_COLORS.background)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  drawCard(pdf, logoX, contentY, logoW, topRowH)

  if (logoDataUrl) {
    const logoRenderWidth = logoW - 14
    const logoRenderHeight = 50
    const logoRenderX = logoX + (logoW - logoRenderWidth) / 2
    const logoRenderY = contentY + (topRowH - logoRenderHeight) / 2

    pdf.addImage(logoDataUrl, 'PNG', logoRenderX, logoRenderY, logoRenderWidth, logoRenderHeight)
  }

  pdf.setDrawColor(...PAGE_COLORS.gold)
  pdf.setLineWidth(0.4)
  pdf.line(headerX + 2, contentY + 7, headerX + 24, contentY + 7)
  pdf.line(headerX + rightW - 24, contentY + 7, headerX + rightW - 2, contentY + 7)
  pdf.setFillColor(...PAGE_COLORS.gold)
  pdf.circle(headerX + 27, contentY + 7, 0.8, 'F')
  pdf.circle(headerX + rightW - 27, contentY + 7, 0.8, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(26)
  pdf.setTextColor(...PAGE_COLORS.title)
  pdf.text('BOLETO', headerX + rightW / 2, contentY + 11, { align: 'center' })

  drawCard(pdf, headerX, participantCardY, rightW, participantCardH)
  drawRoundedLabel(pdf, 'DADOS DO PARTICIPANTE', headerX + 22, participantCardY, 62, 9)

  drawParticipantRow(
    pdf,
    'NOME',
    context.participantName,
    participantInnerX,
    participantCardY + 12,
    participantInnerW,
    nameRowH,
    22,
  )
  drawParticipantRow(
    pdf,
    'TELEFONE',
    context.participantPhone || '-',
    participantInnerX,
    participantCardY + 31,
    halfW,
    infoRowH,
    24,
  )
  drawParticipantRow(
    pdf,
    'E-MAIL',
    context.participantEmail || '-',
    participantInnerX + halfW + halfGap,
    participantCardY + 31,
    halfW,
    infoRowH,
    20,
  )
  drawParticipantRow(
    pdf,
    'IGREJA',
    context.participantChurch || '-',
    participantInnerX,
    participantCardY + 46,
    halfW,
    infoRowH,
    20,
  )
  drawParticipantRow(
    pdf,
    'CIDADE',
    context.participantCity || '-',
    participantInnerX + halfW + halfGap,
    participantCardY + 46,
    halfW,
    infoRowH,
    20,
  )

  drawMetricCard(
    pdf,
    'DATA DE VENCIMENTO',
    formatDueDate(context.dueDateIso),
    contentX,
    summaryY,
    summaryW,
    summaryH,
  )
  drawMetricCard(
    pdf,
    'NUMERO DE PARCELAS',
    `${context.installmentNumber} de ${context.totalInstallments}`,
    contentX + summaryW + summaryGap,
    summaryY,
    summaryW,
    summaryH,
  )
  drawMetricCard(
    pdf,
    'FORMA DE PAGAMENTO',
    'BOLETO VIA PIX',
    contentX + (summaryW + summaryGap) * 2,
    summaryY,
    summaryW,
    summaryH,
  )

  drawCard(pdf, contentX, pixY, contentW, pixH)
  drawRoundedLabel(pdf, 'PAGAMENTO VIA PIX', contentX + 6, pixY, 47, 9)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...PAGE_COLORS.title)
  pdf.text(`Valor: ${formatCurrency(context.installmentAmount)}`, instructionsX, pixY + 18)

  drawCenteredTextBlock(
    pdf,
    'Escaneie o QR Code ao lado ou utilize a chave PIX informada.',
    instructionsX,
    pixY + 28,
    instructionsW,
    9,
    PAGE_COLORS.text,
  )

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...PAGE_COLORS.muted)
  pdf.text('COMPROVANTE', instructionsX + instructionsW / 2, pixY + 48, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.6)
  pdf.text('Envie apos o pagamento.', instructionsX + instructionsW / 2, pixY + 54, {
    align: 'center',
  })

  pdf.setDrawColor(...PAGE_COLORS.cardBorder)
  pdf.setLineDashPattern([1.4, 1.4], 0)
  pdf.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 2.5, 2.5)
  pdf.setLineDashPattern([], 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...PAGE_COLORS.muted)
  pdf.text('QR CODE', qrBoxX + qrBoxSize / 2, qrBoxY + 17, { align: 'center' })
  pdf.text('AQUI', qrBoxX + qrBoxSize / 2, qrBoxY + 23, { align: 'center' })

  pdf.setDrawColor(...PAGE_COLORS.softBorder)
  pdf.line(separatorX, pixY + 11, separatorX, pixY + pixH - 11)
  pdf.setFillColor(...PAGE_COLORS.accent)
  pdf.circle(separatorX, pixY + pixH / 2, 4.8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...PAGE_COLORS.white)
  pdf.text('OU', separatorX, pixY + pixH / 2 + 1.2, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...PAGE_COLORS.title)
  pdf.text('CHAVE PIX', keyAreaX, pixY + 18)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...PAGE_COLORS.text)
  pdf.text(
    pdf.splitTextToSize('Utilize a chave abaixo para realizar o pagamento desta parcela.', keyAreaW),
    keyAreaX,
    pixY + 27,
  )

  pdf.setDrawColor(...PAGE_COLORS.cardBorder)
  pdf.setFillColor(...PAGE_COLORS.accentSoft)
  pdf.roundedRect(keyAreaX, pixY + 35, keyAreaW, 16, 2.5, 2.5, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...PAGE_COLORS.text)
  pdf.text(PIX_KEY, keyAreaX + keyAreaW / 2, pixY + 45.5, { align: 'center' })

  pdf.setFillColor(4, 44, 34)
  pdf.roundedRect(margin, footerY, pageWidth - margin * 2, footerH, 2.5, 2.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.4)
  pdf.setTextColor(244, 250, 247)
  pdf.text(
    'Apos o pagamento, envie o comprovante para o mesmo numero que fez o PIX.',
    margin + 4,
    footerY + 10.8,
  )
  pdf.text('Vivendo uma vida renovada!', pageWidth - margin - 4, footerY + 10.8, {
    align: 'right',
  })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(89, 94, 92)
  pdf.text(
    `Parcela ${context.installmentNumber} • Status: ${context.installmentStatus || 'Pendente'}`,
    margin,
    footerY + footerH + 7,
  )

  const buffer = Buffer.from(pdf.output('arraybuffer'))
  return {
    filename: getInstallmentBoletoFileName(context),
    content: buffer.toString('base64'),
  }
}
