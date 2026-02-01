import { describe, it, expect } from 'vitest'

/**
 * Badge Logic Tests
 * Tests: available, low_stock, full, new logic
 */

type Badge = 'available' | 'low_stock' | 'full' | 'new'

interface Item {
  maxOrders: number
  currentOrders: number
  createdAt: string // ISO date
}

function determineBadge(item: Item, now: Date = new Date()): Badge {
  const availableSlots = item.maxOrders - item.currentOrders
  const createdAt = new Date(item.createdAt)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // Priority order: full > low_stock > new > available
  if (availableSlots <= 0) {
    return 'full'
  } else if (availableSlots <= 2) {
    return 'low_stock'
  } else if (createdAt > threeDaysAgo) {
    return 'new'
  } else {
    return 'available'
  }
}

describe('Badge Logic', () => {
  describe('full badge', () => {
    it('should return full when no slots available', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 10,
        createdAt: new Date().toISOString(),
      }

      expect(determineBadge(item)).toBe('full')
    })

    it('should return full when overbooked (edge case)', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 12,
        createdAt: new Date().toISOString(),
      }

      expect(determineBadge(item)).toBe('full')
    })
  })

  describe('low_stock badge', () => {
    it('should return low_stock when 1 slot available', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 9,
        createdAt: new Date().toISOString(),
      }

      expect(determineBadge(item)).toBe('low_stock')
    })

    it('should return low_stock when 2 slots available', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 8,
        createdAt: new Date().toISOString(),
      }

      expect(determineBadge(item)).toBe('low_stock')
    })

    it('should NOT return low_stock when 3 slots available', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 7,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days old
      }

      expect(determineBadge(item)).toBe('available')
    })
  })

  describe('new badge', () => {
    it('should return new for items created less than 3 days ago', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 0,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day old
      }

      expect(determineBadge(item)).toBe('new')
    })

    it('should return new for items created exactly 2 days ago', () => {
      const now = new Date()
      const item: Item = {
        maxOrders: 10,
        currentOrders: 0,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(determineBadge(item, now)).toBe('new')
    })

    it('should return available for items created more than 3 days ago', () => {
      const now = new Date()
      const item: Item = {
        maxOrders: 10,
        currentOrders: 0,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(determineBadge(item, now)).toBe('available')
    })
  })

  describe('priority order', () => {
    it('should prioritize full over low_stock', () => {
      const item: Item = {
        maxOrders: 2,
        currentOrders: 2,
        createdAt: new Date().toISOString(), // Would be "new" but is full
      }

      expect(determineBadge(item)).toBe('full')
    })

    it('should prioritize low_stock over new', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 9,
        createdAt: new Date().toISOString(), // Would be "new" but is low_stock
      }

      expect(determineBadge(item)).toBe('low_stock')
    })

    it('should return available when no special conditions', () => {
      const item: Item = {
        maxOrders: 10,
        currentOrders: 5,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days old
      }

      expect(determineBadge(item)).toBe('available')
    })
  })
})
