import { supabase, isSupabaseConfigured } from './supabaseClient';
import { updateRow } from './localStore';

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
