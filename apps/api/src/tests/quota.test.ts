import { describe, it, expect } from 'vitest'

/**
 * Quota Calculation Tests
 * Tests: 20kg - sum(orders) = remaining
 */

interface Item {
  id: string
  weightGrams: number
  currentOrders: number
  isAvailable: boolean
  isDraft: boolean
}

function calculateUsedQuota(items: Item[]): number {
  return items
    .filter(item => item.isAvailable && !item.isDraft)
    .reduce((sum, item) => sum + (item.weightGrams * item.currentOrders), 0)
}

function calculateRemainingQuota(totalQuotaGrams: number, usedQuotaGrams: number): number {
  return Math.max(0, totalQuotaGrams - usedQuotaGrams)
}

describe('Quota Calculation', () => {
  const TOTAL_QUOTA_KG = 20
  const TOTAL_QUOTA_GRAMS = TOTAL_QUOTA_KG * 1000 // 20000 grams

  it('should return full quota when no orders', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 500, currentOrders: 0, isAvailable: true, isDraft: false },
      { id: '2', weightGrams: 1000, currentOrders: 0, isAvailable: true, isDraft: false },
    ]

    const used = calculateUsedQuota(items)
    const remaining = calculateRemainingQuota(TOTAL_QUOTA_GRAMS, used)

    expect(used).toBe(0)
    expect(remaining).toBe(20000)
  })

  it('should calculate remaining quota: 20kg - 5kg = 15kg', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 500, currentOrders: 5, isAvailable: true, isDraft: false }, // 2.5kg
      { id: '2', weightGrams: 1000, currentOrders: 2, isAvailable: true, isDraft: false }, // 2kg
      { id: '3', weightGrams: 500, currentOrders: 1, isAvailable: true, isDraft: false }, // 0.5kg
    ]

    const used = calculateUsedQuota(items)
    const remaining = calculateRemainingQuota(TOTAL_QUOTA_GRAMS, used)

    expect(used).toBe(5000) // 5kg in grams
    expect(remaining).toBe(15000) // 15kg in grams
  })

  it('should not count unavailable items', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 1000, currentOrders: 5, isAvailable: true, isDraft: false }, // 5kg
      { id: '2', weightGrams: 1000, currentOrders: 3, isAvailable: false, isDraft: false }, // excluded
    ]

    const used = calculateUsedQuota(items)

    expect(used).toBe(5000) // Only counts available item
  })

  it('should not count draft items', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 1000, currentOrders: 5, isAvailable: true, isDraft: false }, // 5kg
      { id: '2', weightGrams: 1000, currentOrders: 3, isAvailable: true, isDraft: true }, // excluded
    ]

    const used = calculateUsedQuota(items)

    expect(used).toBe(5000) // Only counts non-draft item
  })

  it('should return 0 remaining when quota is exceeded', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 1000, currentOrders: 25, isAvailable: true, isDraft: false }, // 25kg
    ]

    const used = calculateUsedQuota(items)
    const remaining = calculateRemainingQuota(TOTAL_QUOTA_GRAMS, used)

    expect(used).toBe(25000) // 25kg
    expect(remaining).toBe(0) // Can't go negative
  })

  it('should calculate with mixed order quantities', () => {
    const items: Item[] = [
      { id: '1', weightGrams: 300, currentOrders: 10, isAvailable: true, isDraft: false }, // 3kg
      { id: '2', weightGrams: 500, currentOrders: 5, isAvailable: true, isDraft: false }, // 2.5kg
      { id: '3', weightGrams: 200, currentOrders: 20, isAvailable: true, isDraft: false }, // 4kg
    ]

    const used = calculateUsedQuota(items)
    const remaining = calculateRemainingQuota(TOTAL_QUOTA_GRAMS, used)

    expect(used).toBe(9500) // 9.5kg
    expect(remaining).toBe(10500) // 10.5kg
  })
})
