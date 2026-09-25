/**
 * Order Domain Types
 * Bounded Context: Orders
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  discount_applied: number;
  currency: string;
  original_amount: number | null;
  exchange_rate: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  payment_verified_at: string | null;
  notes: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  estimated_delivery_date: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_client_secret: string | null;
  stripe_status: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CreateOrderItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderInput {
  user_id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  discount_applied?: number;
  currency?: string;
  shipping_address: string;
  billing_address?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface OrderTransitionResult {
  success: boolean;
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  error?: string;
}
