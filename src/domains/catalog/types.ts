/**
 * Catalog Domain Types
 * Bounded Context: Catalog
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  sku: string | null;
  images: string[];
  attributes: Record<string, string | number | boolean | null>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  currency?: string;
  usd_price?: number | null;
  usd_discount_price?: number | null;
  exchange_rate?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  is_active?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
}
