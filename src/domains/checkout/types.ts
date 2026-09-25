/**
 * Checkout Domain Types
 * Bounded Context: Checkout
 */

export interface CheckoutItemQuote {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutQuote {
  items: CheckoutItemQuote[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: 'NGN' | 'USD';
  isFreeShipping: boolean;
}

export interface StockReservationItem {
  product_id: string;
  quantity: number;
}

export interface StockReservationResult {
  success: boolean;
  reservationToken?: string;
  error?: string;
}

export interface CheckoutCustomerInfo {
  userId?: string;
  email: string;
  fullName: string;
  phone?: string;
  shippingAddress: string;
  billingAddress?: string;
}
