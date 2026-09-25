/**
 * Checkout Page
 *
 * Enterprise Checkout flow powered by:
 * - Server-verified quotes & atomic stock reservation
 * - Stripe Elements payment gateway (Payment Intents API)
 * - Domain-Driven Design (DDD) compliance
 *
 * Access: Authenticated users only
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Elements } from "@stripe/react-stripe-js";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { getStripe } from "@/lib/stripe-client";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import {
  ShieldCheck,
  Truck,
  MapPin,
  Phone,
  User as UserIcon,
  ShoppingBag,
  ArrowRight,
  Edit2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import type { CheckoutQuote } from "@/domains/checkout/types";

export default function CheckoutPage() {
  const router = useRouter();
  const user = useUser();
  const { cart, subtotal, tax, shipping, totalPrice, isFreeShipping, isLoading: cartLoading, clearCart, refreshCart } = useCart();

  const [step, setStep] = useState<"delivery" | "payment">("delivery");
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Stripe checkout session state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null);

  // Customer delivery form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    shipping_address: "",
    billing_address: "",
    same_as_shipping: true,
  });

  // Prepopulate customer email and full name if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        full_name: (user as any).full_name || (user as any).user_metadata?.full_name || prev.full_name,
        phone: (user as any).phone || (user as any).user_metadata?.phone || prev.phone,
      }));
    }
  }, [user]);

  // Handle proceeding from delivery form to Stripe payment
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitError(null);

    if (!user) {
      router.push(`/shop/auth/login?redirect=${encodeURIComponent("/shop/checkout")}`);
      return;
    }

    if (cart.length === 0) {
      setInitError("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!formData.full_name.trim() || !formData.shipping_address.trim() || !formData.email.trim()) {
      setInitError("Please complete all required fields (Full Name, Email, Shipping Address).");
      return;
    }

    setIsInitializingPayment(true);

    try {
      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
          customer: {
            fullName: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            shippingAddress: formData.shipping_address,
            billingAddress: formData.same_as_shipping ? formData.shipping_address : formData.billing_address,
          },
          currency: "NGN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment session.");
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
      setServerQuote(data.quote);
      setStep("payment");
    } catch (err: any) {
      console.error("[Checkout Init Error]:", err);
      setInitError(err.message || "An error occurred while preparing your checkout session.");
    } finally {
      setIsInitializingPayment(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-radiance-goldColor" size={40} />
        <p className="text-gray-500 font-medium text-sm">Loading your luxury bag...</p>
      </div>
    );
  }

  if (cart.length === 0 && step === "delivery") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-radiance-creamBackgroundColor rounded-full flex items-center justify-center mx-auto mb-6 text-radiance-goldColor">
          <ShoppingBag size={36} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-radiance-charcoalTextColor mb-3">
          Your Bag is Empty
        </h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
          Discover our curated collection of radiant skincare and beauty essentials.
        </p>
        <button
          onClick={() => router.push("/shop")}
          className="px-8 py-3.5 bg-radiance-goldColor hover:bg-radiance-charcoalTextColor text-white font-semibold rounded-xl transition-all duration-300 shadow-md"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  const effectiveQuote = serverQuote || {
    subtotal,
    tax,
    shipping,
    total: totalPrice,
    currency: "NGN",
    isFreeShipping,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Checkout Progress Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-radiance-charcoalTextColor mb-3">
          Secure Checkout
        </h1>
        <div className="flex items-center justify-center gap-3 text-sm font-medium">
          <span
            className={`flex items-center gap-1.5 ${
              step === "delivery" ? "text-radiance-goldColor font-bold" : "text-gray-400"
            }`}
          >
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">
              1
            </span>
            Delivery Info
          </span>
          <span className="text-gray-300">—</span>
          <span
            className={`flex items-center gap-1.5 ${
              step === "payment" ? "text-radiance-goldColor font-bold" : "text-gray-400"
            }`}
          >
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">
              2
            </span>
            Payment (Stripe)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Form or Stripe Elements */}
        <div className="lg:col-span-7">
          {initError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
              <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
              <span>{initError}</span>
            </div>
          )}

          {step === "delivery" ? (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 text-radiance-charcoalTextColor font-bold text-lg">
                  <UserIcon size={20} className="text-radiance-goldColor" />
                  <h2>Contact Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chinelo Okonkwo"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-radiance-goldColor/40 text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. chinelo@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-radiance-goldColor/40 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +234 801 234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-radiance-goldColor/40 text-sm transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 text-radiance-charcoalTextColor font-bold text-lg">
                  <MapPin size={20} className="text-radiance-goldColor" />
                  <h2>Shipping Destination</h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Complete Street Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="House/Apartment number, street name, estate, city, state"
                    value={formData.shipping_address}
                    onChange={(e) =>
                      setFormData({ ...formData, shipping_address: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-radiance-goldColor/40 text-sm transition"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.same_as_shipping}
                      onChange={(e) =>
                        setFormData({ ...formData, same_as_shipping: e.target.checked })
                      }
                      className="w-4 h-4 text-radiance-goldColor rounded border-gray-300 focus:ring-radiance-goldColor"
                    />
                    <span>Billing address same as shipping address</span>
                  </label>
                </div>

                {!formData.same_as_shipping && (
                  <div className="pt-3 animate-fadeIn">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Billing Address *
                    </label>
                    <textarea
                      rows={2}
                      required={!formData.same_as_shipping}
                      placeholder="Billing street address, city, state"
                      value={formData.billing_address}
                      onChange={(e) =>
                        setFormData({ ...formData, billing_address: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-radiance-goldColor/40 text-sm transition"
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isInitializingPayment}
                className="w-full py-4 px-6 bg-radiance-goldColor hover:bg-radiance-charcoalTextColor text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 text-base cursor-pointer"
              >
                {isInitializingPayment ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Preparing Payment Intent...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Stripe Elements Payment View */
            <div className="space-y-6 animate-fadeIn">
              {/* Delivery Recap Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <MapPin size={14} className="text-radiance-goldColor" />
                    <span>Delivering To</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{formData.full_name}</p>
                  <p className="text-xs text-gray-500 whitespace-pre-line">
                    {formData.shipping_address}
                  </p>
                  <p className="text-xs text-gray-400">{formData.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("delivery")}
                  className="text-xs text-radiance-goldColor hover:text-radiance-charcoalTextColor font-semibold flex items-center gap-1 transition"
                >
                  <Edit2 size={13} />
                  <span>Change</span>
                </button>
              </div>

              {/* Embedded Stripe Elements Form */}
              {clientSecret && orderId && orderNumber ? (
                <Elements
                  stripe={getStripe()}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#C5A880",
                        colorBackground: "#ffffff",
                        colorText: "#2C2C2C",
                        colorDanger: "#dc2626",
                        fontFamily: "system-ui, sans-serif",
                        borderRadius: "12px",
                      },
                    },
                  }}
                >
                  <StripePaymentForm
                    orderId={orderId}
                    orderNumber={orderNumber}
                    totalAmount={effectiveQuote.total}
                    currency={effectiveQuote.currency}
                    onPaymentSuccess={async () => {
                      await clearCart();
                      await refreshCart();
                    }}
                  />
                </Elements>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                  <Loader2 size={24} className="animate-spin mx-auto text-radiance-goldColor mb-2" />
                  <p className="text-sm text-gray-500">Initializing Stripe Elements...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm sticky top-24 space-y-6">
            <h2 className="text-xl font-serif font-bold text-radiance-charcoalTextColor pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-sans font-medium text-gray-500">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            </h2>

            {/* Cart Items List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => {
                const price = item.product?.discount_price || item.product?.price || 0;
                const image = item.product?.images?.[0] || "/placeholder-product.jpg";

                return (
                  <div key={item.id} className="flex items-center gap-3.5 text-sm">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                      <Image
                        src={image}
                        alt={item.product?.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate text-sm">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">
                        ₦{(price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Free Shipping Indicator */}
            {effectiveQuote.subtotal > 0 && !effectiveQuote.isFreeShipping && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                <Truck size={16} className="text-amber-600 shrink-0" />
                <span>
                  Add <strong>₦{(50000 - effectiveQuote.subtotal).toLocaleString()}</strong> more to qualify for <strong>Free Delivery</strong>!
                </span>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₦{effectiveQuote.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated VAT (7.5%)</span>
                <span>₦{effectiveQuote.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {effectiveQuote.shipping === 0 ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : (
                    `₦${effectiveQuote.shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-2xl text-radiance-goldColor">
                  ₦{effectiveQuote.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Security Badges */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-600" />
                SSL 256-bit Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Lock size={14} className="text-radiance-goldColor" />
                Stripe Payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
