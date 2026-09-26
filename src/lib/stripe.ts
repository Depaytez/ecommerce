/**
 * Stripe Server SDK Singleton
 * Server-only module
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not defined in environment variables.');
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  appInfo: {
    name: 'JRadiance E-Commerce',
    version: '1.0.0',
  },
});
