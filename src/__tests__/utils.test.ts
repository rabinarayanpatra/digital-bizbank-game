import { generateJoinCode, formatCurrency } from '@/lib/utils'

describe('Utils', () => {
  describe('generateJoinCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateJoinCode()
      expect(code).toHaveLength(6)
    })

    it('should generate different codes on multiple calls', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateJoinCode())
      }
      expect(codes.size).toBeGreaterThan(90)
    })

    it('should only contain alphanumeric characters', () => {
      const code = generateJoinCode()
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with symbol', () => {
      expect(formatCurrency(1000, '₹')).toBe('₹1,000')
      expect(formatCurrency(500, '$')).toBe('$500')
      expect(formatCurrency(1234567, '€')).toBe('€1,234,567')
    })

    it('should handle zero amount', () => {
      expect(formatCurrency(0, '₹')).toBe('₹0')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500, '₹')).toBe('₹-500')
    })
  })
})