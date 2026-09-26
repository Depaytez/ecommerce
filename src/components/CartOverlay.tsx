/**
 * Cart Overlay Component - Luxury Overhaul
 *
 * Slide-over bag modal featuring:
 * - Next.js optimized images
 * - Multi-currency price formatting via useCurrency
 * - Free Shipping progress indicator (₦50,000 threshold)
 * - Correct routing to /shop/products/[slug]
 * - Smooth quantity steppers and deletions
 */

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight } from "lucide-react";
import type { CartItem } from "@/types";
import { useCurrency } from "@/context/CurrencyContext";

interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function CartOverlay({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
}: CartOverlayProps) {
  const { formatPrice } = useCurrency();

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product?.discount_price || item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isFreeShipping = subtotal > 50000;
  const progressPercent = Math.min(100, Math.round((subtotal / 50000) * 100));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:justify-end px-3 sm:px-6 pb-24 md:pb-28 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Luxury Cart Drawer Card */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 pointer-events-auto border border-gray-100 flex flex-col max-h-[75vh] animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-radiance-goldColor" />
            <h2 className="text-sm font-serif font-bold text-radiance-charcoalTextColor tracking-wide">
              Your Luxury Bag ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {cart.length > 0 && (
          <div className="py-2.5 px-3 bg-amber-50/50 rounded-xl my-2 border border-amber-100/50">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <Truck size={13} className="text-radiance-goldColor" />
                {isFreeShipping ? "Free Delivery Unlocked!" : "Complimentary Delivery"}
              </span>
              <span className="text-amber-800 font-bold">
                {isFreeShipping ? "100%" : `${progressPercent}%`}
              </span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-radiance-goldColor h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {!isFreeShipping && (
              <p className="text-[10px] text-amber-700/80 mt-1">
                Add ₦{(50000 - subtotal).toLocaleString()} more for free shipping
              </p>
            )}
          </div>
        )}

        {/* Cart Item Scrollable List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {cart.length > 0 ? (
            cart.map((item) => {
              const unitPrice = item.product?.discount_price || item.product?.price || 0;
              const productSlug = item.product?.slug || item.product_id;
              const image = item.product?.images?.[0];

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 bg-[#FDFBF7]/40 hover:bg-[#FDFBF7] transition"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-gray-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={item.product?.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={16} />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/products/${productSlug}`}
                      onClick={onClose}
                      className="block font-semibold text-xs text-radiance-charcoalTextColor hover:text-radiance-goldColor transition-colors truncate"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      {formatPrice(unitPrice)}
                    </p>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity === 1) {
                          onRemoveItem(item.id);
                        } else {
                          onUpdateQuantity(item.id, -1);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      {item.quantity === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} />}
                    </button>

                    <span className="text-xs font-bold text-gray-800 px-2 min-w-5 text-center">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 space-y-2">
              <ShoppingBag size={40} className="mx-auto text-gray-300 stroke-[1.5]" />
              <p className="text-gray-600 text-xs font-medium">Your luxury bag is empty</p>
            </div>
          )}
        </div>

        {/* Footer Checkout Actions */}
        {cart.length > 0 && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-xs text-gray-500 font-medium">Subtotal</span>
              <span className="text-lg font-bold text-radiance-charcoalTextColor font-serif">
                {formatPrice(subtotal)}
              </span>
            </div>

            <Link
              href="/shop/checkout"
              onClick={onClose}
              className="w-full py-3.5 px-4 bg-radiance-goldColor hover:bg-radiance-charcoalTextColor text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
