// ChiPay public key - safe to use in frontend
export const CHIPAY_PUBLIC_KEY = 'pk_dev_fc3700570d0fef7000b5dfffafb39945';

// Note: ChiPay secret key is stored securely in backend environment variables
// and should NEVER be used in frontend code

export interface ChipayCheckoutParams {
  amountUsd: number; // decimal in USD
  reference: string; // internal reference for reconciliation
  email?: string;
  metadata?: Record<string, string | number | boolean>;
}

// Build a checkout URL for client-side flows.
// Using real ChiPay Checkout URL
export function buildChiPayCheckoutUrl(params: ChipayCheckoutParams): string {
  const base = 'https://checkout.chipay.com';
  const q = new URLSearchParams();
  q.set('pk', CHIPAY_PUBLIC_KEY);
  q.set('amount', params.amountUsd.toString());
  q.set('currency', 'USD');
  q.set('reference', params.reference);
  if (params.email) q.set('email', params.email);
  if (params.metadata) {
    try {
      q.set('metadata', encodeURIComponent(JSON.stringify(params.metadata)));
    } catch {}
  }
  return `${base}?${q.toString()}`;
}

export function openChiPayCheckout(params: ChipayCheckoutParams): Window | null {
  const url = buildChiPayCheckoutUrl(params);
  return window.open(url, '_blank', 'noopener');
}
