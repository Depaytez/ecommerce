/**
 * =============================================================================
 * Currency Provider - Multi-Currency Context
 * =============================================================================
 *
 * Provides global currency state management:
 * - Detect user's currency (NGN/USD)
 * - Allow manual currency switching
 * - Format prices in selected currency
 * - Persist currency preference
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { detectUserCurrency, formatCurrency, getPriceInCurrency, type CurrencyCode } from "@/utils/currency";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (ngnPrice: number, usdPrice?: number | null, exchangeRate?: number) => string;
  getPrice: (ngnPrice: number, usdPrice?: number | null, exchangeRate?: number) => number;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("NGN");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load currency preference on mount
  useEffect(() => {
    try {
      // Check localStorage first
      const saved = typeof window !== "undefined" ? localStorage.getItem("currency") : null;
      
      if (saved && (saved === "NGN" || saved === "USD")) {
        setCurrencyState(saved);
      } else {
        // Auto-detect based on location
        const detected = detectUserCurrency();
        setCurrencyState(detected);
      }
    } catch (error) {
      console.error("Error loading currency preference:", error);
      setCurrencyState("NGN");
    }
    setIsLoaded(true);
  }, []);

  // Save currency preference when changed
  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("currency", newCurrency);
      }
    } catch (error) {
      console.error("Error saving currency preference:", error);
    }
  }, []);

  // Toggle between NGN and USD
  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "NGN" ? "USD" : "NGN");
  }, [currency, setCurrency]);

  // Format price based on selected currency
  const formatPrice = useCallback((
    ngnPrice: number,
    usdPrice?: number | null,
    exchangeRate?: number
  ): string => {
    const price = getPriceInCurrency(ngnPrice, usdPrice || null, currency, exchangeRate);
    return formatCurrency(price, currency);
  }, [currency]);

  // Get numeric price based on selected currency
  const getPrice = useCallback((
    ngnPrice: number,
    usdPrice?: number | null,
    exchangeRate?: number
  ): number => {
    return getPriceInCurrency(ngnPrice, usdPrice || null, currency, exchangeRate);
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    formatPrice,
    getPrice,
    toggleCurrency,
  }), [currency, setCurrency, formatPrice, getPrice, toggleCurrency]);


  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
