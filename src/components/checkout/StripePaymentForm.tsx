/**
 * Stripe Payment Form Component
 * Embedded Stripe Elements payment form with real-time feedback and luxury branding.
 */

"use client";

import React, { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { ShieldCheck, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface StripePaymentFormProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  onPaymentSuccess?: () => void;
}

export default function StripePaymentForm({
  orderId,
  orderNumber,
  totalAmount,
  currency,
  onPaymentSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet.
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const returnUrl = `${window.location.origin}/shop/checkout/success?order=${orderId}&order_number=${orderNumber}`;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred during payment.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        router.push(returnUrl);
      } else {
        // May be in processing or requires action handled by Stripe
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error('[Stripe Payment Error]:', err);
      const msg = err instanceof Error ? err.message : 'Payment processing failed. Please try again.';
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-radiance-goldColor" size={20} />
            <span className="text-sm font-semibold text-gray-800">
              Encrypted 256-bit Payment
            </span>
          </div>
          <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Lock size={12} /> Stripe Verified
          </span>
        </div>

        {/* Embedded Stripe Payment Element */}
        <div className="py-2">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700 animate-fadeIn">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full py-4 px-6 bg-radiance-goldColor hover:bg-radiance-charcoalTextColor text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Authorizing Payment...</span>
          </>
        ) : (
          <>
            <Lock size={18} />
            <span>
              Pay {currency === 'USD' ? '$' : '₦'}
              {totalAmount.toLocaleString()} Securely
            </span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your card details are encrypted directly by Stripe. JRADIANCE never stores payment credentials.
      </p>
    </form>
  );
}
