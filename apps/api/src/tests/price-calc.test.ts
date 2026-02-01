import { describe, it, expect } from 'vitest'
import { calculateBasePriceRp } from '../db/client.js'

/**
 * Price Calculation Tests
 * Tests: ¥500 × 108.5 = Rp 54,250
 */

describe('Price Calculation', () => {
  // The actual price calculation formula used in the app
  function calculateSellingPrice(
    basePriceYen: number,
    exchangeRate: number,
    marginPercent: number
  ): number {
    const baseIdr = basePriceYen * exchangeRate
    const margin = baseIdr * (marginPercent / 100)
    return Math.ceil(baseIdr + margin)
  }

  describe('calculateBasePriceRp', () => {
    it('should calculate ¥500 × 108.5 = Rp 54,250', () => {
      const basePriceYen = 500
      const exchangeRate = 108.5

      const basePriceRp = calculateBasePriceRp(basePriceYen, exchangeRate)

      // Math.round(500 * 108.5) = Math.round(54250) = 54250
      expect(basePriceRp).toBe(54250)
    })

    it('should round to nearest rupiah', () => {
      // Test rounding behavior
      expect(calculateBasePriceRp(1, 108.5)).toBe(109) // Math.round(108.5) = 109
      expect(calculateBasePriceRp(2, 108.5)).toBe(217) // Math.round(217) = 217
    })

    it('should handle various price points', () => {
      const testCases = [
        { yen: 1000, rate: 108.5, expected: 108500 },
        { yen: 2500, rate: 108.5, expected: 271250 },
        { yen: 5000, rate: 108.5, expected: 542500 },
        { yen: 10000, rate: 110, expected: 1100000 },
      ]

      for (const tc of testCases) {
        const result = calculateBasePriceRp(tc.yen, tc.rate)
        expect(result).toBe(tc.expected)
      }
    })
  })

  it('should calculate ¥500 × 108.5 = Rp 54,250 with 0% margin', () => {
    const basePriceYen = 500
    const exchangeRate = 108.5
    const marginPercent = 0

    const sellingPrice = calculateSellingPrice(basePriceYen, exchangeRate, marginPercent)

    expect(sellingPrice).toBe(54250)
  })

  it('should calculate ¥500 × 108.5 correctly with margin', () => {
    const basePriceYen = 500
    const exchangeRate = 108.5
    const marginPercent = 30

    const sellingPrice = calculateSellingPrice(basePriceYen, exchangeRate, marginPercent)

    // Base: 500 * 108.5 = 54250
    // Margin: 54250 * 0.30 = 16275
    // Total: 54250 + 16275 = 70525
    expect(sellingPrice).toBe(70525)
  })

  it('should handle various price points', () => {
    const testCases = [
      { yen: 1000, rate: 108.5, margin: 30, expected: 141050 }, // 1000 * 108.5 * 1.3
      { yen: 2000, rate: 108.5, margin: 30, expected: 282100 }, // 2000 * 108.5 * 1.3
      { yen: 5000, rate: 108.5, margin: 30, expected: 705250 }, // 5000 * 108.5 * 1.3
    ]

    for (const tc of testCases) {
      const result = calculateSellingPrice(tc.yen, tc.rate, tc.margin)
      expect(result).toBe(tc.expected)
    }
  })

  it('should round up to nearest rupiah', () => {
    // Test that we always round up for fractional rupiah
    const basePriceYen = 1
    const exchangeRate = 108.5
    const marginPercent = 0

    const sellingPrice = calculateSellingPrice(basePriceYen, exchangeRate, marginPercent)

    expect(sellingPrice).toBe(109) // Math.ceil(108.5) = 109
  })
})
