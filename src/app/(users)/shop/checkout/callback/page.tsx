/**
 * Paystack Checkout Callback Page
 * Handles customer redirect following Paystack payment completion.
 * Verifies transaction with server and redirects to Order Success.
 */

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function PaystackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, refreshCart } = useCart();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("error");
      setErrorMessage("No transaction reference provided in callback URL.");
      return;
    }

    let isMounted = true;

    async function verifyPayment() {
      try {
        const response = await fetch(`/api/checkout/paystack/verify?reference=${encodeURIComponent(reference!)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Payment verification could not be confirmed.");
        }

        if (isMounted) {
          setStatus("success");
          await clearCart();
          await refreshCart();

          // Redirect to checkout success page
          setTimeout(() => {
            router.push(
              `/shop/checkout/success?order=${data.orderId}&order_number=${data.orderNumber}`
            );
          }, 1500);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "An unexpected error occurred verifying your payment.");
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, clearCart, refreshCart]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      {status === "verifying" && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-md w-full space-y-4">
          <Loader2 className="animate-spin text-radiance-goldColor mx-auto" size={44} />
          <h1 className="text-xl font-serif font-bold text-radiance-charcoalTextColor">
            Confirming Your Payment
          </h1>
          <p className="text-gray-500 text-sm">
            Please wait while we verify your transaction with Paystack...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm max-w-md w-full space-y-4">
          <CheckCircle2 className="text-green-600 mx-auto" size={44} />
          <h1 className="text-xl font-serif font-bold text-gray-900">
            Payment Confirmed!
          </h1>
          <p className="text-gray-500 text-sm">
            Redirecting to your order confirmation...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm max-w-md w-full space-y-4">
          <AlertCircle className="text-red-500 mx-auto" size={44} />
          <h1 className="text-xl font-serif font-bold text-gray-900">
            Verification Incomplete
          </h1>
          <p className="text-gray-500 text-sm">{errorMessage}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/shop/checkout"
              className="px-6 py-2.5 bg-radiance-goldColor hover:bg-radiance-charcoalTextColor text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Return to Checkout
            </Link>
            <Link
              href="/shop/history"
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Check Order History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-radiance-goldColor" size={36} />
        </div>
      }
    >
      <PaystackCallbackContent />
    </Suspense>
  );
}
