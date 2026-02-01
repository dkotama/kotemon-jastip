// Get API base URL based on current environment
function getApiBaseUrl(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:8787' : 'https://jastip.dkotama.com';
}

import type { Item, PublicItem, User, InfoNote, JastipItem, ItemCategory } from '@/types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Create Item Payload
export interface CreateItemPayload {
  name: string;
  description?: string;
  photos: string[];
  basePriceYen: number;
  sellingPriceRp: number;
  weightGrams: number;
  withoutBoxNote?: boolean;
  isLimitedEdition?: boolean;
  isPreorder?: boolean;
  isFragile?: boolean;
  category?: string;
  infoNotes?: InfoNote[];
  maxOrders?: number;
  isDraft?: boolean;
}

// Update Item Payload
export interface UpdateItemPayload {
  name?: string;
  description?: string;
  photos?: string[];
  basePriceYen?: number; // Triggers basePriceRp recalculation
  sellingPriceRp?: number;
  weightGrams?: number;
  withoutBoxNote?: boolean;
  isLimitedEdition?: boolean;
  isPreorder?: boolean;
  isFragile?: boolean;
  category?: string;
  infoNotes?: InfoNote[];
  maxOrders?: number;
  isDraft?: boolean;
}

// Helper to get full image URL
export function getImageUrl(photoPath: string): string {
  if (!photoPath) return '';
  if (photoPath.startsWith('http')) {
    return photoPath;
  }

  // If path already starts with /api, just append to base URL
  if (photoPath.startsWith('/api')) {
    return `${getApiBaseUrl()}${photoPath}`;
  }

  // Handle R2 photo paths like "uploads/filename.jpg"
  // Ensure we don't double slash if photoPath starts with /
  const cleanPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
  return `${getApiBaseUrl()}/api/public/photos/${cleanPath}`;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  return result.data;
}

// Public API
export const publicApi = {
  getConfig: () => fetchApi<any>('/api/public/config'), // Use any or PublicConfig from types

  getItems: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi<{ items: PublicItem[]; total: number }>(`/api/public/items${params}`);
  },

  getItem: (id: string) => fetchApi<PublicItem>(`/api/public/items/${id}`),

  incrementView: (id: string) => fetchApi<{ viewCount: number }>(`/api/public/items/${id}/view`, {
    method: 'POST',
  }),

  // Get consolidated landing page data (replaces separate config + items calls)
  getIndexPage: () => fetchApi<{
    config: {
      jastipStatus: 'open' | 'closed';
      countdownDays: number | null;
      remainingQuotaKg: number;
      totalQuotaKg: number;
      estimatedArrivalDate: string | null;
    };
    items: {
      latest: PublicItem[];
      featured: PublicItem[];
      popular: PublicItem[];
      all: PublicItem[];
    };
    meta: {
      totalItems: number;
      lastUpdated: string;
    };
  }>('/api/public/index'),
};

// Auth API
export const authApi = {
  // Start Google OAuth - opens in same window, backend redirects back
  loginWithGoogle: () => {
    const frontendUrl = window.location.origin;
    window.location.href = `${getApiBaseUrl()}/api/auth/google?frontend=${encodeURIComponent(frontendUrl)}`;
  },

  // Verify invite token for new users
  verifyToken: (inviteCode: string, tempToken: string) => fetchApi<{ user: User }>('/api/auth/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token: inviteCode, tempToken }),
  }),

  // Get current user
  getMe: () => fetchApi<{ user: User }>('/api/auth/me'),

  // Check auth status
  getStatus: () => fetchApi<{ authenticated: boolean; user?: { id: string; name: string }; revoked?: boolean }>('/api/auth/status'),

  // Logout
  logout: () => fetchApi<void>('/api/auth/logout', { method: 'POST' }),

  // Mock login for testing (localhost only)
  mockLogin: () => fetchApi<{
    message: string;
    user?: User;
    tempToken?: string;
    sessionToken?: string;
  }>('/api/auth/test/mock-oauth', { method: 'POST' }),
};

// Admin API
export const adminApi = {
  // Login with admin password
  login: (password: string) => fetchApi<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),

  // Get all items (admin view) - Returns Item[] directly (admin schema)
  getItems: (token: string) => fetchApi<Item[]>('/api/admin/items', {
    headers: { Authorization: `Bearer ${token}` },
  }),

  getItemById: (token: string, id: string) => fetchApi<Item>(`/api/admin/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }),

  // Create item
  createItem: (token: string, item: CreateItemPayload) => fetchApi<Item>('/api/admin/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(item),
  }),

  // Update item
  updateItem: (token: string, id: string, item: UpdateItemPayload) => fetchApi<Item>(`/api/admin/items/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(item),
  }),

  // Delete item
  deleteItem: (token: string, id: string, force = false) => fetchApi<void>(`/api/admin/items/${id}?force=${force}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),

  // Upload Photo
  uploadPhoto: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // We cannot use fetchApi for FormData because of Content-Type header manually set
    // fetchApi sets 'Content-Type': 'application/json' by default.
    // We need to bypass it.

    const response = await fetch(`${getApiBaseUrl()}/api/admin/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Upload error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    return result.data as { url: string; key: string; thumbnailUrl: string };
  },
};
