/**
 * Currency Selector & Switcher Component
 *
 * Displays current currency detected from geolocation/locale
 * and allows quick switching between NGN and USD.
 */

"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-amber-200/60 rounded-full text-xs font-semibold text-radiance-charcoalTextColor hover:border-radiance-goldColor transition-all shadow-xs"
        aria-label="Select currency"
        aria-expanded={isOpen}
      >
        <Globe size={13} className="text-radiance-goldColor flex-shrink-0" />
        <span className="font-bold">{currency === "NGN" ? "₦ NGN" : "$ USD"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-amber-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            type="button"
            onClick={() => {
              setCurrency("NGN");
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
              currency === "NGN" ? "bg-amber-50/80 font-bold text-radiance-goldColor" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm">₦</span>
              <span>NGN (Naira)</span>
            </span>
            {currency === "NGN" && <Check size={14} className="text-radiance-goldColor" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrency("USD");
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
              currency === "USD" ? "bg-amber-50/80 font-bold text-radiance-goldColor" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm">$</span>
              <span>USD (Dollar)</span>
            </span>
            {currency === "USD" && <Check size={14} className="text-radiance-goldColor" />}
          </button>
        </div>
      )}
    </div>
  );
}
