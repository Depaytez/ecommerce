/**
 * Product Card Component - Luxury Overhaul
 *
 * Modern luxury e-commerce product card featuring:
 * - Fluid aspect-ratio image container with secondary hover image preview
 * - Direct routing to /shop/products/[slug]
 * - Multi-currency support (NGN/USD) via useCurrency
 * - Accurate discount display and price formatting
 * - Animated wishlist toggle & quick add-to-bag via CartContext
 * - Responsive vertical & horizontal view modes
 */

"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Video,
  Loader2,
} from "lucide-react";
import type { Product } from "@/types";
import { getProductAverageRating } from "@/utils/supabase/services";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  viewMode?: "vertical" | "horizontal";
  className?: string;
}

function ProductCard({
  product,
  showQuickAdd = true,
  viewMode = "vertical",
  className = "",
}: ProductCardProps) {
  const user = useUser();
  const { success, error: showError } = useToast();
  const { addItem } = useCart();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist: checkIsInWishlist,
  } = useWishlist();
  const { formatPrice } = useCurrency();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [rating, setRating] = useState<{ average: number; count: number }>({
    average: 0,
    count: 0,
  });

  // Check if product is in wishlist on mount and when wishlist state changes
  useEffect(() => {
    if (user) {
      setIsWishlisted(checkIsInWishlist(product.id));
    }
  }, [user, product.id, checkIsInWishlist]);

  // Fetch product rating on mount
  useEffect(() => {
    let aborted = false;

    async function loadRating() {
      try {
        const { averageRating, totalReviews } = await getProductAverageRating(product.id);
        if (!aborted) {
          setRating({ average: averageRating, count: totalReviews });
        }
      } catch {
        // Silently handle missing ratings
      }
    }
    loadRating();

    return () => {
      aborted = true;
    };
  }, [product.id]);

  // Price & Discount calculations
  const displayPrice = product.discount_price && product.discount_price < product.price
    ? product.discount_price
    : product.price;

  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const usdPrice = (product as { usd_price?: number | null }).usd_price || null;
  const usdDiscountPrice = (product as { usd_discount_price?: number | null }).usd_discount_price || null;
  const exchangeRate = (product as { exchange_rate?: number }).exchange_rate || 0.00065;

  const hasVideo =
    product.attributes?.videos &&
    Array.isArray(product.attributes.videos) &&
    product.attributes.videos.length > 0;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : null;

  // Add to cart delegation
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        showError("Please log in to add items to bag");
        return;
      }

      setCartLoading(true);
      try {
        const ok = await addItem(product.id, quantity);
        if (ok) {
          success(`Added ${quantity} x ${product.name} to bag!`);
          setQuantity(1);
        } else {
          showError("Failed to add to bag. Please try again.");
        }
      } catch (err: unknown) {
        console.error("Error adding to cart:", err);
        showError("Failed to add to bag");
      } finally {
        setCartLoading(false);
      }
    },
    [user, product.id, product.name, quantity, addItem, success, showError]
  );

  // Wishlist toggle delegation
  const handleWishlistToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        showError("Please log in to manage your wishlist");
        return;
      }

      setWishlistLoading(true);
      try {
        if (isWishlisted) {
          const removed = await removeFromWishlist(product.id);
          if (removed) {
            setIsWishlisted(false);
            success("Removed from wishlist");
          } else {
            showError("Failed to remove from wishlist");
          }
        } else {
          const added = await addToWishlist(product.id);
          if (added) {
            setIsWishlisted(true);
            success("Saved to wishlist");
          } else {
            showError("Failed to add to wishlist");
          }
        }
      } catch {
        showError("Failed to update wishlist");
      } finally {
        setWishlistLoading(false);
      }
    },
    [user, product.id, isWishlisted, addToWishlist, removeFromWishlist, success, showError]
  );

  const handleQuantityChange = useCallback(
    (delta: number) => {
      const newQuantity = Math.max(1, Math.min(quantity + delta, product.stock_quantity));
      setQuantity(newQuantity);
    },
    [quantity, product.stock_quantity]
  );

  const renderStars = useCallback(() => {
    const fullStars = Math.floor(rating.average);
    const hasHalfStar = rating.average % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={12} className="text-radiance-amberAccentColor fill-current" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={12} className="text-gray-200" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star size={12} className="text-radiance-amberAccentColor fill-current" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={12} className="text-gray-200" />
        ))}
      </div>
    );
  }, [rating.average]);

  const productLink = `/shop/products/${product.slug}`;

  // VERTICAL LUXURY CARD (Default)
  if (viewMode === "vertical") {
    return (
      <div
        className={`group luxury-card relative flex flex-col justify-between overflow-hidden bg-white ${className}`}
      >
        {/* Image Showcase */}
        <div className="relative w-full aspect-square bg-[#FDFBF7] overflow-hidden">
          <Link href={productLink} className="block w-full h-full relative">
            {product.images && product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className={`object-cover transition-all duration-700 ease-out ${
                    secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                  }`}
                />
                {secondaryImage && (
                  <Image
                    src={secondaryImage}
                    alt={`${product.name} alternate view`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                    className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ShoppingCart size={40} />
              </div>
            )}
          </Link>

          {/* Discount Pill */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-md">
              -{discountPercentage}%
            </div>
          )}

          {/* Video Indicator */}
          {hasVideo && (
            <div className="absolute top-3 right-12 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full shadow-sm">
              <Video size={13} />
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm ${
              isWishlisted
                ? "bg-red-500 text-white scale-110"
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 hover:scale-110"
            } ${wishlistLoading ? "opacity-50" : ""}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={15} className={isWishlisted ? "fill-current" : ""} />
          </button>

          {/* Out of Stock Overlay */}
          {isOutOfStock ? (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase shadow-md">
                Out of Stock
              </span>
            </div>
          ) : isLowStock ? (
            <div className="absolute bottom-2.5 left-2.5 bg-amber-600/90 text-white px-2.5 py-1 rounded-md text-[11px] font-bold backdrop-blur-sm shadow-sm">
              Only {product.stock_quantity} Left
            </div>
          ) : null}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-radiance-goldColor block truncate">
              {product.category}
            </span>

            <Link href={productLink}>
              <h3 className="font-serif font-bold text-sm text-radiance-charcoalTextColor line-clamp-2 hover:text-radiance-goldColor transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {renderStars()}
              {rating.count > 0 && (
                <span className="text-[11px] text-gray-400">({rating.count})</span>
              )}
            </div>
          </div>

          {/* Pricing Display */}
          <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100">
            <span className="text-base font-bold text-radiance-charcoalTextColor">
              {formatPrice(displayPrice, usdDiscountPrice || usdPrice, exchangeRate)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price, usdPrice, exchangeRate)}
              </span>
            )}
          </div>

          {/* Quick Add To Bag Action */}
          {showQuickAdd && !isOutOfStock && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5">
                {/* Quantity Stepper */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(-1);
                    }}
                    disabled={quantity <= 1}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-semibold px-2 min-w-5 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityChange(1);
                    }}
                    disabled={quantity >= product.stock_quantity}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 py-2 px-3 bg-radiance-charcoalTextColor hover:bg-radiance-goldColor text-white text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
                >
                  {cartLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={13} />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // HORIZONTAL VIEW
  return (
    <div
      className={`group luxury-card relative flex overflow-hidden bg-white p-3 gap-4 ${className}`}
    >
      {/* Image Section */}
      <div className="relative w-36 h-36 bg-[#FDFBF7] rounded-xl overflow-hidden shrink-0">
        <Link href={productLink} className="block w-full h-full relative">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="144px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart size={32} />
            </div>
          )}
        </Link>

        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
            -{discountPercentage}%
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/80 text-gray-600 hover:text-red-500"
          }`}
        >
          <Heart size={13} className={isWishlisted ? "fill-current" : ""} />
        </button>
      </div>

      {/* Details Section */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-radiance-goldColor">
            {product.category}
          </span>
          <Link href={productLink}>
            <h3 className="font-serif font-bold text-sm text-radiance-charcoalTextColor hover:text-radiance-goldColor line-clamp-1 transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1">
            {renderStars()}
            {rating.count > 0 && <span className="text-[10px] text-gray-400">({rating.count})</span>}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-radiance-charcoalTextColor">
            {formatPrice(displayPrice, usdDiscountPrice || usdPrice, exchangeRate)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.price, usdPrice, exchangeRate)}
            </span>
          )}
        </div>

        {showQuickAdd && !isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartLoading}
            className="w-full py-1.5 px-3 bg-radiance-charcoalTextColor hover:bg-radiance-goldColor text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            {cartLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <ShoppingCart size={13} />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);
