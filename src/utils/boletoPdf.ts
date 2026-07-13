import { jsPDF } from 'jspdf'
import type { Installment } from '@shared/types/retreat'
import logoRetiro from '@/assets/logo-retiro.png'
import { formatCurrency } from '@/utils/format'

interface BoletoPdfInput {
  participantName: string
  participantPhone: string
  installments: Installment[]
}

function formatDueDate(date?: string) {
  if (!date) {
    return 'A definir'
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

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

      reject(new Error('Não foi possível ler a imagem da logo'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function downloadBoletoBookletPdf({
  participantName,
  participantPhone,
  installments,
}: BoletoPdfInput) {
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
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 16

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', margin, y, 20, 20)
  }

  pdf.setTextColor(28, 25, 23)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('Carne de Pagamento', margin + 26, y + 7)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(71, 85, 105)
  pdf.text('Retiro da II IPR de Camacan', margin + 26, y + 14)
  pdf.text('Documento interno da organizacao', margin + 26, y + 20)

  y += 30

  pdf.setDrawColor(214, 211, 209)
  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(100, 116, 139)
  pdf.text('PARTICIPANTE', margin + 4, y + 6)
  pdf.text('TELEFONE', margin + contentWidth / 2, y + 6)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(15, 23, 42)
  pdf.text(participantName, margin + 4, y + 13)
  pdf.text(participantPhone || '-', margin + contentWidth / 2, y + 13)

  y += 28

  installments.forEach((installment, index) => {
    if (y + 28 > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }

    pdf.setDrawColor(214, 211, 209)
    pdf.setFillColor(255, 251, 235)
    pdf.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(120, 53, 15)
    pdf.text(`Parcela ${index + 1}`, margin + 4, y + 7)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(71, 85, 105)
    pdf.text(`Referencia: ${installment.label}`, margin + 4, y + 13)
    pdf.text(`Vencimento: ${formatDueDate(installment.dueDate)}`, margin + 4, y + 18)
    pdf.text(`Status: ${installment.status}`, margin + contentWidth / 2, y + 13)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(15, 23, 42)
    pdf.text(
      `Valor: ${formatCurrency(installment.amount)}`,
      margin + contentWidth / 2,
      y + 18,
    )

    y += 28
  })

  const fileName = `carne-de-pagamento-${sanitizeFileName(participantName || 'participante')}.pdf`
  pdf.save(fileName)
}
