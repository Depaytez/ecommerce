/**
 * Product Detail Client Component - Luxury Overhaul
 *
 * Implements high-converting luxury design:
 * - Dynamic image gallery with lightbox-style zoom and thumbnail selector
 * - Multi-currency support via useCurrency
 * - Tabbed product specifications (Description, Details, Delivery, Guarantee)
 * - Mobile sticky Add-to-Bag bottom bar
 * - Stripe Secured trust architecture
 */

"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Video,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import type { Product } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
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
  const { formatPrice } = useCurrency();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "shipping">("description");
  const [showStickyBar, setShowStickyBar] = useState(false);

  const mainCtaRef = useRef<HTMLDivElement>(null);

  const allMedia = [
    ...(product.images || []),
    ...(Array.isArray(product.attributes?.videos) ? product.attributes.videos : []),
  ];

  const isVideo = (index: number) => {
    const media = allMedia[index];
    return media?.match(/\.(mp4|webm|mov)$/i);
  };

  const usdPrice = (product as { usd_price?: number | null }).usd_price || null;
  const usdDiscountPrice = (product as { usd_discount_price?: number | null }).usd_discount_price || null;
  const exchangeRate = (product as { exchange_rate?: number }).exchange_rate || 0.00065;

  // Track wishlist state
  useEffect(() => {
    if (user) {
      setIsWishlisted(checkIsInWishlist(product.id));
    }
  }, [user, product.id, checkIsInWishlist]);

  // Observer to trigger mobile sticky bar when CTA scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = mainCtaRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      showError("Please log in to add items to bag");
      return;
    }

    setCartLoading(true);
    try {
      const ok = await addItem(product.id, quantity);
      if (ok) {
        success(`Added ${quantity} x ${product.name} to your bag!`);
        setQuantity(1);
      } else {
        showError("Failed to add to bag. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Add to cart error:", err);
      showError("Failed to add item to bag");
    } finally {
      setCartLoading(false);
    }
  }, [user, product.id, product.name, quantity, addItem, success, showError]);

  const handleWishlistToggle = useCallback(async () => {
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
  }, [user, product.id, isWishlisted, addToWishlist, removeFromWishlist, success, showError]);

  const handleShare = useCallback(async () => {
    setShareLoading(true);
    try {
      const shareData = {
        title: product.name,
        text: `Explore ${product.name} on JRADIANCE`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        success("Product shared!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        success("Product link copied to clipboard!");
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share error:", err);
      }
    } finally {
      setShareLoading(false);
    }
  }, [product.name, success]);

  const handleQuantityChange = useCallback(
    (delta: number) => {
      const newQuantity = Math.max(1, Math.min(quantity + delta, product.stock_quantity));
      setQuantity(newQuantity);
    },
    [quantity, product.stock_quantity]
  );

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-radiance-charcoalTextColor">
      <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Luxury Breadcrumb */}
        <nav className="mb-8 text-xs tracking-wider uppercase" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 flex-wrap text-gray-400">
            {breadcrumbItems.map((item, index) => (
              <li key={item.position} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-gray-900 font-bold" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.url} className="hover:text-radiance-goldColor transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Media Gallery (7 Cols) */}
          <section aria-label="Product media gallery" className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square bg-[#FDFBF7] rounded-3xl overflow-hidden border border-amber-100/50 shadow-sm group">
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
                    alt={`${product.name} showcase`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingCart size={64} />
                </div>
              )}

              {/* Discount Pill */}
              {hasDiscount && (
                <div className="absolute top-5 left-5 bg-red-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight shadow-md">
                  -{discountPercentage}% OFF
                </div>
              )}

              {/* Expand to Lightbox */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-white/80 hover:bg-white text-gray-700 backdrop-blur-md transition-all shadow-sm"
                aria-label="Enlarge image"
              >
                <Maximize2 size={16} />
              </button>

              {/* Prev / Next Arrows */}
              {allMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Counter */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                  {selectedImageIndex + 1} / {allMedia.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {allMedia.length > 1 && (
              <div className="grid grid-cols-5 gap-3 pt-2">
                {allMedia.map((media, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-radiance-goldColor shadow-md scale-102"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {isVideo(index) ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Video size={20} className="text-white" />
                      </div>
                    ) : (
                      <Image
                        src={media}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Product Info & Commerce Actions (5 Cols) */}
          <section aria-label="Product info and purchasing" className="lg:col-span-5 space-y-6">
            {/* Header info */}
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-radiance-goldColor flex items-center gap-1.5">
                <Sparkles size={14} />
                {product.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-radiance-charcoalTextColor leading-tight">
                {product.name}
              </h1>

              {/* Reviews & Stock badge */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={`${
                        star <= Math.round(ratingData.averageRating)
                          ? "text-radiance-amberAccentColor fill-current"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 font-semibold ml-1">
                    {ratingData.averageRating > 0
                      ? `${ratingData.averageRating.toFixed(1)} (${ratingData.totalReviews})`
                      : "Verified Formulation"}
                  </span>
                </div>

                {product.sku && (
                  <span className="text-xs font-mono text-gray-400">SKU: {product.sku}</span>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-radiance-charcoalTextColor">
                  {formatPrice(displayPrice, usdDiscountPrice || usdPrice, exchangeRate)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price, usdPrice, exchangeRate)}
                  </span>
                )}
              </div>
              <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                <Check size={14} /> Includes all applicable taxes & VAT
              </p>
            </div>

            {/* Inventory Status Alert */}
            <div>
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-red-700 bg-red-50/80 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
                  <span>Currently Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-amber-800 bg-amber-50/80 border border-amber-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
                  <span>Limited Availability: Only {product.stock_quantity} remaining</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
                  <Check size={16} className="text-emerald-600" />
                  <span>In Stock & Ready for Immediate Dispatch</span>
                </div>
              )}
            </div>

            {/* Purchase & Action Controls */}
            {!isOutOfStock && (
              <div ref={mainCtaRef} className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold tracking-wider text-gray-600">
                    Quantity
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="text-sm font-bold px-4 min-w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock_quantity}
                      className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="flex-1 py-4 px-6 bg-radiance-charcoalTextColor hover:bg-radiance-goldColor text-white font-bold rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer text-base"
                  >
                    {cartLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Adding to Bag...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWishlisted
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50"
                    } disabled:opacity-50 cursor-pointer`}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    {wishlistLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="p-4 rounded-2xl border border-gray-200 text-gray-600 hover:text-radiance-goldColor hover:border-radiance-goldColor/40 transition cursor-pointer disabled:opacity-50"
                    aria-label="Share product"
                  >
                    {shareLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Share2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* High-Converting Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100 text-center">
              <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col items-center gap-1.5">
                <Truck size={20} className="text-radiance-goldColor" />
                <p className="text-[11px] font-bold text-gray-800">Fast Shipping</p>
                <p className="text-[10px] text-gray-400">Nationwide across Nigeria</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col items-center gap-1.5">
                <ShieldCheck size={20} className="text-radiance-goldColor" />
                <p className="text-[11px] font-bold text-gray-800">Stripe Secured</p>
                <p className="text-[10px] text-gray-400">256-bit encryption</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col items-center gap-1.5">
                <RotateCcw size={20} className="text-radiance-goldColor" />
                <p className="text-[11px] font-bold text-gray-800">7-Day Return</p>
                <p className="text-[10px] text-gray-400">Guaranteed satisfaction</p>
              </div>
            </div>

            {/* Tabs for Description, Specifications, and Shipping */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex border-b border-gray-100 gap-6 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={`pb-3 border-b-2 transition ${
                    activeTab === "description"
                      ? "border-radiance-goldColor text-radiance-charcoalTextColor font-bold"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Description
                </button>
                {product.attributes && Object.keys(product.attributes).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 border-b-2 transition ${
                      activeTab === "details"
                        ? "border-radiance-goldColor text-radiance-charcoalTextColor font-bold"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    Specifications
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-3 border-b-2 transition ${
                    activeTab === "shipping"
                      ? "border-radiance-goldColor text-radiance-charcoalTextColor font-bold"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Shipping & Returns
                </button>
              </div>

              <div className="py-4 text-sm leading-relaxed text-gray-600">
                {activeTab === "description" && (
                  <div>
                    {product.description ? (
                      <RichTextViewer content={product.description} />
                    ) : (
                      <p>Experience the finest formulation crafted for timeless radiance.</p>
                    )}
                  </div>
                )}

                {activeTab === "details" && product.attributes && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(product.attributes)
                      .filter(([key]) => key !== "videos")
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-white p-3 rounded-xl border border-gray-100 text-xs"
                        >
                          <span className="font-semibold text-gray-500 uppercase tracking-wider block">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium text-gray-800 text-sm mt-0.5 block">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-3 text-xs text-gray-600 leading-normal">
                    <p>
                      <strong>Free Delivery:</strong> All orders over ₦50,000 qualify for free standard shipping nationwide.
                    </p>
                    <p>
                      <strong>Processing Time:</strong> Orders dispatched within 24 to 48 hours via premium tracked courier.
                    </p>
                    <p>
                      <strong>Returns Policy:</strong> If you are not completely delighted with your purchase, returns are accepted within 7 days in original condition.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </article>

      {/* Recommendations Carousel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-amber-100/40">
        <ProductRecommendations
          currentProductId={product.id}
          currentCategory={product.category}
          limit={4}
        />
      </section>

      {/* Mobile Sticky Add to Bag Bar */}
      {showStickyBar && !isOutOfStock && (
        <aside
          aria-label="Quick order bar"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:hidden animate-fadeIn shadow-lg flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {product.images && product.images[0] && (
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-xs text-gray-900 truncate">{product.name}</p>
              <p className="font-bold text-sm text-radiance-goldColor">
                {formatPrice(displayPrice, usdDiscountPrice || usdPrice, exchangeRate)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartLoading}
            className="py-2.5 px-5 bg-radiance-charcoalTextColor text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
          >
            {cartLoading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
            <span>Add</span>
          </button>
        </aside>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && allMedia[selectedImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition"
            aria-label="Close fullscreen view"
          >
            <X size={24} />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            {isVideo(selectedImageIndex) ? (
              <video
                src={allMedia[selectedImageIndex]}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <Image
                src={allMedia[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailClient(props: ProductDetailClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-radiance-goldColor" size={36} />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
              Loading formulation...
            </p>
          </div>
        </div>
      }
    >
      <ProductDetailContent {...props} />
    </Suspense>
  );
}
