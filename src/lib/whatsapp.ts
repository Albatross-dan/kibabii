import { supabase } from './supabase';

/**
 * Normalizes and validates a phone or WhatsApp number into E.164 format.
 * E.164 format: starts with '+' followed by country code and subscriber number (e.g. +254712345678).
 */
export function normalizeWhatsAppNumber(raw: string): { valid: boolean; formatted: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, formatted: '' };
  }

  // Remove spaces, hyphens, parentheses, dots
  let cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

  // Auto-normalize Kenyan formats:
  // e.g. 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 0)
  if (/^0[17]\d{8}$/.test(cleaned)) {
    cleaned = '+254' + cleaned.substring(1);
  } else if (/^254[17]\d{8}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  } else if (/^[17]\d{8}$/.test(cleaned)) {
    cleaned = '+254' + cleaned;
  }

  // E.164 validation: Must start with '+' followed by country code (not starting with 0) and 7-14 more digits
  // Total digits after '+' is between 8 and 15
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      valid: false,
      formatted: cleaned,
      error: 'Please enter a valid phone number in E.164 format (e.g. +254712345678).'
    };
  }

  return { valid: true, formatted: cleaned };
}

/**
 * Builds a direct wa.me link with pre-filled message text.
 */
export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const cleanNumber = whatsappNumber.replace('+', '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}

/**
 * Fetches the seller's WhatsApp number via RPC get_seller_whatsapp_number.
 * Returns null if viewer is not logged in, if the seller hasn't set one, or if seller is suspended.
 */
export async function fetchSellerWhatsAppNumber(sellerId: string): Promise<string | null> {
  if (!sellerId) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_seller_whatsapp_number', {
      _seller_id: sellerId
    });

    if (error) {
      console.warn('get_seller_whatsapp_number RPC error:', error.message || error);
      return null;
    }

    return (data as string) || null;
  } catch (err) {
    console.warn('Failed to fetch seller WhatsApp number:', err);
    return null;
  }
}

/**
 * Rich listing share details returned by RPC get_listing_share_details.
 */
export interface ListingShareDetails {
  listing_id: string;
  listing_type?: string;
  title: string;
  price_display: string;
  image_url: string | null;
  whatsapp_link: string | null;
}

/**
 * Fetches the direct WhatsApp link via get_listing_whatsapp_link RPC.
 * Returns null if no phone number is found in the fallback chain.
 */
export async function getListingWhatsAppLink(listingId: string): Promise<string | null> {
  if (!listingId) return null;
  try {
    const { data, error } = await supabase.rpc('get_listing_whatsapp_link', {
      p_listing_id: listingId
    });
    if (error || !data || typeof data !== 'string' || !data.trim()) {
      return null;
    }
    return data.trim();
  } catch (err) {
    console.warn('get_listing_whatsapp_link error:', err);
    return null;
  }
}

/**
 * Fetches rich share details via get_listing_share_details RPC.
 * Returns title, price_display, image_url, whatsapp_link.
 */
export async function getListingShareDetails(listingId: string): Promise<ListingShareDetails | null> {
  if (!listingId) return null;
  try {
    const { data, error } = await supabase.rpc('get_listing_share_details', {
      p_listing_id: listingId
    });
    if (error || !data) {
      return null;
    }
    return data as ListingShareDetails;
  } catch (err) {
    console.warn('get_listing_share_details error:', err);
    return null;
  }
}

/**
 * Builds the canonical listing detail URL for link sharing & OpenGraph unfurling.
 */
export function getListingShareUrl(listingId: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin && !window.location.hostname.includes('localhost')
    ? window.location.origin
    : 'https://campus-market-teal.vercel.app';
  return `${origin}/listing/${listingId}`;
}

/**
 * Builds the clickUrl for WhatsApp according to the contract:
 * const message = `Hi, I'm interested in "${details.title}" (${details.price_display}) on KibabuiMart: ${listingUrl}`;
 * const clickUrl = `${details.whatsapp_link}?text=${encodeURIComponent(message)}`;
 */
export function buildListingWhatsAppUrl(details: {
  listing_id: string;
  title: string;
  price_display: string;
  whatsapp_link: string;
}): string {
  const listingUrl = getListingShareUrl(details.listing_id);
  const message = `Hi, I'm interested in "${details.title}" (${details.price_display}) on KibabuiMart: ${listingUrl}`;
  return `${details.whatsapp_link}?text=${encodeURIComponent(message)}`;
}

