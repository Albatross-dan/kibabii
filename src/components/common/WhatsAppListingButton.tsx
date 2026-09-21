import React, { useEffect, useState } from 'react';
import { MessageCircle, Smartphone } from 'lucide-react';
import { 
  getListingShareDetails, 
  getListingWhatsAppLink, 
  buildListingWhatsAppUrl,
  getListingShareUrl,
  type ListingShareDetails 
} from '@/lib/whatsapp';

interface WhatsAppListingButtonProps {
  listingId: string;
  title?: string;
  priceDisplay?: string;
  variant?: 'button' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

// In-memory caches to prevent repeated RPC calls for the same listing
const shareDetailsCache = new Map<string, ListingShareDetails | null>();
const waLinkCache = new Map<string, string | null>();

export const WhatsAppListingButton: React.FC<WhatsAppListingButtonProps> = ({
  listingId,
  title,
  priceDisplay,
  variant = 'button',
  size = 'md',
  className = '',
  children
}) => {
  const [details, setDetails] = useState<ListingShareDetails | null>(() => {
    if (listingId && shareDetailsCache.has(listingId)) {
      return shareDetailsCache.get(listingId) || null;
    }
    return null;
  });

  const [waLink, setWaLink] = useState<string | null>(() => {
    if (listingId && waLinkCache.has(listingId)) {
      return waLinkCache.get(listingId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (!listingId) return;

    if (shareDetailsCache.has(listingId)) {
      const cached = shareDetailsCache.get(listingId) || null;
      setDetails(cached);
      setWaLink(cached?.whatsapp_link || waLinkCache.get(listingId) || null);
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        // Fetch share details (title, price_display, image_url, whatsapp_link)
        const sDetails = await getListingShareDetails(listingId);
        shareDetailsCache.set(listingId, sDetails);

        let resolvedWaLink = sDetails?.whatsapp_link || null;
        if (!resolvedWaLink) {
          // Fallback check on get_listing_whatsapp_link if share details did not return one
          resolvedWaLink = await getListingWhatsAppLink(listingId);
        }
        waLinkCache.set(listingId, resolvedWaLink);

        if (isMounted) {
          setDetails(sDetails);
          setWaLink(resolvedWaLink);
        }
      } catch (err) {
        shareDetailsCache.set(listingId, null);
        waLinkCache.set(listingId, null);
        if (isMounted) {
          setDetails(null);
          setWaLink(null);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [listingId]);

  // If null or empty, DO NOT RENDER anything per contract
  if (!waLink) return null;

  const resolvedTitle = details?.title || title || 'item';
  const resolvedPrice = details?.price_display || priceDisplay || 'Price on request';

  const href = buildListingWhatsAppUrl({
    listing_id: details?.listing_id || listingId,
    title: resolvedTitle,
    price_display: resolvedPrice,
    whatsapp_link: waLink
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (variant === 'icon') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer ${className}`}
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={14} />
      </a>
    );
  }

  if (variant === 'badge') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold rounded-full shadow-sm transition-transform active:scale-95 cursor-pointer ${className}`}
        title="Contact Seller on WhatsApp"
      >
        <Smartphone size={13} />
        <span>WhatsApp</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer ${
        size === 'sm' ? 'h-9 px-3 text-xs' : size === 'lg' ? 'h-12 px-5 text-base' : 'h-11 px-4 text-sm'
      } ${className}`}
    >
      <Smartphone className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      {children || 'WhatsApp'}
    </a>
  );
};

