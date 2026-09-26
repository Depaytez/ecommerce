/**
 * Cart Context
 * 
 * Provides global cart state management adhering to DDD principles.
 * Utilizes SupabaseCartRepository and CartService.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "./UserContext";
import type { CartItem, Product } from "@/types";
import { SupabaseCartRepository } from "@/domains/cart/cart.repository";
import { CartService } from "@/domains/cart/cart.service";

interface CartContextType {
  cart: CartItem[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
  isFreeShipping: boolean;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, delta: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lazy instantiate repository instance
  const cartRepo = useMemo(() => new SupabaseCartRepository(), []);

  // Fetch cart from repository
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart([]);
      setIsLoading(false);
      return;
    }

    try {
      const items = await cartRepo.fetchUserCart(user.id);
      const transformedCart: CartItem[] = items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity,
        added_at: item.added_at,
        updated_at: item.updated_at,
        product: item.product as unknown as Product,
      }));

      setCart(transformedCart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, cartRepo]);

  // Load cart when user logs in
  useEffect(() => {
    refreshCart();
  }, [user, refreshCart]);

  // Add item to cart through repository
  const addItem = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      if (!user) return false;

      try {
        const item = await cartRepo.addItem(user.id, productId, quantity);
        if (item) {
          await refreshCart();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error adding to cart:", error);
        return false;
      }
    },
    [user, cartRepo, refreshCart]
  );

  // Remove item
  const removeItem = useCallback(
    async (cartItemId: string) => {
      const previousCart = [...cart];
      setCart((prev) => prev.filter((c) => c.id !== cartItemId));

      try {
        const success = await cartRepo.removeItem(cartItemId);
        if (!success) {
          setCart(previousCart);
        }
      } catch (error) {
        console.error("Error removing item:", error);
        setCart(previousCart);
      }
    },
    [cart, cartRepo]
  );

  // Update quantity with optimistic updates
  const updateQuantity = useCallback(
    async (cartItemId: string, delta: number) => {
      const item = cart.find((c) => c.id === cartItemId);
      if (!item) return;

      const newQuantity = Math.max(0, item.quantity + delta);
      const previousCart = [...cart];

      // Optimistic update
      setCart((prev) =>
        prev.map((c) => (c.id === cartItemId ? { ...c, quantity: newQuantity } : c))
      );

      if (newQuantity === 0) {
        await removeItem(cartItemId);
        return;
      }

      try {
        const success = await cartRepo.updateQuantity(cartItemId, newQuantity);
        if (!success) {
          setCart(previousCart);
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        setCart(previousCart);
      }
    },
    [cart, cartRepo, removeItem]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      await cartRepo.clearCart(user.id);
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  }, [user, cartRepo]);

  // Calculate totals using CartService pure domain calculations
  const totals = useMemo(() => {
    return CartService.calculateTotals(
      cart.map((item) => ({
        product: item.product as unknown as Product,
        quantity: item.quantity,
      }))
    );
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      totalItems: totals.itemCount,
      totalPrice: totals.total,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      isFreeShipping: totals.isFreeShipping,
      isLoading,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      cart,
      totals,
      isLoading,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
