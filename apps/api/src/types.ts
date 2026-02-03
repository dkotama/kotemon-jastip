// Shared TypeScript types for Kotemon Jastip

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
  itemCategories: string[];     // Dynamic list of categories
}

// Info Note Type
export type InfoNoteType = 'amber' | 'purple' | 'blue' | 'red';

export interface InfoNote {
  type: InfoNoteType;
  text: string;
}

// Item Category Type (Dynamic now)
export type ItemCategory = string;

// Item
export interface Item {
  id: string;                   // UUID
  name: string;
  description: string | null;
  photos: string[];             // R2 public URLs
  basePriceYen: number;         // Original price in JPY (admin enters)
  basePriceRp: number;          // Calculated from exchange rate (JPY × exchangeRate)
  sellingPriceRp: number;       // Selling price in IDR (manual)
  weightGrams: number;

  // Info Box Flags
  withoutBoxNote: boolean;      // Show "tanpa box" info
  isLimitedEdition: boolean;    // Show "Limited Edition" badge
  isPreorder: boolean;          // Show "Pre-order" info
  isFragile: boolean;           // Show "Fragile" warning

  // Category and Info Notes
  category: ItemCategory | null;
  infoNotes: InfoNote[];

  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean;         // Soft delete
  isDraft: boolean;             // Draft mode
  viewCount: number;            // View counter
  createdAt: string;
  updatedAt: string;
}

// Public Item View (DTO)
export interface PublicItem {
  id: string;
  name: string;
  description: string | null;
  photos: string[];
  basePriceRp: number;          // Calculated from exchange rate
  sellingPriceRp: number;       // Selling price in IDR
  weightGrams: number;
  withoutBoxNote: boolean;
  isLimitedEdition: boolean;
  isPreorder: boolean;
  isFragile: boolean;
  category: ItemCategory | null;
  infoNotes: InfoNote[];
  availableSlots: number;       // maxOrders - currentOrders
  badge: 'available' | 'low_stock' | 'full' | 'new';
  viewCount: number;            // View counter
}

// Public Config Response
export interface PublicConfig {
  jastipStatus: 'open' | 'closed';
  countdownDays: number | null;
  remainingQuotaKg: number;
  totalQuotaKg: number;
  estimatedArrivalDate: string | null;
}

// Index/Landing Page Items Grouping
export interface IndexPageItems {
  latest: PublicItem[];      // 8 newest items
  featured: PublicItem[];    // Limited edition, preorder, or highlighted
  popular: PublicItem[];     // 8 most viewed items
  all: PublicItem[];         // All available items for search/filter
}

// Index/Landing Page Data Response
export interface IndexPageResponse {
  config: PublicConfig;
  items: IndexPageItems;
  meta: {
    totalItems: number;
    lastUpdated: string;
  };
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
  basePriceYen: number;         // Original price in JPY
  sellingPriceRp: number;       // Selling price in IDR (manual)
  weightGrams: number;
  withoutBoxNote?: boolean;
  isLimitedEdition?: boolean;
  isPreorder?: boolean;
  isFragile?: boolean;
  category?: ItemCategory;
  infoNotes?: InfoNote[];
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
  itemCategories?: string[];
}

// Admin Login
export interface LoginPayload {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
}

// User
export interface User {
  id: string;                   // UUID
  googleId: string;             // Google sub claim
  email: string;
  name: string;
  photoUrl: string | null;
  tokenId: string | null;       // Reference to invite token used
  isRevoked: boolean;           // Soft delete - revoked access
  revokedAt: string | null;     // When access was revoked
  revokedBy: string | null;     // Who revoked the access
  createdAt: string;
  lastLoginAt: string;
}

// Invite Token
export interface Token {
  id: string;                   // UUID
  code: string;                 // Human-readable token code (e.g., "KOTEMON2025")
  createdBy: string;            // User ID who created it (or 'system' for initial)
  usedBy: string | null;        // User ID who used it
  usedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

// JWT Session Payload
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  photoUrl: string | null;
  iat: number;
  exp: number;
}

// Temp OAuth Session (before token verification)
export interface TempOAuthSession {
  googleId: string;
  email: string;
  name: string;
  photoUrl: string | null;
}

// Token Verification Payload
export interface VerifyTokenPayload {
  token: string;
}

// Google OAuth User Info
export interface GoogleUserInfo {
  sub: string;                  // Google ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}
