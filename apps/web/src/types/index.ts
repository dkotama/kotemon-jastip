// Types matching backend API
export type ItemBadge = 'new' | 'low_stock' | 'full' | 'available';
export type ItemCategory = string;

export interface CategoryOption {
  id: ItemCategory;
  label: string;
  icon: string;
}

// Info Note Types matching backend
export type InfoNoteType = 'amber' | 'purple' | 'blue' | 'red';

export interface InfoNote {
  type: InfoNoteType;
  text: string;
  // Frontend helpers
  id?: string;
  content?: string;
}

// User type (from auth)
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  avatar?: string; // For backward compatibility
}

// Jastip status for StatusBanner
export interface JastipStatus {
  isOpen: boolean;
  daysRemaining: number;
  quotaUsed: number;
  quotaTotal: number;
  arrivalDate: string;
  closeDate?: string | null;  // For date validation display
}

// Admin Item Schema (from openapi.yaml)
export interface Item {
  id: string;
  name: string;
  description: string | null;
  photos: string[];
  basePriceYen: number;
  basePriceRp: number;
  sellingPriceRp: number;
  weightGrams: number;
  withoutBoxNote: boolean;
  isLimitedEdition: boolean;
  isPreorder: boolean;
  isFragile: boolean;
  category: ItemCategory;
  infoNotes: InfoNote[];
  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean; // Soft delete
  isDraft: boolean;
  viewCount: number;
  createdAt: string; // Date string
  updatedAt: string; // Date string

  // Frontend compatibility aliases (optional, to minimize refactor)
  price?: number; // Alias for sellingPriceRp
  weight?: number; // Alias for weightGrams
  slots?: number; // Alias for availableSlots
  slotsAvailable?: number; // Alias for availableSlots
  maxSlots?: number; // Alias for maxOrders
  status?: ItemBadge; // Computed status
  image?: string; // Alias for photos[0]
  images?: string[]; // Alias for photos
  views?: number; // Alias for viewCount
}

// Public Item Schema (from openapi.yaml)
export interface PublicItem {
  id: string;
  name: string;
  description: string;
  photos: string[];
  basePriceRp: number;
  sellingPriceRp: number;
  weightGrams: number;
  withoutBoxNote: boolean;
  isLimitedEdition: boolean;
  isPreorder: boolean;
  isFragile: boolean;
  category: ItemCategory;
  infoNotes: InfoNote[];
  availableSlots: number;
  badge: ItemBadge;
  viewCount: number;
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
  usedAt?: Date | string;
  createdAt: Date | string;
}

// Settings Types
// Note: These field names must match the backend API (apps/api/src/routes/admin.ts)
export interface JastipSettings {
  isOpen: boolean;
  totalQuota: number;
  // Use backend field names directly for consistency
  jastipCloseDate: Date | string | null;      // Deadline for orders (tutup)
  estimatedArrivalDate: Date | string | null; // When items arrive in Indonesia (estimasi)
  exchangeRate: number;
  defaultMarginPercent: number;
  itemCategories: string[];
  // Aliases for frontend compatibility (deprecated, use jastipCloseDate and estimatedArrivalDate)
  arrivalDate?: Date | string | null;
  countdownTarget?: Date | string | null;
}

export interface UpdateSettingsPayload {
  exchangeRate?: number;
  defaultMarginPercent?: number;
  totalBaggageQuotaGrams?: number;  // Backend uses grams
  jastipStatus?: 'open' | 'closed';
  jastipCloseDate?: Date | string | null;
  estimatedArrivalDate?: Date | string | null;
  itemCategories?: string[];
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

// Alias for compatibility if needed
export type JastipItem = Item;

// Order Status
export type OrderStatus = 'confirmed' | 'purchased' | 'shipped' | 'delivered' | 'cancelled' | 'waiting_payment';

// Order Item
export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string | null; // Null for custom items
  name: string;
  quantity: number;
  priceYen: number;
  priceRp: number;
  weightGrams: number;
  isCustom: boolean;
  customUrl: string | null;
  customNote: string | null;
  customSource: string | null;
  createdAt: string;
}

// Order
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalPriceYen: number;
  totalPriceRp: number;
  totalWeightGrams: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Create Order Payload
export interface CreateOrderItemPayload {
  itemId?: string; // Optional if custom
  itemName?: string; // Required if custom
  quantity: number;
  isCustom?: boolean;
  customUrl?: string;
  customNote?: string;
  customSource?: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  notes?: string;
}




