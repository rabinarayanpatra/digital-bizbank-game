import { generateUniqueJoinCode, BusinessLogicError } from '@/lib/business-logic'

describe('Business Logic', () => {
  describe('generateUniqueJoinCode', () => {
    it('should generate a unique code not in existing list', () => {
      const existing = ['ABCD12', 'EFGH34', 'IJKL56']
      const newCode = generateUniqueJoinCode(existing)
      
      expect(newCode).toHaveLength(6)
      expect(existing).not.toContain(newCode)
      expect(newCode).toMatch(/^[A-Z0-9]+$/)
    })

    it('should work with large existing codes list', () => {
      const existing = []
      for (let i = 0; i < 1000; i++) {
        existing.push(i.toString().padStart(6, '0'))
      }

      const newCode = generateUniqueJoinCode(existing)
      expect(newCode).toHaveLength(6)
      expect(existing).not.toContain(newCode)
    })

    it('should work with empty existing codes list', () => {
      const code = generateUniqueJoinCode([])
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })
  })
})