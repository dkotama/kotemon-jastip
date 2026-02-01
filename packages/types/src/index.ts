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

export interface UpdateItemPayload extends Partial<CreateItemPayload> {}

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
