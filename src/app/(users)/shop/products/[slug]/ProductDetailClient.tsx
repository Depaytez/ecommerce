/**
 * =============================================================================
 * Product Detail Client Component - REBUILT v2
 * =============================================================================
 *
 * Client-side interactive features with modern UI
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Product } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import RichTextViewer from "@/components/products/RichTextViewer";
import ProductRecommendations from "@/components/products/ProductRecommendations";

interface ProductDetailClientProps {
  product: Product;
  breadcrumbItems: Array<{ name: string; url: string; position: number }>;
  hasDiscount: boolean;
  discountPercentage: number;
  displayPrice: number;
  ratingData: { averageRating: number; totalReviews: number };
}

function ProductDetailContent({
  product,
  breadcrumbItems,
  hasDiscount,
  discountPercentage,
  displayPrice,
  ratingData,
}: ProductDetailClientProps) {
  const user = useUser();
  const { success, error: showError } = useToast();
  const { addItem } = useCart();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist: checkIsInWishlist,
  } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // All media (images + videos)
  const allMedia = [
    ...(product.images || []),
    ...(Array.isArray(product.attributes?.videos)
      ? product.attributes.videos
      : []),
  ];

  // Check if current media is video
  const isVideo = (index: number) => {
    const media = allMedia[index];
    return media?.match(/\.(mp4|webm|mov)$/i);
  };

  // Check if product is in wishlist on mount and when wishlist changes
  useEffect(() => {
    if (user) {
      setIsWishlisted(checkIsInWishlist(product.id));
    }
  }, [user, product.id, checkIsInWishlist]);

  // Handle add to cart - Uses CartContext.addItem for real-time updates
  const handleAddToCart = useCallback(async () => {
    if (!user) {
      showError("Please log in to add items to cart");
      return;
    }

    setCartLoading(true);
    try {
      const successResult = await addItem(product.id, quantity);
      if (successResult) {
        success(`Added ${quantity} x ${product.name} to cart!`);
        setQuantity(1);
        // Cart updates automatically via context
      } else {
        showError("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showError("Failed to add to cart");
    } finally {
      setCartLoading(false);
    }
  }, [user, product.id, product.name, quantity, addItem, success, showError]);

  // Handle wishlist toggle - Uses WishlistContext for real-time updates
  const handleWishlistToggle = useCallback(async () => {
    if (!user) {
      showError("Please log in to manage wishlist");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const successResult = await removeFromWishlist(product.id);
        if (successResult) {
          setIsWishlisted(false);
          success("Removed from wishlist");
        } else {
          showError("Failed to remove from wishlist");
        }
      } else {
        const successResult = await addToWishlist(product.id);
        if (successResult) {
          setIsWishlisted(true);
          success("Added to wishlist");
        } else {
          showError("Failed to add to wishlist");
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      showError("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  }, [
    user,
    product.id,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    success,
    showError,
  ]);

  // Handle share
  const handleShare = useCallback(async () => {
    setShareLoading(true);
    try {
      const shareData = {
        title: product.name,
        text: `Check out ${product.name} on JRADIANCE`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        success("Thanks for sharing!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        success("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share error:", error);
      }
    } finally {
      setShareLoading(false);
    }
  }, [product.name, success]);

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

  // Handle image navigation
  const goToPreviousImage = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : allMedia.length - 1,
    );
  }, [allMedia.length]);

  const goToNextImage = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev < allMedia.length - 1 ? prev + 1 : 0,
    );
  }, [allMedia.length]);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor">
      <article className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 flex-wrap">
            {breadcrumbItems.map((item, index) => (
              <li key={item.position} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-gray-500" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <a
                    href={item.url}
                    className="text-radiance-goldColor hover:underline"
                  >
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images Section */}
          <section aria-label="Product images" className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
              {allMedia[selectedImageIndex] ? (
                isVideo(selectedImageIndex) ? (
                  <video
                    src={allMedia[selectedImageIndex]}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <Image
                    src={allMedia[selectedImageIndex]}
                    alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingCart size={64} />
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  -{discountPercentage}% OFF
                </div>
              )}

              {/* Navigation Arrows */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  {selectedImageIndex + 1} / {allMedia.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-radiance-goldColor shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {isVideo(index) ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Video size={24} className="text-white" />
                      </div>
                    ) : (
                      <Image
                        src={media}
                        alt={`${product.name} - Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 12vw"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Product Info Section */}
          <section aria-label="Product details" className="space-y-6">
            {/* Category and SKU */}
            <div className="space-y-2">
              <p className="text-xs text-radiance-goldColor font-bold uppercase tracking-wider">
                {product.category}
              </p>
              {product.sku && (
                <p className="text-xs text-gray-500 font-mono">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-black text-radiance-charcoalTextColor leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={`${
                      star <= Math.round(ratingData.averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {ratingData.averageRating > 0
                  ? `${ratingData.averageRating.toFixed(1)} (${ratingData.totalReviews} reviews)`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-radiance-goldColor">
                ₦{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-gray-500 line-through">
                  ₦{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
                  <Check size={18} />
                  <span className="text-sm font-bold">Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
                  <Check size={18} />
                  <span className="text-sm font-bold">
                    Only {product.stock_quantity} left - Order soon!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <Check size={18} />
                  <span className="text-sm font-bold">
                    In Stock ({product.stock_quantity} available)
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-3">
                <h2 className="font-bold text-lg text-radiance-charcoalTextColor">
                  Description
                </h2>
                <RichTextViewer content={product.description} />
              </div>
            )}

            {/* Product Attributes */}
            {product.attributes &&
              Object.keys(product.attributes).length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-bold text-lg text-radiance-charcoalTextColor">
                    Product Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(product.attributes)
                      .filter(([key]) => key !== "videos")
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="text-sm bg-white px-3 py-2 rounded-lg border border-gray-100"
                        >
                          <span className="font-semibold capitalize text-gray-700">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="ml-2 text-gray-600">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            {!isOutOfStock && (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-radiance-goldColor hover:bg-radiance-goldColor/10 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-xl font-bold w-16 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:border-radiance-goldColor hover:bg-radiance-goldColor/10 transition-colors"
                      disabled={quantity >= product.stock_quantity}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart & Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="flex-1 bg-radiance-charcoalTextColor text-white py-4 px-6 rounded-full font-bold text-base hover:bg-radiance-goldColor transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cartLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className={`p-4 rounded-full border-2 transition-all ${
                      isWishlisted
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-300"
                    } disabled:opacity-50`}
                    aria-label="Add to wishlist"
                  >
                    {wishlistLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    ) : (
                      <Heart
                        size={20}
                        className={isWishlisted ? "fill-current" : ""}
                      />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="p-4 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
                    aria-label="Share product"
                  >
                    {shareLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    ) : (
                      <Share2 size={20} />
                    )}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Truck size={24} className="text-radiance-goldColor" />
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          Fast Delivery
                        </p>
                        <p className="text-xs text-gray-500">Nationwide</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Shield size={24} className="text-radiance-goldColor" />
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          Secure Payment
                        </p>
                        <p className="text-xs text-gray-500">Stripe Secured</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <RotateCcw
                        size={24}
                        className="text-radiance-goldColor"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          Easy Returns
                        </p>
                        <p className="text-xs text-gray-500">7 Days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </article>

      {/* Product Recommendations */}
      <ProductRecommendations
        currentProductId={product.id}
        currentCategory={product.category}
        limit={4}
      />
    </div>
  );
}

/**
 * ProductDetailClient with Suspense boundary
 */
export default function ProductDetailClient(props: ProductDetailClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-radiance-goldColor"></div>
        </div>
      }
    >
      <ProductDetailContent {...props} />
    </Suspense>
  );
}
