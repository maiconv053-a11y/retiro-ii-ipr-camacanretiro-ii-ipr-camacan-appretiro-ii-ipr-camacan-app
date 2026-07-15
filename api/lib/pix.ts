import QRCode from 'qrcode'

interface PixPayloadInput {
  pixKey: string
  amount: number
  merchantName: string
  merchantCity: string
  txid: string
}

function removeAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizePixField(value: string, maxLength: number) {
  return removeAccents(value)
    .replace(/[^\w\s.+\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .toUpperCase()
}

function buildPixField(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

function formatPixAmount(amount: number) {
  return Number(amount || 0).toFixed(2)
}

function crc16Ccitt(payload: string) {
  let crc = 0xffff

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }

      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildPixPaymentPayload(input: PixPayloadInput) {
  const merchantAccountInfo = buildPixField(
    '26',
    `${buildPixField('00', 'BR.GOV.BCB.PIX')}${buildPixField('01', input.pixKey)}`,
  )

  const txid = normalizePixField(input.txid, 25) || '***'
  const merchantName = normalizePixField(input.merchantName, 25) || 'RETIRO IPR CAMACAN'
  const merchantCity = normalizePixField(input.merchantCity, 15) || 'CAMACAN'

  const payloadWithoutCrc = [
    buildPixField('00', '01'),
    merchantAccountInfo,
    buildPixField('52', '0000'),
    buildPixField('53', '986'),
    buildPixField('54', formatPixAmount(input.amount)),
    buildPixField('58', 'BR'),
    buildPixField('59', merchantName),
    buildPixField('60', merchantCity),
    buildPixField('62', buildPixField('05', txid)),
    '6304',
  ].join('')

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`
}

export async function generatePixQrCodeDataUrl(input: PixPayloadInput) {
  const payload = buildPixPaymentPayload(input)

  return await QRCode.toDataURL(payload, {
    margin: 0,
    errorCorrectionLevel: 'M',
    width: 512,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}
