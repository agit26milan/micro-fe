'use client';

import { useState, useEffect } from 'react';

// Tipe untuk shared state
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface SharedState {
  user: User | null;
  cart: CartItem[];
  isLoading: boolean;
}

// Default state
const defaultState: SharedState = {
  user: null,
  cart: [],
  isLoading: true,
};

// Global state container (client-side only, initialized lazily)
let globalState: SharedState = { ...defaultState };
let globalListeners: Set<(state: SharedState) => void> = new Set();

function notifyListeners() {
  globalListeners.forEach((listener) => listener({ ...globalState }));
}

// Actions
export const sharedActions = {
  setUser(user: User | null) {
    globalState = { ...globalState, user, isLoading: false };
    notifyListeners();
  },

  addToCart(item: CartItem) {
    const existingIndex = globalState.cart.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      const updatedCart = [...globalState.cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + item.quantity,
      };
      globalState = { ...globalState, cart: updatedCart };
    } else {
      globalState = { ...globalState, cart: [...globalState.cart, item] };
    }
    notifyListeners();
  },

  removeFromCart(itemId: string) {
    globalState = {
      ...globalState,
      cart: globalState.cart.filter((i) => i.id !== itemId),
    };
    notifyListeners();
  },

  clearCart() {
    globalState = { ...globalState, cart: [] };
    notifyListeners();
  },

  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      sharedActions.removeFromCart(itemId);
      return;
    }
    globalState = {
      ...globalState,
      cart: globalState.cart.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      ),
    };
    notifyListeners();
  },

  getState(): SharedState {
    return { ...globalState };
  },
};

// Hook untuk React components
export function useSharedStore(): SharedState & {
  actions: typeof sharedActions;
} {
  const [state, setState] = useState<SharedState>(globalState);

  useEffect(() => {
    const listener = (newState: SharedState) => setState(newState);
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  return { ...state, actions: sharedActions };
}
