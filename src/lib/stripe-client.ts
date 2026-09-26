/**
 * Stripe Client-side Loader Singleton
 * For use in React Client Components
 */

import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

let stripePromise: Promise<StripeClient | null>;

export const getStripe = (): Promise<StripeClient | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey && process.env.NODE_ENV === 'production') {
      console.warn('[Stripe Client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined.');
    }
    stripePromise = loadStripe(publishableKey || 'pk_test_placeholder');
  }
  return stripePromise;
};
