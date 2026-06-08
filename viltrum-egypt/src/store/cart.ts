import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addBundle: (items: CartItem[], bundlePrice: number, bundleLabel: string) => void;
  removeItem: (productId: string, size: string) => void;
  removeBundle: (bundleId: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product_id === newItem.product_id && item.size === newItem.size && !item.bundle_id
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        }),

      addBundle: (bundleItems, bundlePrice, bundleLabel) =>
        set((state) => {
          const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const itemCount = bundleItems.length;
          // Split the total bundle price evenly across items
          const perItemPrice = Math.floor(bundlePrice / itemCount);
          // Put any remainder cents on the last item
          const remainder = bundlePrice - perItemPrice * itemCount;

          const taggedItems: CartItem[] = bundleItems.map((item, i) => ({
            ...item,
            bundle_id: bundleId,
            bundle_label: bundleLabel,
            price: i === itemCount - 1 ? perItemPrice + remainder : perItemPrice,
            quantity: 1,
          }));

          return { items: [...state.items, ...taggedItems] };
        }),

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product_id === productId && item.size === size && !item.bundle_id)
          ),
        })),

      removeBundle: (bundleId) =>
        set((state) => ({
          items: state.items.filter((item) => item.bundle_id !== bundleId),
        })),

      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId && item.size === size && !item.bundle_id
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "viltrum-cart-v4",
    }
  )
);
