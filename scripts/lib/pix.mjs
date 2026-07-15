import QRCode from 'qrcode'

function removeAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizePixField(value, maxLength) {
  return removeAccents(value)
    .replace(/[^\w\s.+\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .toUpperCase()
}

function buildPixField(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function formatPixAmount(amount) {
  return Number(amount || 0).toFixed(2)
}

function crc16Ccitt(payload) {
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

export function buildPixPaymentPayload({ pixKey, amount, merchantName, merchantCity, txid }) {
  const merchantAccountInfo = buildPixField(
    '26',
    `${buildPixField('00', 'BR.GOV.BCB.PIX')}${buildPixField('01', pixKey)}`,
  )

  const normalizedTxid = normalizePixField(txid, 25) || '***'
  const normalizedMerchantName =
    normalizePixField(merchantName, 25) || 'RETIRO IPR CAMACAN'
  const normalizedMerchantCity = normalizePixField(merchantCity, 15) || 'CAMACAN'

  const payloadWithoutCrc = [
    buildPixField('00', '01'),
    merchantAccountInfo,
    buildPixField('52', '0000'),
    buildPixField('53', '986'),
    buildPixField('54', formatPixAmount(amount)),
    buildPixField('58', 'BR'),
    buildPixField('59', normalizedMerchantName),
    buildPixField('60', normalizedMerchantCity),
    buildPixField('62', buildPixField('05', normalizedTxid)),
    '6304',
  ].join('')

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`
}

export async function generatePixQrCodeDataUrl(input) {
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
