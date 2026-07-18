import { jsPDF } from 'jspdf'
import type { Participant } from '@shared/types/retreat'
import logoRetiro from '@/assets/logo-retiro.png'
import { formatCurrency, formatIsoDatePtBr, formatPaymentMethodLabel } from '@/utils/format'

const COLORS = {
  background: [250, 252, 250] as const,
  primary: [32, 53, 42] as const,
  text: [58, 75, 65] as const,
  muted: [94, 110, 100] as const,
  line: [171, 191, 180] as const,
  accent: [86, 126, 102] as const,
  soft: [236, 244, 238] as const,
} as const

const COMMITMENT_TERMS = [
  'Declaro que os dados informados nesta inscricao sao verdadeiros e atualizados, incluindo informacoes pessoais, restricoes alimentares, necessidades medicas e demais observacoes relevantes para minha participacao.',
  'Comprometo-me a comunicar com antecedencia qualquer impossibilidade de comparecimento, alteracao importante nas informacoes prestadas ou necessidade especial que possa impactar minha permanencia no evento.',
  'Estou ciente de que a vaga somente sera considerada validada apos a conferencia do pagamento pela diretoria, inclusive nos casos de PIX, dinheiro, boleto ou cartao de credito parcelado.',
  'Comprometo-me a seguir as orientacoes da organizacao, bem como as normas espirituais, disciplinares, de convivencia, horarios e uso dos espacos definidos para o retiro.',
  'Estou ciente de que, em caso de desistencia ou cancelamento por minha iniciativa, os valores ja pagos nao serao devolvidos.',
  'Estou ciente de que a guarda de bens e pertences pessoais e de minha responsabilidade, nao cabendo a comissao organizadora responsabilidade por perdas, extravios, furtos ou danos ocorridos durante o evento.',
] as const

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

async function loadImageAsDataUrl(src: string) {
  const response = await fetch(src)
  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Nao foi possivel ler a imagem da logo'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function buildContractFileName(participantName: string) {
  const safeName = sanitizeFileName(participantName) || 'participante'
  return `contrato-retiro-${safeName}.pdf`
}

function fillPageBackground(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  pdf.setFillColor(...COLORS.background)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
}

function drawHeaderBand(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(...COLORS.soft)
  pdf.rect(0, 0, pageWidth, 24, 'F')
  pdf.setDrawColor(...COLORS.line)
  pdf.setLineWidth(0.6)
  pdf.line(14, 24, pageWidth - 14, 24)
}

function drawSectionTitle(pdf: jsPDF, title: string, x: number, y: number, width: number) {
  pdf.setFillColor(...COLORS.soft)
  pdf.rect(x, y - 5, width, 8, 'F')
  pdf.setDrawColor(...COLORS.line)
  pdf.rect(x, y - 5, width, 8)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...COLORS.primary)
  pdf.text(title, x + 3, y)
}

function drawClause(pdf: jsPDF, number: number, text: string, x: number, y: number, width: number) {
  const title = `${number}.`
  const lines = pdf.splitTextToSize(text, width - 10)

  pdf.setFont('times', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.primary)
  pdf.text(title, x, y)

  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.text)
  pdf.text(lines, x + 8, y)

  return y + lines.length * 5.3 + 3
}

function drawParagraph(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight = 5.4,
) {
  const lines = pdf.splitTextToSize(text, width)
  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.text)
  pdf.text(lines, x, y)
  return y + lines.length * lineHeight
}

function ensureSpace(pdf: jsPDF, currentY: number, requiredHeight: number) {
  const pageHeight = pdf.internal.pageSize.getHeight()

  if (currentY + requiredHeight <= pageHeight - 20) {
    return currentY
  }

  pdf.addPage()
  fillPageBackground(pdf)
  drawHeaderBand(pdf)
  return 28
}

export async function downloadParticipantContractPdf(participant: Participant) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let logoDataUrl: string | null = null

  try {
    logoDataUrl = await loadImageAsDataUrl(logoRetiro)
  } catch {
    logoDataUrl = null
  }

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  const currentDateLabel = new Date().toLocaleDateString('pt-BR')
  const participantSummary = [
    participant.fullName,
    `nascido em ${formatIsoDatePtBr(participant.birthDate)}`,
    `portador(a) do CPF ${participant.cpf}`,
    `telefone ${participant.phone}`,
    participant.email ? `e-mail ${participant.email}` : null,
    participant.church ? `membro da igreja ${participant.church}` : null,
    participant.city ? `residente em ${participant.city}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const paymentSummary = [
    `forma de pagamento ${formatPaymentMethodLabel(participant.financial.paymentMethod)}`,
    `valor total de ${formatCurrency(participant.financial.totalAmount)}`,
    `plano em ${participant.financial.installmentCount} parcela(s)`,
  ].join(', ')

  const restrictionsSummary = [
    `restricoes alimentares: ${participant.dietaryRestrictions || 'nenhuma informada'}`,
    `restricoes medicas: ${participant.medicalRestrictions || 'nenhuma informada'}`,
  ].join('; ')

  fillPageBackground(pdf)
  drawHeaderBand(pdf)

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', margin, 7, 18, 18)
  }

  pdf.setFont('times', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(...COLORS.primary)
  pdf.text('RETIRO DA II IPR DE CAMACAN', pageWidth / 2, 12, { align: 'center' })

  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(...COLORS.text)
  pdf.text('Contrato de Inscricao e Termo de Compromisso', pageWidth / 2, 18, {
    align: 'center',
  })

  pdf.setFont('times', 'italic')
  pdf.setFontSize(9)
  pdf.setTextColor(...COLORS.muted)
  pdf.text(`Documento emitido em ${currentDateLabel}`, pageWidth / 2, 29, { align: 'center' })

  let currentY = 40
  drawSectionTitle(pdf, 'Termo Declaratorio', margin, currentY, contentWidth)
  currentY += 11

  currentY = drawParagraph(
    pdf,
    `Eu, ${participantSummary}, declaro para os devidos fins que realizei minha inscricao no Retiro da II IPR de Camacan e forneci voluntariamente as informacoes necessarias para meu cadastro no evento.`,
    margin,
    currentY,
    contentWidth,
  ) + 4

  currentY = drawParagraph(
    pdf,
    `Declaro ainda que, no ato da inscricao, informei os seguintes dados financeiros: ${paymentSummary}. Registro tambem as seguintes observacoes pessoais relevantes para minha participacao: ${restrictionsSummary}.`,
    margin,
    currentY,
    contentWidth,
  ) + 6

  currentY = ensureSpace(pdf, currentY, 45)
  drawSectionTitle(pdf, 'Declaracoes e Compromissos', margin, currentY, contentWidth)
  currentY += 12

  COMMITMENT_TERMS.forEach((term, index) => {
    currentY = ensureSpace(pdf, currentY, 24)
    currentY = drawClause(pdf, index + 1, term, margin, currentY, contentWidth)
  })

  currentY += 8
  currentY = ensureSpace(pdf, currentY, 46)

  currentY = drawParagraph(
    pdf,
    `Por fim, declaro que li integralmente este termo, compreendi seu conteudo e assumo as responsabilidades aqui previstas, confirmando a veracidade das informacoes apresentadas neste documento.`,
    margin,
    currentY,
    contentWidth,
  ) + 10

  const signatureY = pageHeight - 42
  pdf.setDrawColor(...COLORS.line)
  pdf.line(margin + 4, signatureY, margin + 78, signatureY)
  pdf.line(pageWidth - margin - 78, signatureY, pageWidth - margin - 4, signatureY)

  pdf.setFont('times', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLORS.muted)
  pdf.text('Assinatura do participante ou responsavel', margin + 41, signatureY + 5, {
    align: 'center',
  })
  pdf.text('Comissao organizadora', pageWidth - margin - 41, signatureY + 5, {
    align: 'center',
  })
  pdf.text(`Camacan - BA, ${currentDateLabel}`, pageWidth / 2, pageHeight - 14, {
    align: 'center',
  })

  pdf.save(buildContractFileName(participant.fullName))
}
