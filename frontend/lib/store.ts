import { create } from "zustand";

interface ProductSize {
  id?: number;
  product_id?: number;
  size: string;
  quantity: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  image_url?: string;
  attributes?: Record<string, any>;
  sizes?: ProductSize[];
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  size: string;
}

interface AppState {
  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  
  // Multiple Carts System
  carts: { [cartId: string]: CartItem[] };
  activeCartId: string;
  createCart: () => void;
  switchCart: (cartId: string) => void;
  closeCart: (cartId: string) => void;
  addToCart: (product: Product, quantity?: number, size?: string) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateCartItem: (productId: number, size: string, quantity: number, discount?: number) => void;
  clearActiveCart: () => void;
  
  // Customer
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any | null) => void;
}

export const useStore = create<AppState>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  
  carts: { "cart_1": [] },
  activeCartId: "cart_1",
  
  createCart: () => set((state) => {
    const newCartId = `cart_${Object.keys(state.carts).length + 1}_${Date.now()}`;
    return {
      carts: { ...state.carts, [newCartId]: [] },
      activeCartId: newCartId
    };
  }),
  
  switchCart: (cartId) => set({ activeCartId: cartId }),
  
  closeCart: (cartId) => set((state) => {
    const newCarts = { ...state.carts };
    delete newCarts[cartId];
    // If we closed the active cart, switch to another one, or create a new one
    const cartIds = Object.keys(newCarts);
    let nextActiveId = state.activeCartId;
    if (state.activeCartId === cartId) {
      nextActiveId = cartIds.length > 0 ? cartIds[0] : `cart_${Date.now()}`;
      if (cartIds.length === 0) {
        newCarts[nextActiveId] = [];
      }
    }
    return { carts: newCarts, activeCartId: nextActiveId };
  }),

  addToCart: (product, quantity = 1, size = "8") =>
    set((state) => {
      const activeCart = state.carts[state.activeCartId] || [];
      const existingItem = activeCart.find((item) => item.product.id === product.id && item.size === size);
      
      let updatedCart;
      if (existingItem) {
        updatedCart = activeCart.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedCart = [...activeCart, { product, quantity, discount: 0, size }];
      }
      
      return {
        carts: { ...state.carts, [state.activeCartId]: updatedCart }
      };
    }),
    
  removeFromCart: (productId, size) =>
    set((state) => ({
      carts: {
        ...state.carts,
        [state.activeCartId]: (state.carts[state.activeCartId] || []).filter(
          item => !(item.product.id === productId && item.size === size)
        )
      }
    })),
    
  updateCartItem: (productId, size, quantity, discount = 0) =>
    set((state) => ({
      carts: {
        ...state.carts,
        [state.activeCartId]: (state.carts[state.activeCartId] || []).map((item) =>
          item.product.id === productId && item.size === size
            ? { ...item, quantity, discount }
            : item
        )
      }
    })),
    
  clearActiveCart: () => set((state) => ({ 
    carts: { ...state.carts, [state.activeCartId]: [] } 
  })),
  
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
}));
