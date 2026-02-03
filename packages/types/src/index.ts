// Settings (Singleton)
export interface Settings {
  id: 'default';
  exchangeRate: number;        // JPY to IDR, e.g., 108.5
  defaultMarginPercent: number; // e.g., 30 for 30%
  totalBaggageQuotaGrams: number; // e.g., 20000 for 20kg
  jastipStatus: 'open' | 'closed';
  jastipCloseDate: string | null; // ISO date
  estimatedArrivalDate: string | null; // e.g., "6-10 May 2025"
  adminPasswordHash: string;    // bcrypt hash
  updatedAt: string;
}

// Item
export interface Item {
  id: string;                   // UUID
  name: string;
  description: string | null;
  photos: string[];             // R2 public URLs
  basePriceYen: number;
  sellingPrice: number;         // IDR
  weightGrams: number;

  // Info Box Flags
  withoutBoxNote: boolean;      // Show "tanpa box" info
  isLimitedEdition: boolean;    // Show "Limited Edition" badge
  isPreorder: boolean;          // Show "Pre-order" info
  isFragile: boolean;           // Show "Fragile" warning

  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean;         // Soft delete
  isDraft: boolean;             // Draft mode
  createdAt: string;
  updatedAt: string;
}

// Public Item View (DTO)
export interface PublicItem {
  id: string;
  name: string;
  description: string | null;
  photos: string[];
  sellingPrice: number;
  weightGrams: number;
  withoutBoxNote: boolean;
  isLimitedEdition: boolean;
  isPreorder: boolean;
  isFragile: boolean;
  availableSlots: number;       // maxOrders - currentOrders
  badge: 'available' | 'low_stock' | 'full' | 'new';
}

// Public Config Response
export interface PublicConfig {
  jastipStatus: 'open' | 'closed';
  countdownDays: number | null;
  remainingQuotaKg: number;
  totalQuotaKg: number;
  estimatedArrivalDate: string | null;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Admin Create/Update Item Payload
export interface CreateItemPayload {
  name: string;
  description?: string;
  photos: string[];
  basePriceYen: number;
  sellingPrice: number;
  weightGrams: number;
  withoutBoxNote?: boolean;
  isLimitedEdition?: boolean;
  isPreorder?: boolean;
  isFragile?: boolean;
  maxOrders: number;
  isDraft?: boolean;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> { }

// Admin Update Settings Payload
export interface UpdateSettingsPayload {
  exchangeRate?: number;
  defaultMarginPercent?: number;
  totalBaggageQuotaGrams?: number;
  jastipStatus?: 'open' | 'closed';
  jastipCloseDate?: string | null;
  estimatedArrivalDate?: string | null;
}

// Admin Login
export interface LoginPayload {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
}

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

// Public Order (for User/Admin list)
export interface OrderSummary extends Order {
  user?: {
    name: string;
    email: string;
  };
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

// Update Order Payload
export interface UpdateOrderPayload {
  status?: OrderStatus;
  notes?: string;
}

// Update Order Item Payload (Admin)
export interface UpdateOrderItemPayload {
  priceYen?: number;
  weightGrams?: number;
  name?: string;
}
