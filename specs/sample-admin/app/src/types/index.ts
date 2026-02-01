// Item Types
export type ItemCategory = 'snack' | 'skincare' | 'makeup' | 'stationery' | 'gift' | 'beverage' | 'accessories';
export type ItemStatus = 'new' | 'available' | 'low_stock' | 'full';

export interface InfoNote {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  content: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: number;
  slotsAvailable: number;
  maxSlots: number;
  category: ItemCategory;
  status: ItemStatus;
  images: string[];
  views: number;
  infoNotes: InfoNote[];
  createdAt: Date;
  updatedAt: Date;
}

// Token Types
export interface Token {
  id: string;
  code: string; // 5-digit code
  isUsed: boolean;
  usedBy?: {
    name: string;
    email: string;
    avatar?: string;
  };
  usedAt?: Date;
  createdAt: Date;
}

// Settings Types
export interface JastipSettings {
  isOpen: boolean;
  totalQuota: number;
  arrivalDate: Date | null;
  countdownTarget: Date | null;
}

// Dashboard Stats
export interface DashboardStats {
  totalItems: number;
  totalProfit: number;
  totalViews: number;
  activeTokens: number;
  totalOrders: number;
  pendingOrders: number;
}

// Activity Types
export type ActivityType = 'item_added' | 'item_updated' | 'item_deleted' | 'token_generated' | 'token_used' | 'settings_updated';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// User Types (for token usage)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tokenId?: string;
  createdAt: Date;
}
