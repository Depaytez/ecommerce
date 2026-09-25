/**
 * Order Repository Interface & Supabase Implementation
 * Bounded Context: Orders
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { Order, CreateOrderInput, OrderStatus, PaymentStatus } from './types';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<boolean>;
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus, reference?: string): Promise<boolean>;
  updateStripeDetails(
    id: string,
    details: {
      stripePaymentIntentId?: string;
      stripeCustomerId?: string;
      stripeClientSecret?: string;
      stripeStatus?: string;
    }
  ): Promise<boolean>;
}

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private client?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) return null;
    return data as Order;
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error || !data) return null;
    return data as Order;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Order[];
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const client = this.getClient();

    const { data: orderData, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: input.user_id,
        order_number: input.order_number,
        subtotal: input.subtotal,
        tax: input.tax,
        shipping_cost: input.shipping_cost,
        total_amount: input.total_amount,
        discount_applied: input.discount_applied || 0,
        currency: input.currency || 'NGN',
        shipping_address: input.shipping_address,
        billing_address: input.billing_address || input.shipping_address,
        notes: input.notes || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(`Failed to create order: ${orderError?.message || 'Unknown database error'}`);
    }

    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await client
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
    }

    return this.findById(orderData.id) as Promise<Order>;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<boolean> {
    const { error } = await this.getClient()
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return !error;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    reference?: string
  ): Promise<boolean> {
    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (reference) {
      updatePayload.payment_reference = reference;
    }

    if (paymentStatus === 'completed') {
      updatePayload.payment_verified_at = new Date().toISOString();
      updatePayload.status = 'confirmed';
    }

    const { error } = await this.getClient()
      .from('orders')
      .update(updatePayload)
      .eq('id', id);

    return !error;
  }

  async updateStripeDetails(
    id: string,
    details: {
      stripePaymentIntentId?: string;
      stripeCustomerId?: string;
      stripeClientSecret?: string;
      stripeStatus?: string;
    }
  ): Promise<boolean> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (details.stripePaymentIntentId) {
      updatePayload.stripe_payment_intent_id = details.stripePaymentIntentId;
    }
    if (details.stripeCustomerId) {
      updatePayload.stripe_customer_id = details.stripeCustomerId;
    }
    if (details.stripeClientSecret) {
      updatePayload.stripe_client_secret = details.stripeClientSecret;
    }
    if (details.stripeStatus) {
      updatePayload.stripe_status = details.stripeStatus;
    }

    const { error } = await this.getClient()
      .from('orders')
      .update(updatePayload)
      .eq('id', id);

    return !error;
  }
}
