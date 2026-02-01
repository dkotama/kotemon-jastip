import { useLocalStorage } from './useLocalStorage';
import type { Item, Token, JastipSettings, Activity, DashboardStats } from '@/types';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Generate random 5-digit token
const generateTokenCode = () => Math.floor(10000 + Math.random() * 90000).toString();

// Sample items for initial data
const sampleItems: Item[] = [
  {
    id: generateId(),
    name: 'KitKat Matcha Green Tea',
    description: 'Japanese matcha green tea flavored KitKat. Limited edition from Japan.',
    price: 45000,
    weight: 150,
    slots: 8,
    slotsAvailable: 8,
    maxSlots: 10,
    category: 'snack',
    status: 'available',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop',
    photos: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop'],
    images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop'],
    views: 124,
    infoNotes: [
      { id: generateId(), type: 'info', content: 'Limited stock available' }
    ],
    withoutBoxNote: null,
    isLimitedEdition: false,
    isPreorder: false,
    isFragile: true,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: generateId(),
    name: 'SK-II Facial Treatment Essence',
    description: 'Iconic facial treatment essence with Pitera. 75ml bottle.',
    price: 850000,
    weight: 200,
    slots: 3,
    slotsAvailable: 3,
    maxSlots: 5,
    category: 'skincare',
    status: 'low_stock',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    photos: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'],
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'],
    views: 89,
    infoNotes: [
      { id: generateId(), type: 'warning', content: 'High demand item' }
    ],
    withoutBoxNote: null,
    isLimitedEdition: false,
    isPreorder: false,
    isFragile: true,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: generateId(),
    name: 'Daiso Stationery Set',
    description: 'Cute stationery set including pens, sticky notes, and washi tape.',
    price: 75000,
    weight: 300,
    slots: 12,
    slotsAvailable: 12,
    maxSlots: 15,
    category: 'stationery',
    status: 'new',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop',
    photos: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop'],
    images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop'],
    views: 56,
    infoNotes: [],
    withoutBoxNote: null,
    isLimitedEdition: false,
    isPreorder: false,
    isFragile: false,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: generateId(),
    name: 'Tokyo Banana',
    description: 'Famous Tokyo souvenir - banana-shaped sponge cake with banana cream filling.',
    price: 120000,
    weight: 400,
    slots: 0,
    slotsAvailable: 0,
    maxSlots: 8,
    category: 'gift',
    status: 'full',
    image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop',
    photos: ['https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop'],
    images: ['https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop'],
    views: 203,
    infoNotes: [
      { id: generateId(), type: 'error', content: 'Out of stock' }
    ],
    withoutBoxNote: null,
    isLimitedEdition: false,
    isPreorder: false,
    isFragile: false,
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-14'),
  },
];

// Sample tokens
const sampleTokens: Token[] = [
  {
    id: generateId(),
    code: '12345',
    isUsed: false,
    createdAt: new Date('2025-01-10'),
  },
  {
    id: generateId(),
    code: '67890',
    isUsed: true,
    usedBy: {
      name: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    },
    usedAt: new Date('2025-01-12'),
    createdAt: new Date('2025-01-08'),
  },
  {
    id: generateId(),
    code: '54321',
    isUsed: false,
    createdAt: new Date('2025-01-14'),
  },
];

// Sample activities
const sampleActivities: Activity[] = [
  {
    id: generateId(),
    type: 'item_added',
    message: 'Added "Tokyo Banana" to items',
    timestamp: new Date('2025-01-15T10:30:00'),
  },
  {
    id: generateId(),
    type: 'token_used',
    message: 'Token 67890 used by Budi Santoso',
    timestamp: new Date('2025-01-12T14:22:00'),
  },
  {
    id: generateId(),
    type: 'token_generated',
    message: 'Generated new token: 54321',
    timestamp: new Date('2025-01-14T09:15:00'),
  },
  {
    id: generateId(),
    type: 'settings_updated',
    message: 'Updated Jastip settings',
    timestamp: new Date('2025-01-13T16:45:00'),
  },
];

// Default settings
const defaultSettings: JastipSettings = {
  isOpen: true,
  totalQuota: 100,
  arrivalDate: new Date('2025-02-15'),
  countdownTarget: new Date('2025-01-31T23:59:59'),
};

// Custom hook for store
export function useStore() {
  const [items, setItems] = useLocalStorage<Item[]>('jastip-items', sampleItems);
  const [tokens, setTokens] = useLocalStorage<Token[]>('jastip-tokens', sampleTokens);
  const [settings, setSettings] = useLocalStorage<JastipSettings>('jastip-settings', defaultSettings);
  const [activities, setActivities] = useLocalStorage<Activity[]>('jastip-activities', sampleActivities);

  // Dashboard stats
  const getDashboardStats = (): DashboardStats => {
    const totalProfit = items.reduce((sum, item) => sum + (item.price * (item.maxSlots - item.slotsAvailable)), 0);
    const totalViews = items.reduce((sum, item) => sum + item.views, 0);
    const activeTokens = tokens.filter(t => !t.isUsed).length;
    const totalOrders = items.reduce((sum, item) => sum + (item.maxSlots - item.slotsAvailable), 0);
    const pendingOrders = items.filter(i => i.status === 'new' || i.status === 'low_stock').length;

    return {
      totalItems: items.length,
      totalProfit,
      totalViews,
      activeTokens,
      totalOrders,
      pendingOrders,
    };
  };

  // Item actions
  const addItem = (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'views'>) => {
    const newItem: Item = {
      ...item,
      id: generateId(),
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems(prev => [newItem, ...prev]);
    addActivity('item_added', `Added "${newItem.name}" to items`);
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
    ));
    addActivity('item_updated', `Updated item details`);
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    if (item) {
      addActivity('item_deleted', `Deleted "${item.name}"`);
    }
  };

  const getItemById = (id: string) => items.find(item => item.id === id);

  // Token actions
  const generateToken = () => {
    const newToken: Token = {
      id: generateId(),
      code: generateTokenCode(),
      isUsed: false,
      createdAt: new Date(),
    };
    setTokens(prev => [newToken, ...prev]);
    addActivity('token_generated', `Generated new token: ${newToken.code}`);
    return newToken;
  };

  const deleteToken = (id: string) => {
    setTokens(prev => prev.filter(token => token.id !== id));
  };

  const revokeToken = (id: string) => {
    setTokens(prev => prev.map(token =>
      token.id === id
        ? { ...token, isUsed: false, usedBy: undefined, usedAt: undefined }
        : token
    ));
    addActivity('settings_updated', 'Revoked token access');
  };

  const validateToken = (code: string): boolean => {
    const token = tokens.find(t => t.code === code && !t.isUsed);
    return !!token;
  };

  const useToken = (code: string, user: { name: string; email: string; avatar?: string }) => {
    setTokens(prev => prev.map(token =>
      token.code === code
        ? { ...token, isUsed: true, usedBy: user, usedAt: new Date() }
        : token
    ));
    addActivity('token_used', `Token ${code} used by ${user.name}`);
  };

  // Settings actions
  const updateSettings = (updates: Partial<JastipSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    addActivity('settings_updated', 'Updated Jastip settings');
  };

  // Activity actions
  const addActivity = (type: Activity['type'], message: string) => {
    const newActivity: Activity = {
      id: generateId(),
      type,
      message,
      timestamp: new Date(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  return {
    // Data
    items,
    tokens,
    settings,
    activities,

    // Stats
    getDashboardStats,

    // Actions
    addItem,
    updateItem,
    deleteItem,
    getItemById,

    generateToken,
    deleteToken,
    revokeToken,
    validateToken,
    useToken,

    updateSettings,

    addActivity,
  };
}
