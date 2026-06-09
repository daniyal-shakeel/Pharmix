import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      logout: () => set({ user: null, token: null }),
    }),
    { name: "phx.auth" },
  ),
);

import api from "@/api/base";

export interface BackendCartItem {
  medicineId: string;
  name: string;
  price: number;
  qty: number;
}

export interface BackendCart {
  _id: string;
  pharmacyId: string;
  manufacturerId: string;
  items: BackendCartItem[];
  tax: number;
  shippingFee: number;
}

interface CartState {
  carts: BackendCart[];
  busyItems: string[];
  fetchCarts: () => Promise<void>;
  add: (medicineId: string, qty: number) => Promise<void>;
  remove: (medicineId: string) => Promise<void>;
  setQty: (medicineId: string, qty: number) => Promise<void>;
  clear: (manufacturerId?: string) => Promise<void>;
}

export const useCart = create<CartState>()((set, get) => ({
  carts: [],
  busyItems: [],
  fetchCarts: async () => {
    try {
      const res = await api.get("/cart");
      set({ carts: res.data });
    } catch (e) {
      console.error("Failed to fetch carts", e);
    }
  },
  add: async (medicineId, qty) => {
    try {
      set((s) => ({ busyItems: [...s.busyItems, medicineId] }));
      await api.post("/cart/add", { medicineId, qty });
      await get().fetchCarts();
    } catch (e) {
      throw e;
    } finally {
      set((s) => ({ busyItems: s.busyItems.filter((id) => id !== medicineId) }));
    }
  },
  remove: async (medicineId) => {
    try {
      set((s) => ({ busyItems: [...s.busyItems, medicineId] }));
      await api.post("/cart/update", { medicineId, qty: 0 });
      await get().fetchCarts();
    } catch (e) {
      throw e;
    } finally {
      set((s) => ({ busyItems: s.busyItems.filter((id) => id !== medicineId) }));
    }
  },
  setQty: async (medicineId, qty) => {
    try {
      set((s) => ({ busyItems: [...s.busyItems, medicineId] }));
      if (qty <= 0) {
        await api.post("/cart/update", { medicineId, qty: 0 });
      } else {
        await api.post("/cart/update", { medicineId, qty });
      }
      await get().fetchCarts();
    } catch (e) {
      throw e;
    } finally {
      set((s) => ({ busyItems: s.busyItems.filter((id) => id !== medicineId) }));
    }
  },
  clear: async (manufacturerId) => {
    try {
      await api.post("/cart/clear", manufacturerId ? { manufacturerId } : {});
      await get().fetchCarts();
    } catch (e) {
      throw e;
    }
  }
}));

interface ThemeState {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggle: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    { name: "phx.theme" },
  ),
);

interface Notification {
  id: string;
  recipientRole: Role;
  recipientId: string;
  title: string;
  message: string;
  type: 'order' | 'shipment' | 'payment' | 'approval' | 'system';
  metadata: any;
  isOpened: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Notification) => void;
  markAsOpened: (id: string) => Promise<void>;
  markAllAsOpened: () => Promise<void>;
}

export const useNotifications = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const res = await api.get("/notifications");
      const notifications = res.data;
      set({ 
        notifications, 
        unreadCount: notifications.filter((n: Notification) => !n.isOpened).length 
      });
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  },
  addNotification: (n) => {
    set((s) => {
      const exists = s.notifications.find(existing => existing.id === n.id);
      if (exists) return s;
      const newList = [n, ...s.notifications];
      return {
        notifications: newList,
        unreadCount: newList.filter(nt => !nt.isOpened).length
      };
    });
  },
  markAsOpened: async (id) => {
    try {
      await api.patch(`/notifications/${id}/open`);
      set((s) => {
        const newList = s.notifications.map(n => n.id === id ? { ...n, isOpened: true } : n);
        return {
          notifications: newList,
          unreadCount: newList.filter(nt => !nt.isOpened).length
        };
      });
    } catch (e) {
      console.error("Failed to mark as opened", e);
    }
  },
  markAllAsOpened: async () => {
    try {
      await api.patch("/notifications/open-all");
      set((s) => ({
        notifications: s.notifications.map(n => ({ ...n, isOpened: true })),
        unreadCount: 0
      }));
    } catch (e) {
      console.error("Failed to mark all as opened", e);
    }
  }
}));
