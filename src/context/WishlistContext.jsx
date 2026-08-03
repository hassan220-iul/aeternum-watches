import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'aeternum_wishlist_v1';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isWishlisted: (id) => items.some((i) => i.id === id),
      toggleWishlist: (product) =>
        setItems((prev) =>
          prev.some((i) => i.id === product.id)
            ? prev.filter((i) => i.id !== product.id)
            : [...prev, product]
        ),
      removeFromWishlist: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
