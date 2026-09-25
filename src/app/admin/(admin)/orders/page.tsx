/**
 * Orders Manager Page
 *
 * Admin can view all orders and update order status.
 * Access: Admin, Chief Admin, Agent
 */

"use client";

import { useState, useEffect } from "react";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  checkPermission,
  getOrderStatistics,
} from "../order-actions";
import {
  ShoppingBag,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  DollarSign,
  TrendingUp,
  User,
  AlertTriangle,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  tax: number;
  shipping_cost: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  shipping_address: string | null;
  billing_address: string | null;
  profiles: {
    email: string;
    full_name: string | null;
    phone: string | null;
  } | null;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      price: number;
      discount_price?: number;
      stock_quantity: number;
      category: string;
    };
  }>;
}

// Helper to calculate total items in an order
const getOrderTotalItems = (order: Order) => {
  return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
};

interface OrderStats {
  totalOrders: number;
  byStatus: Record<string, number>;
  totalRevenue: number;
  pendingRevenue: number;
}

export default function OrdersManagerPage() {
  const adminContext = useAdmin();
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    return adminContext ? adminContext.isAgent : true;
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    discount_price?: number;
    stock_quantity: number;
    category: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [userRole, setUserRole] = useState<string>(() => adminContext?.admin.role || "");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (adminContext) {
      setHasAccess(adminContext.isAgent);
      setUserRole(adminContext.admin.role);
    } else {
      checkPermissions();
    }
    loadOrders();
    loadStats();
  }, [adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("agent");
    setHasAccess(hasPermission);
    
    // Get user role for delete permission check
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setUserRole(profile?.role || "");
    }
  }

  async function loadOrders() {
    setLoading(true);
    const result = await getAllOrders();
    if (result.success && result.data) {
      setOrders(result.data);
    }
    setLoading(false);
  }

  async function loadStats() {
    const result = await getOrderStatistics("all");
    if (result.success && result.data) {
      setStats(result.data);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setActionLoading(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message || result.error || "",
    });
    if (result.success) {
      loadOrders();
      loadStats();
    }
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleCancelOrder(orderId: string) {
    if (!cancelReason.trim()) {
      setMessage({
        type: "error",
        text: "Please provide a cancellation reason",
      });
      return;
    }

    setActionLoading(orderId);
    const result = await cancelOrder(orderId, cancelReason);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message || result.error || "",
    });
    if (result.success) {
      setShowCancelModal(false);
      setCancelReason("");
      setSelectedOrder(null);
      loadOrders();
      loadStats();
    }
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDeleteOrder(orderId: string) {
    // SRP: Only handles order deletion
    if (deleteConfirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage({ type: "error", text: "User not authenticated" });
      return;
    }

    setActionLoading(orderId);
    const result = await deleteOrder(orderId, user.id);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    
    if (result.success) {
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setSelectedOrder(null);
      loadOrders();
      loadStats();
    }
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (paymentFilter !== "all" && order.payment_status !== paymentFilter)
      return false;
    return true;
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "confirmed":
        return <CheckCircle size={16} className="text-blue-500" />;
      case "shipped":
        return <Truck size={16} className="text-purple-500" />;
      case "delivered":
        return <Package size={16} className="text-green-500" />;
      case "cancelled":
        return <XCircle size={16} className="text-red-500" />;
      case "returned":
        return <XCircle size={16} className="text-orange-500" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "returned":
        return "bg-orange-100 text-orange-800";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!loading && hasAccess === false) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">
          You don&apos;t have administrative permissions to view or manage orders.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 p-4" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">
            Orders Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all customer orders
          </p>
        </div>
        <ShoppingBag className="text-radiance-goldColor" size={32} />
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
              <ShoppingBag size={40} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-radiance-goldColor">
                  ₦{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign size={40} className="text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₦{stats.pendingRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp size={40} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.byStatus["delivered"] || 0}
                </p>
              </div>
              <CheckCircle size={40} className="text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-radiance-goldColor mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.profiles?.full_name || "Guest"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.profiles?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getOrderTotalItems(order)} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-radiance-goldColor">
                        ₦{order.total_amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            // fetch full order details for accuracy
                            const res = await getOrderById(order.id);
                            if (res.success && res.data) {
                              setSelectedOrder(res.data as Order);
                            } else {
                              console.error(
                                "Failed to load order details",
                                res.error,
                              );
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Details
                        </button>
                        {/* Delete Button - Admin/Chief Admin Only (LSP: Substitutable roles) */}
                        {(userRole === 'admin' || userRole === 'chief_admin') && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            title="Permanently delete order (Admin only)"
                          >
                            Delete
                          </button>
                        )}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          disabled={
                            actionLoading === order.id ||
                            selectedOrder === order
                          }
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-radiance-goldColor disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="returned">Returned</option>
                        </select>
                        {order.status !== "cancelled" &&
                          order.status !== "returned" && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No orders found</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && !showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-sm text-gray-500">
                  {selectedOrder.order_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <User size={18} className="text-radiance-goldColor" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.profiles?.full_name || "Guest"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.profiles?.email}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.profiles?.phone || "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Package size={18} className="text-radiance-goldColor" />
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Payment:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.payment_status)}`}
                    >
                      {selectedOrder.payment_status}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Date:</span>{" "}
                    <span className="font-medium">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Total Items:</span>{" "}
                    <span className="font-bold">
                      {getOrderTotalItems(selectedOrder)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shipping_address && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Truck size={18} className="text-blue-600" />
                  Shipping Address
                </h3>
                <p className="text-sm text-gray-700">
                  {selectedOrder.shipping_address}
                </p>
              </div>
            )}

            {/* Order Items - Product Chips */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-radiance-goldColor" />
                Order Items ({getOrderTotalItems(selectedOrder)} items)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedOrder.order_items?.map((item) => {
                  const displayPrice =
                    item.product?.discount_price || item.unit_price;
                  const hasDiscount =
                    item.product?.discount_price &&
                    item.product.discount_price < item.unit_price;

                  return (
                    <div
                      key={item.id}
                      className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-radiance-goldColor hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() =>
                        item.product && setSelectedProduct(item.product)
                      }
                    >
                      {/* Product Image */}
                      <div className="relative h-40 bg-gray-100">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={40} />
                          </div>
                        )}

                        {/* Quantity Badge */}
                        <div className="absolute top-2 right-2 bg-radiance-goldColor text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          Qty: {item.quantity}
                        </div>

                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            -
                            {Math.round(
                              (1 - displayPrice / item.unit_price) * 100,
                            )}
                            %
                          </div>
                        )}

                        {/* Click hint */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 bg-white/90 px-4 py-2 rounded-full text-sm font-bold transition-opacity">
                            👆 View Details
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                          {item.product_name}
                        </h4>

                        <div className="flex items-center justify-between">
                          <div>
                            {hasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-radiance-goldColor">
                                  ₦{displayPrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 line-through">
                                  ₦{item.unit_price.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-radiance-goldColor">
                                ₦{item.unit_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {item.product?.category || "N/A"}
                          </span>
                        </div>

                        {/* Item Total */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Item Total
                          </span>
                          <span className="text-sm font-bold text-radiance-goldColor">
                            ₦{item.total_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ₦
                    {(
                      selectedOrder.total_amount -
                      selectedOrder.tax -
                      selectedOrder.shipping_cost
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (7.5%)</span>
                  <span className="font-medium">
                    ₦{selectedOrder.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    ₦{selectedOrder.shipping_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-radiance-goldColor">
                    ₦{selectedOrder.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status !== "cancelled" &&
                selectedOrder.status !== "returned" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Product Image */}
            <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden mb-6">
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package size={64} />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedProduct.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedProduct.category}
                  </span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      selectedProduct.stock_quantity > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedProduct.stock_quantity > 0
                      ? `In Stock (${selectedProduct.stock_quantity})`
                      : "Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedProduct.discount_price &&
                    selectedProduct.discount_price < selectedProduct.price ? (
                      <div>
                        <p className="text-sm text-gray-500 line-through">
                          ₦{selectedProduct.price.toLocaleString()}
                        </p>
                        <p className="text-2xl font-bold text-radiance-goldColor">
                          ₦{selectedProduct.discount_price.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-radiance-goldColor">
                        ₦{selectedProduct.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {selectedProduct.discount_price &&
                    selectedProduct.discount_price < selectedProduct.price && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -
                        {Math.round(
                          (1 -
                            selectedProduct.discount_price /
                              selectedProduct.price) *
                            100,
                        )}
                        % OFF
                      </div>
                    )}
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">Product ID</p>
                  <p className="text-sm font-mono font-bold text-gray-900 truncate">
                    {selectedProduct.id}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">Slug</p>
                  <p className="text-sm font-mono font-bold text-gray-900 truncate">
                    {selectedProduct.slug}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <a
                  href={`/products/${selectedProduct.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-radiance-goldColor text-white rounded-xl font-medium hover:bg-radiance-charcoalTextColor transition-colors text-center"
                >
                  View on Store
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Modal (Admin Only) */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600">Delete Order Permanently</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={24} className="text-red-600" />
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 font-bold text-sm mb-2">⚠️ WARNING: This action cannot be undone!</p>
              <p className="text-red-700 text-sm">
                You are about to permanently delete order{" "}
                <span className="font-bold">{selectedOrder.order_number}</span>{" "}
                worth ₦{selectedOrder.total_amount.toLocaleString()}.
              </p>
              <p className="text-red-700 text-sm mt-2">
                This will delete all order items and cannot be recovered.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 uppercase"
                placeholder="Type DELETE here"
                autoComplete="off"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setSelectedOrder(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                disabled={actionLoading === selectedOrder.id || deleteConfirmText !== "DELETE"}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedOrder.id ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cancel Order</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel order{" "}
              <span className="font-bold">{selectedOrder.order_number}</span>?
              This will restore the product stock.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
                rows={3}
                placeholder="Please provide a reason for cancellation..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setSelectedOrder(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={
                  actionLoading === selectedOrder.id || !cancelReason.trim()
                }
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedOrder.id
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
