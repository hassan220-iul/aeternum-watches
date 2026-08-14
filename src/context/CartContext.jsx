import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'aeternum_cart_v1';
const COUPON_KEY = 'aeternum_cart_coupon_v1';

function readInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
function readInitialCoupon() {
  try {
    const stored = localStorage.getItem(COUPON_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.product.id ? { ...i, quantity: i.quantity + action.quantity } : i
        );
      }
      return [...state, { ...action.product, quantity: action.quantity }];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i
      );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

function couponReducer(state, action) {
  switch (action.type) {
    case 'APPLY_COUPON':
      return { code: action.code, percentOff: action.percentOff };
    case 'CLEAR_COUPON':
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, readInitialState);
  const [coupon, dispatchCoupon] = useReducer(couponReducer, undefined, readInitialCoupon);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon]);

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const discount = coupon ? subtotal * (coupon.percentOff / 100) : 0;
    const total = subtotal - discount;

    function handleAction(action) {
      dispatch(action);
      dispatchCoupon(action);
    }

    return {
      items,
      subtotal,
      itemCount,
      coupon,
      discount,
      total,
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD', product, quantity }),
      removeItem: (id) => dispatch({ type: 'REMOVE', id }),
      updateQuantity: (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity }),
      applyCoupon: (code, percentOff) => dispatchCoupon({ type: 'APPLY_COUPON', code, percentOff }),
      clearCoupon: () => dispatchCoupon({ type: 'CLEAR_COUPON' }),
      clearCart: () => handleAction({ type: 'CLEAR' }),
    };
  }, [items, coupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
