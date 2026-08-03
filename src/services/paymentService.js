import { supabase, isSupabaseConfigured } from './supabaseClient';
import { updateRow } from './localStore';

// Starts payment for an order.
//
// - Supabase mode: calls the create-checkout-session Edge Function, which
//   looks up the order's stored total server-side (never trusts an amount
//   from the browser) and creates a real Stripe Checkout Session for it.
//   The frontend redirects the browser to Stripe's hosted page; Stripe
//   redirects back to successUrl/cancelUrl afterwards. The stripe-webhook
//   function is the actual source of truth for marking the order paid.
// - Local demo mode: there's no backend to talk to a real payment gateway,
//   so payment is simulated as instantly successful. This keeps the demo
//   fully clickable without pretending to process a real card.
export async function startCheckout(order, customerEmail) {
  if (!isSupabaseConfigured) {
    updateRow('orders', order.id, { payment_status: 'paid' });
    return { redirectUrl: null, simulated: true };
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      orderId: order.id,
      successUrl: `${window.location.origin}/order-confirmation?order=${order.id}`,
      cancelUrl: `${window.location.origin}/checkout`,
      customerEmail,
    },
  });

  if (error) throw new Error(error.message || 'Could not reach the payment service.');
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('Payment provider did not return a checkout URL.');

  return { redirectUrl: data.url, simulated: false };
}

// Card payment via Whish Money's hosted page (through the codnloc gateway
// — see supabase/functions/create-whish-payment-session/index.js). Only
// works once Supabase + that function's secrets are configured; in local
// demo mode it simulates success the same way Stripe does.
export async function startWhishCardCheckout(order) {
  if (!isSupabaseConfigured) {
    updateRow('orders', order.id, { payment_status: 'paid' });
    return { redirectUrl: null, simulated: true };
  }

  const { data, error } = await supabase.functions.invoke('create-whish-payment-session', {
    body: { orderId: order.id },
  });

  if (error) throw new Error(error.message || 'Could not reach the Whish payment gateway.');
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('Whish payment gateway did not return a payment URL.');

  return { redirectUrl: data.url, simulated: false };
}
