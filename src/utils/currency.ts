/**
 * Currency Detection and Formatting Utility
 * 
 * Automatically detects user's currency based on location
 * and provides formatting functions for NGN and USD
 */

export type CurrencyCode = 'NGN' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
    name: 'Nigerian Naira',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    name: 'US Dollar',
  },
};

/**
 * Detect user's currency based on timezone and browser settings
 * Returns NGN for Nigeria, USD for all other countries
 */
export function detectUserCurrency(): CurrencyCode {
  if (typeof window === 'undefined') {
    return 'NGN'; // Default to NGN on server-side
  }

  try {
    // Method 1: Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Africa/Lagos' || timezone === 'Africa/Abuja' || timezone === 'Africa/Porto-Novo') {
      return 'NGN';
    }

    // Method 2: Check browser languages array
    const languages = navigator.languages || [navigator.language || (navigator as any).userLanguage || ''];
    for (const lang of languages) {
      const lower = lang.toLowerCase();
      if (
        lower.endsWith('-ng') ||
        lower.startsWith('yo') ||
        lower.startsWith('ha') ||
        lower.startsWith('ig')
      ) {
        return 'NGN';
      }
    }

    // Default to USD for all international users
    return 'USD';
  } catch (error) {
    console.error('Error detecting currency:', error);
    return 'NGN'; // Fallback to NGN
  }
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES[code];
}

/**
 * Format amount with currency symbol
 * @param amount - Amount to format
 * @param currency - Currency code (NGN or USD)
 * @returns Formatted string with symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const config = CURRENCIES[currency];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Convert NGN to USD (using current exchange rate)
 * @param amountNgn - Amount in NGN
 * @param exchangeRate - Exchange rate (default: 0.00065 = 1 NGN = 0.00065 USD)
 * @returns Amount in USD
 */
export function convertNGNtoUSD(amountNgn: number, exchangeRate: number = 0.00065): number {
  return Math.round(amountNgn * exchangeRate * 100) / 100;
}

/**
 * Convert USD to NGN (using current exchange rate)
 * @param amountUsd - Amount in USD
 * @param exchangeRate - Exchange rate (default: 1538 = 1 USD = 1538 NGN)
 * @returns Amount in NGN
 */
export function convertUSDtoNGN(amountUsd: number, exchangeRate: number = 1538): number {
  return Math.round(amountUsd * exchangeRate);
}

/**
 * Get price in user's currency
 * If product has USD price, use it for USD users
 * Otherwise, convert from NGN using exchange rate
 */
export function getPriceInCurrency(
  ngnPrice: number,
  usdPrice: number | null,
  currency: CurrencyCode,
  exchangeRate: number = 0.00065
): number {
  if (currency === 'NGN') {
    return ngnPrice;
  }
  
  // For USD, use manual USD price if available, otherwise convert
  if (usdPrice && usdPrice > 0) {
    return usdPrice;
  }
  
  return convertNGNtoUSD(ngnPrice, exchangeRate);
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return code === 'NGN' || code === 'USD';
}
