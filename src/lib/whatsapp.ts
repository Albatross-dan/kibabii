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
  image_url?: string | null;
}): string {
  const listingUrl = getListingShareUrl(details.listing_id);
  let message = `Hi, I'm interested in "${details.title}" (${details.price_display}) on Kibumall.`;
  if (details.image_url) {
    const absoluteImg = details.image_url.startsWith('http')
      ? details.image_url
      : `${typeof window !== 'undefined' ? window.location.origin : ''}${details.image_url.startsWith('/') ? '' : '/'}${details.image_url}`;
    message += `\nPhoto: ${absoluteImg}`;
  }
  message += `\nListing: ${listingUrl}`;
  return `${details.whatsapp_link}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats a WhatsApp chat URL given a target (wa.me link or raw phone number) and prefilled message text.
 */
export function formatWhatsAppChatUrl(rawTarget: string, message: string): string {
  const trimmed = (rawTarget || '').trim();
  if (!trimmed) return '';

  const encodedMsg = encodeURIComponent(message);

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('text=')) {
      return trimmed;
    }
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}text=${encodedMsg}`;
  }

  // Raw digits or phone number
  const cleanNumber = trimmed.replace('+', '').replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}

/**
 * On-demand helper invoked on tap for a specific card in the grid.
 * Calls get_listing_whatsapp_link / get_seller_whatsapp_number on tap ONLY (no prefetching).
 * On success, opens WhatsApp with a prefilled message including the product image.
 * Returns true if opened, false if seller hasn't provided a number.
 */
export async function triggerListingWhatsApp({
  listingId,
  productId,
  sellerId,
  title,
  imageUrl,
  price
}: {
  listingId?: string;
  productId?: string;
  sellerId?: string;
  title?: string;
  imageUrl?: string;
  price?: string | number;
}): Promise<boolean> {
  const primaryTargetId = listingId || productId;
  let resolvedWa: string | null = null;
  let resolvedImg = (imageUrl || '').trim();

  if (primaryTargetId) {
    try {
      resolvedWa = await getListingWhatsAppLink(primaryTargetId);
    } catch (e) {
      console.warn('Error fetching listing WhatsApp link on click:', e);
    }

    // If null or image not provided, query listings table to resolve actual listing ID, owner_id, and image
    if (!resolvedWa || !resolvedImg) {
      try {
        const { data: foundListing } = await supabase
          .from('listings')
          .select(`
            id, owner_id, title,
            products (
              id, title, price,
              product_images (image_url, is_primary, display_order)
            ),
            accommodations (
              accommodation_images (image_url, is_primary, display_order)
            ),
            services (
              service_images (image_url, is_primary, display_order)
            ),
            events (
              banner_url
            ),
            lost_found_items (
              image_url
            )
          `)
          .or(`id.eq.${primaryTargetId},product_id.eq.${primaryTargetId},accommodation_id.eq.${primaryTargetId},service_id.eq.${primaryTargetId},lost_found_id.eq.${primaryTargetId},event_id.eq.${primaryTargetId}`)
          .maybeSingle();

        if (foundListing) {
          if (!resolvedWa && foundListing.id && foundListing.id !== primaryTargetId) {
            resolvedWa = await getListingWhatsAppLink(foundListing.id);
          }
          if (!resolvedWa && (foundListing.owner_id || sellerId)) {
            resolvedWa = await fetchSellerWhatsAppNumber(foundListing.owner_id || sellerId!);
          }
          if (!resolvedImg) {
            const pImgs = (foundListing.products as any)?.[0]?.product_images || (foundListing.products as any)?.product_images;
            const aImgs = (foundListing.accommodations as any)?.[0]?.accommodation_images || (foundListing.accommodations as any)?.accommodation_images;
            const sImgs = (foundListing.services as any)?.[0]?.service_images || (foundListing.services as any)?.service_images;
            const eImg = (foundListing.events as any)?.[0]?.banner_url || (foundListing.events as any)?.banner_url;
            const lfImg = (foundListing.lost_found_items as any)?.[0]?.image_url || (foundListing.lost_found_items as any)?.image_url;

            const primaryPImg = Array.isArray(pImgs) ? (pImgs.find((i: any) => i.is_primary)?.image_url || pImgs[0]?.image_url) : null;
            const primaryAImg = Array.isArray(aImgs) ? (aImgs.find((i: any) => i.is_primary)?.image_url || aImgs[0]?.image_url) : null;
            const primarySImg = Array.isArray(sImgs) ? (sImgs.find((i: any) => i.is_primary)?.image_url || sImgs[0]?.image_url) : null;

            resolvedImg = primaryPImg || primaryAImg || primarySImg || eImg || lfImg || '';
          }
        }
      } catch (findErr) {
        console.warn('Listing lookup for WhatsApp failed:', findErr);
      }
    }
  }

  // Fallback: check sellerId directly
  if (!resolvedWa && sellerId) {
    try {
      resolvedWa = await fetchSellerWhatsAppNumber(sellerId);
    } catch (sErr) {
      console.warn('Error fetching seller WhatsApp number on click:', sErr);
    }
  }

  if (!resolvedWa) {
    return false;
  }

  const itemTitle = (title || 'this item').trim();
  let prefilledMessage = `Hi, I'm interested in "${itemTitle}" on Kibumall.`;

  if (price !== undefined && price !== null && price !== '') {
    const formattedPrice = typeof price === 'number' ? `KSh ${price.toLocaleString('en-KE')}` : String(price);
    prefilledMessage = `Hi, I'm interested in "${itemTitle}" (${formattedPrice}) on Kibumall.`;
  }

  if (resolvedImg) {
    const absoluteImg = resolvedImg.startsWith('http')
      ? resolvedImg
      : `${typeof window !== 'undefined' ? window.location.origin : ''}${resolvedImg.startsWith('/') ? '' : '/'}${resolvedImg}`;
    prefilledMessage += `\nPhoto: ${absoluteImg}`;
  }

  const targetIdForShare = primaryTargetId || listingId;
  if (targetIdForShare) {
    const shareUrl = getListingShareUrl(targetIdForShare);
    prefilledMessage += `\nListing: ${shareUrl}`;
  }

  const finalUrl = formatWhatsAppChatUrl(resolvedWa, prefilledMessage);
  if (!finalUrl) {
    return false;
  }

  const win = window.open(finalUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    window.location.href = finalUrl;
  }
  return true;
}


