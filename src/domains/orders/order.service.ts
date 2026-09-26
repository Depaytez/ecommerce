/**
 * Order Domain Service
 * Bounded Context: Orders
 * Enforces business rules and strict state-machine transitions for orders.
 */

import type { IOrderRepository } from './order.repository';
import type { OrderStatus, OrderTransitionResult, Order } from './types';

export class OrderService {
  constructor(private orderRepo: IOrderRepository) {}

  /**
   * Valid state transitions map
   */
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
  };

  /**
   * Validates whether a transition from currentStatus to targetStatus is allowed
   */
  static canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Generates a unique, standardized order number (e.g. JR-20260924-XXXX)
   */
  static generateOrderNumber(): string {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `JR-${datePart}-${randomPart}`;
  }

  /**
   * Safely transitions order status adhering to the lifecycle state machine
   */
  async transitionStatus(orderId: string, targetStatus: OrderStatus): Promise<OrderTransitionResult> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      return {
        success: false,
        orderId,
        previousStatus: 'pending',
        newStatus: targetStatus,
        error: `Order with ID ${orderId} not found`,
      };
    }

    if (!OrderService.canTransition(order.status, targetStatus)) {
      return {
        success: false,
        orderId,
        previousStatus: order.status,
        newStatus: targetStatus,
        error: `Illegal state transition from '${order.status}' to '${targetStatus}'`,
      };
    }

    const updated = await this.orderRepo.updateStatus(orderId, targetStatus);
    if (!updated) {
      return {
        success: false,
        orderId,
        previousStatus: order.status,
        newStatus: targetStatus,
        error: 'Failed to update order status in repository',
      };
    }

    return {
      success: true,
      orderId,
      previousStatus: order.status,
      newStatus: targetStatus,
    };
  }

  /**
   * Verifies an order belongs to a user or throws authorization error
   */
  async getUserOrder(orderId: string, userId: string): Promise<Order | null> {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.user_id !== userId) {
      return null;
    }
    return order;
  }
}
