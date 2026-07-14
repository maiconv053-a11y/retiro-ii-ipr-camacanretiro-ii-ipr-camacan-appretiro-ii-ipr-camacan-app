import { jsPDF } from 'jspdf'
import type { Installment } from '@shared/types/retreat'
import logoRetiro from '@/assets/logo-retiro.png'
import { formatCurrency } from '@/utils/format'

interface BoletoPdfInput {
  participantName: string
  participantPhone: string
  participantEmail: string
  participantChurch: string
  participantCity: string
  installments: Installment[]
}

const PIX_KEY = '(73) 982313389'

function drawRoundedLabel(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  pdf.setFillColor(7, 56, 42)
  pdf.roundedRect(x, y, width, height, 2.5, 2.5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(245, 247, 242)
  pdf.text(text, x + width / 2, y + height / 2 + 1.2, { align: 'center' })
}

function drawLineField(
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(48, 55, 52)
  pdf.text(label, x, y)
  pdf.setDrawColor(151, 156, 153)
  pdf.line(x + 26, y + 0.5, x + width, y + 0.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(32, 37, 35)
  pdf.text(value || '-', x + 28, y - 1.2)
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
  participantEmail,
  participantChurch,
  participantCity,
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
  const margin = 12

  installments.forEach((installment, index) => {
    if (index > 0) {
      pdf.addPage()
    }

    pdf.setFillColor(248, 247, 244)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    const leftX = margin
    const leftY = 10
    const leftW = 82
    const logoBoxH = 110
    const rightX = leftX + leftW + 6
    const rightW = pageWidth - rightX - margin

    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', leftX - 1, leftY, leftW + 6, logoBoxH)
    }

    pdf.setDrawColor(212, 181, 96)
    pdf.setLineWidth(0.4)
    pdf.line(rightX + 2, 18, rightX + 22, 18)
    pdf.line(pageWidth - margin - 22, 18, pageWidth - margin - 2, 18)
    pdf.setFillColor(212, 181, 96)
    pdf.circle(rightX + 25, 18, 0.8, 'F')
    pdf.circle(pageWidth - margin - 25, 18, 0.8, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(27)
    pdf.setTextColor(5, 40, 31)
    pdf.text('BOLETO', rightX + rightW / 2, 22, { align: 'center' })

    pdf.setDrawColor(120, 131, 126)
    pdf.setLineWidth(0.35)
    pdf.roundedRect(rightX, 26, rightW, 68, 3.5, 3.5)
    drawRoundedLabel(pdf, 'DADOS DO PARTICIPANTE', rightX + 28, 26, 52, 10)

    drawLineField(pdf, 'NOME COMPLETO:', participantName, rightX + 4, 43, rightW - 8)
    drawLineField(pdf, 'TELEFONE:', participantPhone || '-', rightX + 4, 57, rightW - 8)
    drawLineField(pdf, 'E-MAIL:', participantEmail || '-', rightX + 4, 71, rightW - 8)
    drawLineField(
      pdf,
      'IGREJA / CIDADE:',
      [participantChurch, participantCity].filter(Boolean).join(' - ') || '-',
      rightX + 4,
      85,
      rightW - 8,
    )

    pdf.setDrawColor(151, 156, 153)
    pdf.setLineWidth(0.25)
    pdf.line(rightX + 4, 100, rightX + rightW - 4, 100)
    pdf.line(rightX + rightW / 3, 104, rightX + rightW / 3, 126)
    pdf.line(rightX + (rightW / 3) * 2, 104, rightX + (rightW / 3) * 2, 126)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(48, 55, 52)
    pdf.text('DATA DE VENCIMENTO', rightX + 10, 110)
    pdf.text('NUMERO DE PARCELAS', rightX + rightW / 3 + 10, 110)
    pdf.text('FORMA DE PAGAMENTO', rightX + (rightW / 3) * 2 + 10, 110)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(19, 28, 24)
    pdf.text(formatDueDate(installment.dueDate), rightX + 10, 121)
    pdf.text(`${index + 1} de ${installments.length}`, rightX + rightW / 3 + 10, 121)
    pdf.text('BOLETO (VIA PIX)', rightX + (rightW / 3) * 2 + 10, 121)

    const pixBoxY = 108
    const pixBoxH = 48
    pdf.setDrawColor(120, 131, 126)
    pdf.setLineWidth(0.35)
    pdf.roundedRect(margin, pixBoxY, pageWidth - margin * 2, pixBoxH, 3.5, 3.5)
    drawRoundedLabel(pdf, 'PAGAMENTO VIA PIX', margin + 4, pixBoxY, 45, 9)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(38, 46, 43)
    pdf.text('Escaneie o QR Code ao lado para realizar', margin + 8, pixBoxY + 23)
    pdf.text('o pagamento desta parcela.', margin + 8, pixBoxY + 29)
    pdf.text(`Valor: ${formatCurrency(installment.amount)}`, margin + 8, pixBoxY + 37)

    const qrX = margin + 56
    const qrY = pixBoxY + 6
    pdf.setDrawColor(120, 131, 126)
    pdf.setLineDashPattern([1.4, 1.4], 0)
    pdf.roundedRect(qrX, qrY, 30, 30, 2.5, 2.5)
    pdf.setLineDashPattern([], 0)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(38, 46, 43)
    pdf.text('QR CODE', qrX + 15, qrY + 16, { align: 'center' })
    pdf.text('AQUI', qrX + 15, qrY + 22, { align: 'center' })

    const dividerX = margin + 98
    pdf.setDrawColor(120, 131, 126)
    pdf.line(dividerX, pixBoxY + 6, dividerX, pixBoxY + pixBoxH - 6)
    pdf.setFillColor(7, 56, 42)
    pdf.circle(dividerX, pixBoxY + pixBoxH / 2, 4.5, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(245, 247, 242)
    pdf.text('OU', dividerX, pixBoxY + pixBoxH / 2 + 1.2, { align: 'center' })

    const keyX = dividerX + 10
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(26, 35, 31)
    pdf.text('CHAVE PIX', keyX + 18, pixBoxY + 13)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(48, 55, 52)
    pdf.text('Utilize a chave abaixo para realizar o pagamento.', keyX + 18, pixBoxY + 20)

    pdf.setDrawColor(120, 131, 126)
    pdf.roundedRect(keyX + 4, pixBoxY + 26, pageWidth - keyX - margin - 4, 14, 2.5, 2.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(19, 28, 24)
    pdf.text(PIX_KEY, keyX + 8, pixBoxY + 35)

    pdf.setFillColor(4, 44, 34)
    pdf.roundedRect(margin, 160, pageWidth - margin * 2, 15, 2.5, 2.5, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10.5)
    pdf.setTextColor(244, 250, 247)
    pdf.text(
      'Apos o pagamento, envie o comprovante para o mesmo numero que fez o PIX.',
      margin + 4,
      169.5,
    )
    pdf.text('Vivendo uma vida renovada!', pageWidth - margin - 4, 169.5, {
      align: 'right',
    })

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(89, 94, 92)
    pdf.text(
      `Parcela ${index + 1} • ${installment.label} • Status: ${installment.status}`,
      margin,
      184,
    )
  })

  const fileName = `carne-de-pagamento-${sanitizeFileName(participantName || 'participante')}.pdf`
  pdf.save(fileName)
}
