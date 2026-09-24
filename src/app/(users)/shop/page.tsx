/**
 * =============================================================================
 * Shop Page - REDESIGNED
 * =============================================================================
 *
 * Modern shop page with:
 * - Advanced filters
 * - Sort options
 * - Grid/List view toggle
 * - Search functionality
 * - Category filters
 * - Loading skeletons
 * - Infinite scroll
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  X,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";
import { Product, ProductFilters } from "@/types";
import { getProducts, getProductsByIds } from "@/utils/supabase/services";
import ProductCard from "@/components/products/ProductCard";
import { useToast } from "@/context/ToastContext";

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  const { success, error: showError } = useToast();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const BATCH_SIZE = 12;

  // Debounce search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Categories
  const categories = useMemo(
    () => [
      "Skincare",
      "Makeup",
      "Hair Care",
      "Fragrance",
      "Body Care",
      "Tools & Accessories",
    ],
    [],
  );

  // Load initial products
  useEffect(() => {
    loadProducts(1, true);
  }, [selectedCategory, debouncedSearch, sortBy]);

  async function loadProducts(pageNum: number, reset = false) {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters: ProductFilters = {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        limit: BATCH_SIZE,
        offset: (pageNum - 1) * BATCH_SIZE,
        is_active: true,
      };

      const newProducts = await getProducts(filters);

      if (reset) {
        setProducts(newProducts);
        setTotalProducts(newProducts.length);
        setHasMore(newProducts.length >= BATCH_SIZE);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
        setTotalProducts((prev) => prev + newProducts.length);
        setHasMore(newProducts.length >= BATCH_SIZE);
      }

      setPage(pageNum);
    } catch (error) {
      showError("Failed to load products");
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadProducts(1, true);
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      loadProducts(page + 1);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedCategory("");
    setSortBy("newest");
    setPage(1);
    loadProducts(1, true);
  }

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case "price-low":
        sorted.sort(
          (a, b) =>
            (a.discount_price || a.price) - (b.discount_price || b.price),
        );
        break;
      case "price-high":
        sorted.sort(
          (a, b) =>
            (b.discount_price || b.price) - (a.discount_price || a.price),
        );
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating":
        // Rating would need to be fetched separately
        break;
      case "newest":
      default:
        // Already sorted by created_at DESC from backend
        break;
    }

    return sorted;
  }, [products, sortBy]);

  const activeFiltersCount = [selectedCategory, searchQuery].filter(
    Boolean,
  ).length;

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Title */}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Shop All Products
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                {totalProducts} products found
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-radiance-goldColor focus:border-transparent"
                />
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            {/* View Toggle & Filters */}
            <div className="flex items-center gap-2">
              {/* Filter Button (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors relative"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-radiance-goldColor text-white text-[10px] rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === "grid"
                      ? "bg-radiance-goldColor text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-full transition-colors ${
                    viewMode === "list"
                      ? "bg-radiance-goldColor text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar (Desktop) */}
          <div className="hidden md:flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-radiance-goldColor cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-radiance-goldColor cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-radiance-goldColor font-semibold hover:underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Category */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => setSelectedCategory("")}
                    className="w-4 h-4 text-radiance-goldColor focus:ring-radiance-goldColor"
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="w-4 h-4 text-radiance-goldColor focus:ring-radiance-goldColor"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Sort By</h3>
              <div className="space-y-2">
                {[
                  { value: "newest", label: "Newest" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "price-high", label: "Price: High to Low" },
                  { value: "name", label: "Name: A-Z" },
                  { value: "rating", label: "Top Rated" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === option.value}
                      onChange={() => setSortBy(option.value)}
                      className="w-4 h-4 text-radiance-goldColor focus:ring-radiance-goldColor"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-15">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No products found
            </h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="bg-radiance-goldColor text-white px-8 py-3 rounded-full font-bold hover:bg-radiance-charcoalTextColor transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-6 md:gap-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center"
                  : "grid-cols-1"
              }`}
            >
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showQuickAdd={true}
                  viewMode={viewMode === "grid" ? "vertical" : "horizontal"}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-radiance-charcoalTextColor text-white px-12 py-4 rounded-full font-bold text-sm hover:bg-radiance-goldColor transition-all shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More Products"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
