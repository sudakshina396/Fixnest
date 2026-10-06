import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartService {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  duration: string | number;
  image?: string;
}

interface CartState { items: CartService[] }
const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]') as CartService[],
};

const persist = (items: CartService[]) => localStorage.setItem('cart', JSON.stringify(items));
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartService>) {
      if (state.items.some((item) => item._id === action.payload._id)) return;
      state.items.push(action.payload);
      persist(state.items);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item._id !== action.payload);
      persist(state.items);
    },
    clearCart(state) { state.items = []; persist(state.items); },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
