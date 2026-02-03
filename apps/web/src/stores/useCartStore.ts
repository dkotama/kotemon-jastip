
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Internal UUID for cart management
    itemId?: string; // Standard item ID
    name: string;
    price: number; // IDR (Selling Price)
    weight: number;
    quantity: number;
    image?: string;
    // Custom Item Fields
    isCustom?: boolean;
    customUrl?: string;
    customNote?: string;
    customSource?: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: (isOpen?: boolean) => void;
    isCustomItemModalOpen: boolean;
    toggleCustomItemModal: (isOpen?: boolean) => void;
    totalPrice: () => number;
    totalWeight: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                set((state) => {
                    // Check if item already exists (only for standard items)
                    if (!newItem.isCustom) {
                        const existingItem = state.items.find(i => i.itemId === newItem.itemId);
                        if (existingItem) {
                            return {
                                items: state.items.map(i =>
                                    i.itemId === newItem.itemId
                                        ? { ...i, quantity: i.quantity + newItem.quantity }
                                        : i
                                ),
                                isOpen: true,
                            };
                        }
                    }

                    // Add new item
                    return {
                        items: [...state.items, { ...newItem, id: crypto.randomUUID() }],
                        isOpen: true,
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
                    ),
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            toggleCart: (isOpen) => {
                set((state) => ({
                    isOpen: isOpen !== undefined ? isOpen : !state.isOpen
                }));
            },

            isCustomItemModalOpen: false,
            toggleCustomItemModal: (isOpen) => {
                set((state) => ({
                    isCustomItemModalOpen: isOpen !== undefined ? isOpen : !state.isCustomItemModalOpen
                }));
            },

            totalPrice: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            totalWeight: () => {
                return get().items.reduce((total, item) => total + (item.weight * item.quantity), 0);
            }
        }),
        {
            name: 'kotemon-cart-storage',
        }
    )
);
