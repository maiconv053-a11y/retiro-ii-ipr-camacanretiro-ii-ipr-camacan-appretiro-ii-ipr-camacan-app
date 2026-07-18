export function sanitizeCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function formatCpf(value: string) {
  const digits = sanitizeCpf(value)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCpf(value: string) {
  const digits = sanitizeCpf(value)

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false
  }

  const numbers = digits.split('').map(Number)

  const firstCheckDigit = calculateCpfCheckDigit(numbers.slice(0, 9), 10)
  const secondCheckDigit = calculateCpfCheckDigit(numbers.slice(0, 10), 11)

  return firstCheckDigit === numbers[9] && secondCheckDigit === numbers[10]
}

function calculateCpfCheckDigit(numbers: number[], weightStart: number) {
  const total = numbers.reduce((sum, number, index) => sum + number * (weightStart - index), 0)
  const remainder = (total * 10) % 11
  return remainder === 10 ? 0 : remainder
}
