/**
 * =============================================================================
 * Product Card Component - REDESIGNED v2
 * =============================================================================
 *
 * Modern product card with:
 * - Fixed dimensions: 301px x 400px
 * - Vertical/Horizontal view modes
 * - Working like/wishlist button
 * - Modern UI design
 * - Responsive but consistent sizing
 */

"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Video,
  Eye,
  Check,
} from "lucide-react";
import { Product } from "@/types";
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

  // Check if product is in wishlist on mount and when wishlist changes
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
        const { averageRating, totalReviews } = await getProductAverageRating(
          product.id,
        );
        if (!aborted) {
          setRating({ average: averageRating, count: totalReviews });
        }
      } catch (error) {
        // Silently handle errors
      }
    }
    loadRating();

    return () => {
      aborted = true;
    };
  }, [product.id]);

  // Calculate display price
  const displayPrice = product.discount_price || product.price;
  const hasDiscount =
    product.discount_price && product.discount_price < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - product.discount_price!) / product.price) * 100,
      )
    : 0;

  // Get USD prices from product (stored in database)
  const usdPrice = (product as any).usd_price || null;
  const usdDiscountPrice = (product as any).usd_discount_price || null;
  const exchangeRate = (product as any).exchange_rate || 0.00065;

  // Check if product has video
  const hasVideo =
    product.attributes?.videos &&
    Array.isArray(product.attributes.videos) &&
    product.attributes.videos.length > 0;

  // Handle add to cart
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        showError("Please log in to add items to cart");
        return;
      }

      setCartLoading(true);
      try {
        const ok = await addItem(product.id, quantity);
        if (ok) {
          success(`Added ${quantity} x ${product.name} to cart!`);
          setQuantity(1);
        } else {
          showError("Failed to add to cart");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        showError("Failed to add to cart");
      } finally {
        setCartLoading(false);
      }
    },
    [user, product.id, product.name, quantity, addItem, success, showError],
  );

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        showError("Please log in to manage wishlist");
        return;
      }

      setWishlistLoading(true);
      try {
        if (isWishlisted) {
          const successResult = await removeFromWishlist(product.id);
          if (successResult) {
            success("Removed from wishlist");
          } else {
            showError("Failed to remove from wishlist");
          }
        } else {
          const successResult = await addToWishlist(product.id);
          if (successResult) {
            success("Added to wishlist");
          } else {
            showError("Failed to add to wishlist");
          }
        }
      } catch (error) {
        showError("Failed to update wishlist");
      } finally {
        setWishlistLoading(false);
      }
    },
    [
      user,
      product.id,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      success,
      showError,
    ],
  );

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (delta: number) => {
      const newQuantity = Math.max(
        1,
        Math.min(quantity + delta, product.stock_quantity),
      );
      setQuantity(newQuantity);
    },
    [quantity, product.stock_quantity],
  );

  // Render star rating
  const renderStars = useCallback(() => {
    const fullStars = Math.floor(rating.average);
    const hasHalfStar = rating.average % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            size={12}
            className="text-yellow-400 fill-current"
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={12} className="text-gray-300" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star size={12} className="text-yellow-400 fill-current" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={12} className="text-gray-300" />
        ))}
      </div>
    );
  }, [rating.average]);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  // VERTICAL VIEW (default)
  if (viewMode === "vertical") {
    return (
      <div
        className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-full max-w-75.25 ${className}`}
      >
        {/* Image Section */}
        <div className="relative w-full aspect-square bg-gray-100">
          <Link href={`/products/${product.slug}`} className="block">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="301px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                <ShoppingCart size={48} />
              </div>
            )}
          </Link>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-md">
              -{discountPercentage}%
            </div>
          )}

          {/* Video Indicator */}
          {hasVideo && (
            <div className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full">
              <Video size={14} />
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 shadow-md ${
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
            } ${wishlistLoading ? "opacity-50" : ""}`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
          </button>

          {/* Stock Status */}
          {isOutOfStock ? (
            <div className="absolute bottom-2 left-2 bg-gray-900/90 text-white px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm">
              Out of Stock
            </div>
          ) : isLowStock ? (
            <div className="absolute bottom-2 left-2 bg-orange-500/90 text-white px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm">
              Only {product.stock_quantity} left
            </div>
          ) : null}
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          {/* Category */}
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium truncate">
            {product.category}
          </div>

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-radiance-goldColor transition-colors min-h-10">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {renderStars()}
            {rating.count > 0 && (
              <span className="text-xs text-gray-500">({rating.count})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-radiance-goldColor">
              {formatPrice(product.price, usdPrice, exchangeRate)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.price, usdPrice, exchangeRate)}
              </span>
            )}
          </div>

          {/* Quick Add Section */}
          {showQuickAdd && !isOutOfStock && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(-1);
                  }}
                  className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                  disabled={quantity <= 1}
                >
                  <Minus
                    size={12}
                    className={
                      quantity <= 1 ? "text-gray-300" : "text-gray-600"
                    }
                  />
                </button>
                <span className="text-xs font-semibold w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(1);
                  }}
                  className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus
                    size={12}
                    className={
                      quantity >= product.stock_quantity
                        ? "text-gray-300"
                        : "text-gray-600"
                    }
                  />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  cartLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-radiance-charcoalTextColor text-white hover:bg-radiance-goldColor shadow-sm hover:shadow-md"
                }`}
              >
                {cartLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stock Counter */}
          {!isOutOfStock && showQuickAdd && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Check size={10} className="text-green-500" />
              <span>{product.stock_quantity} in stock</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // HORIZONTAL VIEW
  return (
    <div
      className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex ${className}`}
      style={{ width: "301px", minHeight: "400px" }}
    >
      {/* Image Section - Left */}
      <div className="relative w-full h-40 bg-gray-100 shrink-0">
        <Link href={`/products/${product.slug}`} className="block">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="301px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
              <ShoppingCart size={48} />
            </div>
          )}
        </Link>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-md">
            -{discountPercentage}%
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 shadow-md ${
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
          } ${wishlistLoading ? "opacity-50" : ""}`}
        >
          <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
        </button>
      </div>

      {/* Content Section - Right */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Category */}
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium truncate">
            {product.category}
          </div>

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-radiance-goldColor transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {renderStars()}
            {rating.count > 0 && (
              <span className="text-xs text-gray-500">({rating.count})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-radiance-goldColor">
              ₦{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                ₦{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart */}
        {showQuickAdd && !isOutOfStock && (
          <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                cartLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-radiance-charcoalTextColor text-white hover:bg-radiance-goldColor shadow-sm hover:shadow-md"
              }`}
            >
              {cartLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Add to Cart
                </>
              )}
            </button>

            {/* Stock Counter */}
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Check size={10} className="text-green-500" />
              <span>{product.stock_quantity} in stock</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);
