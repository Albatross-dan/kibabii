import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  ChevronRight, 
  ShieldCheck, 
  MessageCircle,
  Share2,
  MapPin,
  ArrowLeft,
  Smartphone,
  Store as StoreIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messagingService';
import { listingService } from '@/services/listingService';
import { ConversationContextDetails } from '@/types/messaging';
import { 
  getListingShareDetails, 
  getListingWhatsAppLink,
  buildListingWhatsAppUrl, 
  getListingShareUrl, 
  type ListingShareDetails 
} from '@/lib/whatsapp';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import { reviewService } from '@/services/reviewService';

const formatPrice = (price: any) => 
  `KSh ${Number(price).toLocaleString('en-KE')}`;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Resolved dynamic values
  const [categoryName, setCategoryName] = useState<string>('');
  const [subcategoryName, setSubcategoryName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [conditionName, setConditionName] = useState<string>('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [shareDetails, setShareDetails] = useState<ListingShareDetails | null>(null);
  const [realListingId, setRealListingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('description');
  const [sellerReputation, setSellerReputation] = useState<{ seller_rating: number; seller_rating_count: number }>({
    seller_rating: 0,
    seller_rating_count: 0
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        let listingData: any = null;
        try {
          // 1. Check if id is a product ID directly (matching backend contract)
          const { data: directProduct } = await supabase
            .from('products')
            .select('*, stores(id, name, slug, banner_url, verification_status), product_images(image_url, is_primary, display_order), seller:public_profiles(*)')
            .eq('id', id)
            .maybeSingle();

          if (directProduct) {
            const { data: linkedListing } = await supabase
              .from('listings')
              .select('id, views_count, favorites_count')
              .eq('product_id', directProduct.id)
              .maybeSingle();

            listingData = {
              id: linkedListing?.id || directProduct.id,
              actual_listing_id: linkedListing?.id,
              title: directProduct.title,
              description: directProduct.description,
              location: directProduct.location || 'Kibabii Campus',
              status: directProduct.status || 'active',
              listing_type: 'product',
              owner_id: directProduct.seller_id,
              created_at: directProduct.created_at,
              owner: directProduct.seller,
              products: directProduct,
              category_id: directProduct.category_id,
              subcategory_id: directProduct.subcategory_id
            };
          } else {
            // 2. Fetch from listings table (for /listing/:id or non-product listings)
            const { data, error } = await supabase
              .from('listings')
              .select(`
                id, title, description, location, status, listing_type, owner_id, product_id, accommodation_id, service_id, lost_found_id, event_id, created_at,
                owner:public_profiles(*),
                accommodations (
                  id, accommodation_type, price_per_month, deposit_amount, distance_from_campus_km,
                  availability_status, bedrooms, bathrooms,
                  accommodation_images (image_url, is_primary, display_order)
                ),
                services (
                  id, title, description, price, starting_price, pricing_type, working_hours,
                  service_images (image_url, is_primary, display_order)
                ),
                lost_found_items (
                  id, item_name, description, item_type, image_url, location_text, contact_phone, event_date, status
                ),
                events (
                  id, title, description, is_free, ticket_price, banner_url, event_date, start_time, location_text
                )
              `)
              .eq('id', id)
              .maybeSingle();

            if (!error && data) {
              listingData = data;
              if (data.listing_type === 'product' && data.product_id) {
                const { data: pData } = await supabase
                  .from('products')
                  .select('*, stores(id, name, slug, banner_url, verification_status), product_images(image_url, is_primary, display_order), seller:public_profiles(*)')
                  .eq('id', data.product_id)
                  .single();
                if (pData) {
                  listingData.products = pData;
                  if (!listingData.owner && pData.seller) {
                    listingData.owner = pData.seller;
                  }
                }
              }
            } else {
              // 3. Fallback to local listings if applicable
              try {
                const localItems = listingService.getLocalListings();
                const foundLocal = localItems.find((l: any) => l.id === id || l.product_id === id || l.product_details?.id === id);
                if (foundLocal) {
                  listingData = { ...foundLocal };
                }
              } catch {}
            }
          }
        } catch (sbErr) {
          console.warn('Supabase fetch failed in ProductDetail:', sbErr);
        }

        if (listingData) {
          setListing(listingData);

          // Resolve real listings.id for get_listing_whatsapp_link & get_listing_share_details RPCs
          let resolvedId = listingData.actual_listing_id || listingData.id;
          if (!listingData.actual_listing_id && id) {
            try {
              const { data: foundListing } = await supabase
                .from('listings')
                .select('id')
                .or(`id.eq.${id},product_id.eq.${id},accommodation_id.eq.${id},service_id.eq.${id},lost_found_id.eq.${id},event_id.eq.${id}`)
                .maybeSingle();
              if (foundListing?.id) {
                resolvedId = foundListing.id;
              }
            } catch {}
          }

          setRealListingId(resolvedId);

          if (resolvedId) {
            try {
              const waLink = await getListingWhatsAppLink(resolvedId);
              setWhatsappLink(waLink);
            } catch (wCatch) {
              console.warn('Error fetching listing WhatsApp link:', wCatch);
              setWhatsappLink(null);
            }

            try {
              const sDetails = await getListingShareDetails(resolvedId);
              if (sDetails) {
                setShareDetails(sDetails);
                if (sDetails.whatsapp_link) {
                  setWhatsappLink(sDetails.whatsapp_link.trim());
                }
              }
            } catch (sCatch) {
              console.warn('Error fetching listing share details:', sCatch);
            }
          } else {
            setWhatsappLink(null);
            setShareDetails(null);
          }

          let prod = Array.isArray(listingData.products) ? listingData.products[0] : listingData.products;

          // If product relation was null but product_id exists, fetch product details
          if (!prod && listingData.listing_type === 'product' && listingData.product_id) {
            try {
              const { data: directProd } = await supabase
                .from('products')
                .select(`
                  *,
                  stores (*),
                  product_images (image_url, is_primary, display_order)
                `)
                .eq('id', listingData.product_id)
                .maybeSingle();
              if (directProd) prod = directProd;
            } catch (pErr) {
              console.warn('Direct product fetch failed:', pErr);
            }
          }

          setProduct(prod);

          // Resolve seller trust reputation (profiles.seller_rating / profiles.seller_rating_count)
          const sellerOwnerId = listingData.owner_id || prod?.seller_id;
          if (sellerOwnerId) {
            reviewService.getSellerReputation(sellerOwnerId).then((rep) => {
              setSellerReputation(rep);
            }).catch(() => {});
          }

          if (prod) {
            // Sort images and set active
            const sortedImages = prod.product_images
              ?.sort((a: any, b: any) => a.display_order - b.display_order)
              ?.map((img: any) => img.image_url)
              || [];
            setAllImages(sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80']);

            const primaryImage = prod.product_images
              ?.sort((a: any, b: any) => a.display_order - b.display_order)
              ?.find((img: any) => img.is_primary)
              ?? prod.product_images?.[0];
            setActiveImage(primaryImage?.image_url || sortedImages[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80');

            // Lookup category name
            if (prod.category_id) {
              const { data: catData } = await supabase
                .from('categories')
                .select('name')
                .eq('id', prod.category_id)
                .maybeSingle();
              if (catData) {
                setCategoryName(catData.name);
              } else {
                setCategoryName(String(prod.category_id));
              }
            }
            // Lookup subcategory name
            if (prod.subcategory_id) {
              const { data: subCatData } = await supabase
                .from('subcategories')
                .select('name')
                .eq('id', prod.subcategory_id)
                .maybeSingle();
              if (subCatData) {
                setSubcategoryName(subCatData.name);
              } else {
                setSubcategoryName(String(prod.subcategory_id));
              }
            }
            // Lookup brand name
            if (prod.brand_id) {
              const { data: brandData } = await supabase
                .from('brands')
                .select('name')
                .eq('id', prod.brand_id)
                .maybeSingle();
              if (brandData) setBrandName(brandData.name);
            }
            // Lookup condition name
            if (prod.condition_id) {
              const { data: condData } = await supabase
                .from('conditions')
                .select('name')
                .eq('id', prod.condition_id)
                .maybeSingle();
              if (condData) {
                setConditionName(condData.name);
              } else {
                setConditionName(String(prod.condition_id));
              }
            }
          } else {
            // Accommodation Listing Fallback
            let acc = Array.isArray(listingData.accommodations) ? listingData.accommodations[0] : listingData.accommodations;

            if (!acc && listingData.accommodation_id) {
              try {
                const { data: directAcc } = await supabase
                  .from('accommodations')
                  .select(`
                    id, accommodation_type, price_per_month, deposit_amount, distance_from_campus_km,
                    availability_status, bedrooms, bathrooms,
                    accommodation_images (image_url, is_primary, display_order)
                  `)
                  .eq('id', listingData.accommodation_id)
                  .maybeSingle();
                if (directAcc) acc = directAcc;
              } catch (aErr) {
                console.warn('Direct accommodation fetch failed:', aErr);
              }
            }

            if (acc) {
              const sortedAccImages = (acc.accommodation_images || [])
                .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((img: any) => img.image_url);
              setAllImages(sortedAccImages.length > 0 ? sortedAccImages : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80']);
              setActiveImage(sortedAccImages[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80');
              setCategoryName(acc.accommodation_type ? acc.accommodation_type.toUpperCase() : 'Accommodation');
              setProduct({
                id: acc.id,
                price: acc.price_per_month,
                currency: 'KSh',
                status: acc.availability_status || 'available',
                quantity: 1,
                condition: acc.accommodation_type,
                original_price: null
              } as any);
            } else if (listingData.listing_type === 'service') {
              const srv = Array.isArray(listingData.services) ? listingData.services[0] : listingData.services;
              const srvImages = (srv?.service_images || [])
                .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((img: any) => img.image_url);
              setAllImages(srvImages.length > 0 ? srvImages : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80']);
              setActiveImage(srvImages[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80');
              setCategoryName('SERVICE');
              setProduct({
                id: listingData.id,
                price: srv?.price ?? srv?.starting_price ?? 0,
                currency: 'KSh',
                status: listingData.status || 'active',
                quantity: 1,
                condition: srv?.pricing_type || 'fixed',
                original_price: null
              } as any);
            } else if (listingData.listing_type === 'lost_found') {
              const lf = Array.isArray(listingData.lost_found_items) ? listingData.lost_found_items[0] : listingData.lost_found_items;
              const lfImages = lf?.image_url ? [lf.image_url] : ['https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&q=80'];
              setAllImages(lfImages);
              setActiveImage(lfImages[0]);
              setCategoryName(lf?.item_type === 'found' ? 'FOUND ITEM' : 'LOST ITEM');
              setProduct({
                id: listingData.id,
                price: 0,
                currency: 'KSh',
                status: listingData.status || 'active',
                quantity: 1,
                condition: lf?.item_type || 'notice',
                original_price: null
              } as any);
            } else if (listingData.listing_type === 'event') {
              const ev = Array.isArray(listingData.events) ? listingData.events[0] : listingData.events;
              const evImages = ev?.banner_url ? [ev.banner_url] : ['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80'];
              setAllImages(evImages);
              setActiveImage(evImages[0]);
              setCategoryName('EVENT');
              setProduct({
                id: listingData.id,
                price: ev?.is_free ? 0 : (ev?.ticket_price || 0),
                currency: 'KSh',
                status: listingData.status || 'active',
                quantity: 1,
                condition: ev?.is_free ? 'Free' : 'Ticketed',
                original_price: null
              } as any);
            } else {
              // Generic listing fallback (services, events, etc.)
              setAllImages(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80']);
              setActiveImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80');
              setCategoryName(listingData.listing_type ? listingData.listing_type.toUpperCase() : 'Listing');
              setProduct({
                id: listingData.id,
                price: 0,
                currency: 'KSh',
                status: listingData.status || 'active',
                quantity: 1,
                condition: 'standard',
                original_price: null
              } as any);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        toast.error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !listing) return;
    if (listing.listing_type && listing.listing_type !== 'product') return;

    setIsAddingToCart(true);
    try {
      await addItem(product.id, 1);
      toast.success('Added to cart');
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
      if (err?.message && !err.message.includes('Authentication required')) {
        toast.error(err.message || 'Failed to add to cart');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const { toggleFavorite, hasItem } = useWishlistStore();
  const listingId = listing?.actual_listing_id || listing?.id || id || '';
  const isFavorited = Boolean(
    (listingId && hasItem(listingId)) ||
    (listing?.id && hasItem(listing.id)) ||
    (id && hasItem(id))
  );

  const handleToggleFavorites = async () => {
    if (!listingId) return;
    await toggleFavorite(listingId);
  };

  const currentUserId = user?.id;
  const sellerId = listing?.owner_id || product?.seller_id;
  const isOwner = Boolean(currentUserId && sellerId && currentUserId === sellerId);
  const isInactive = Boolean(listing && listing.status && listing.status !== 'active');

  const handleWhatsAppClick = () => {
    const targetLink = whatsappLink || shareDetails?.whatsapp_link;
    if (!targetLink) return;

    const activeListingId = shareDetails?.listing_id || realListingId || listing?.actual_listing_id || listing?.id || id || '';
    const title = shareDetails?.title || listing?.title || product?.title || 'item';
    const priceDisplay = shareDetails?.price_display || (product ? `KES ${product.price}` : 'Price on request');

    const clickUrl = buildListingWhatsAppUrl({
      listing_id: activeListingId,
      title,
      price_display: priceDisplay,
      whatsapp_link: targetLink
    });

    window.open(clickUrl, '_blank', 'noopener,noreferrer');
  };

  // Dynamic Open Graph meta tags per listing detail page for WhatsApp link preview unfurling
  useEffect(() => {
    if (!listing && !shareDetails && !product) return;

    const activeListingId = shareDetails?.listing_id || realListingId || listing?.actual_listing_id || listing?.id || id || '';
    const listingUrl = getListingShareUrl(activeListingId);
    const title = shareDetails?.title || listing?.title || product?.title || 'Listing Details';
    const price = shareDetails?.price_display || (product?.price ? `KES ${product.price}` : '');
    const description = price
      ? `${price} • ${listing?.description || 'KibabuiMart university marketplace'}`
      : (listing?.description || 'KibabuiMart university marketplace');
    const imageUrl = shareDetails?.image_url || activeImage || (allImages && allImages[0]) || '';

    const prevTitle = document.title;
    document.title = `${title} ${price ? `(${price})` : ''} | KibabuiMart`;

    const setMeta = (attr: 'property' | 'name', key: string, val: string) => {
      if (!val) return;
      let meta = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', val);
    };

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', price || description);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:url', listingUrl);
    setMeta('property', 'og:type', 'product');
    setMeta('property', 'og:site_name', 'KibabuiMart');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', price || description);
    setMeta('name', 'twitter:image', imageUrl);

    return () => {
      document.title = prevTitle || 'KibabuiMart';
    };
  }, [listing, shareDetails, product, activeImage, allImages, realListingId, id]);


  const handleChatWithSeller = async () => {
    if (!user) {
      toast.info('Please sign in to message the seller.');
      navigate('/auth/login');
      return;
    }
    if (!sellerId) {
      toast.error('Seller not found!');
      return;
    }
    if (isOwner) {
      toast.error('You cannot message yourself about your own listing.');
      return;
    }
    if (isInactive) {
      toast.error('This listing is no longer active.');
      return;
    }

    const contextType = listing?.listing_type || 'product';
    const contextId = listing?.id || product?.id || id || '';

    // Prepare context details immediately
    const contextDetails: ConversationContextDetails = {
      type: (contextType === 'accommodation' ? 'accommodation' : contextType === 'service' ? 'service' : 'product'),
      id: contextId,
      title: listing?.title || product?.title || 'Listing',
      price: Number(product?.price || (listing as any)?.price || (listing as any)?.rent_amount || 0),
      imageUrl: activeImage || allImages[0] || (listing as any)?.image_url || '',
      category: listing?.listing_type || (listing as any)?.category,
      ownerId: sellerId
    };

    // Cache context details instantly for 0ms retrieval
    messagingService.setContextCache(contextDetails.id, contextDetails);

    const ownerObj = (listing as any)?.owner;
    const prodObj = product as any;
    const storeObj = prodObj?.stores;

    const otherParticipantInfo = {
      id: sellerId,
      full_name: storeObj?.name || ownerObj?.full_name || ownerObj?.username || 'Campus Seller',
      username: storeObj?.slug || ownerObj?.username || 'seller',
      avatar_url: ownerObj?.avatar_url || null,
      phone: ownerObj?.phone || (listing as any)?.contact_phone || null,
      role: (storeObj ? 'store' : ownerObj?.role || 'seller') as any,
      is_verified: !!(storeObj?.is_verified || ownerObj?.is_verified)
    };

    try {
      // Instant cache check + fast RPC race
      const convId = await messagingService.startOrGetConversation(
        contextType as any,
        contextId,
        sellerId,
        user.id
      );

      navigate(`/messages/${convId}`, {
        state: {
          contextDetails,
          otherParticipant: otherParticipantInfo
        }
      });
    } catch (err: any) {
      console.warn('Could not start conversation, falling back to local thread:', err);
      const fallbackId = await messagingService.startOrGetLocalConversation(
        contextType as any,
        contextId,
        sellerId,
        user.id
      );
      navigate(`/messages/${fallbackId}`, {
        state: {
          contextDetails,
          otherParticipant: otherParticipantInfo
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-8 animate-pulse text-left">
        <div className="h-6 w-1/4 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square w-full bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded-lg"></div>
            <div className="h-24 w-full bg-gray-200 rounded-2xl"></div>
            <div className="h-32 w-full bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="text-4xl">🔍</span>
        <h2 className="text-2xl font-black text-slate-800">Listing Not Found</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">This product listing might have been removed or is no longer available.</p>
        <Button onClick={() => navigate('/products')} className="bg-primary hover:bg-primary/95 text-white rounded-xl">Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Back navigation arrow and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0 border border-slate-100 bg-white hover:bg-slate-50 shadow-sm h-9 w-9">
          <ArrowLeft className="h-4 w-4 text-slate-800" />
        </Button>
        <nav className="flex items-center text-xs sm:text-sm text-muted-foreground min-w-0">
          <Link to="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
          <ChevronRight className="mx-1 sm:mx-2 h-4 w-4 shrink-0" />
          <Link to="/products" className="hover:text-primary transition-colors shrink-0">Products</Link>
          <ChevronRight className="mx-1 sm:mx-2 h-4 w-4 shrink-0" />
          <span className="text-foreground font-medium truncate">{listing.title}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4 font-sans">
          <div className="aspect-square rounded-3xl overflow-hidden border bg-white flex items-center justify-center p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={handleToggleFavorites}
              aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
              className={`absolute top-4 right-4 z-10 p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md cursor-pointer ${
                isFavorited
                  ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
                  : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-white text-white' : ''}`} />
            </button>

            {activeImage ? (
              <img 
                src={activeImage} 
                alt={listing.title} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-[#0F172A] flex items-center justify-center rounded-3xl">
                <span className="font-black text-white text-lg">Kibabii<span className="text-primary">Mart</span></span>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {allImages.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden border bg-white cursor-pointer transition-colors flex items-center justify-center p-2 sm:p-3 ${activeImage === img ? 'border-primary border-2' : 'hover:border-primary/50'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="bg-orange-500 text-white uppercase">
                {conditionName || product?.condition || 'second_hand'}
              </Badge>
              {(() => {
                const prodObj = product as any;
                const storeObj = prodObj?.stores;
                // Only show store option if product.stores is present and store_id is set
                const hasStore = Boolean(prodObj?.store_id && storeObj && (storeObj.slug || storeObj.id));

                if (hasStore) {
                  const storeSlug = storeObj.slug || storeObj.id;
                  const isVerified = storeObj.verification_status === 'verified';
                  return (
                    <Link
                      to={`/store/${storeSlug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      <StoreIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{storeObj.name}</span>
                      {isVerified && (
                        <span title="Verified Store" className="inline-flex">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                        </span>
                      )}
                    </Link>
                  );
                }

                // Plain personal / student listing — do NOT show any store link
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    🎓 Student Peer-to-Peer
                  </span>
                );
              })()}
              {product?.is_negotiable && <Badge variant="outline" className="border-accent text-accent">NEGOTIABLE</Badge>}
              <Badge variant="secondary" className="bg-green-100 text-green-700">IN STOCK</Badge>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight">{listing.title}</h1>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  setTimeout(() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
                title="View customer ratings and reviews"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900">
                  {product?.rating_avg && Number(product.rating_avg) > 0 
                    ? Number(product.rating_avg).toFixed(1) 
                    : '0.0'}
                </span>
                <span className="text-muted-foreground text-xs font-semibold">
                  ({product?.rating_count || 0} {product?.rating_count === 1 ? 'review' : 'reviews'})
                </span>
              </button>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">Category: <span className="font-medium text-foreground">{categoryName || 'General'}</span></span>
            </div>
          </div>

          <div className="p-6 bg-muted/30 rounded-2xl space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-primary font-mono">
                {product?.price ? formatPrice(product.price) : 'Contact for Price'}
              </span>
              {product?.original_price && (
                <span className="text-xl text-muted-foreground line-through font-mono">
                  {formatPrice(product.original_price)}
                </span>
              )}
              {product?.original_price && product?.price && (
                <Badge className="bg-primary text-white">
                  -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                </Badge>
              )}
            </div>
            
            {isOwner ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-2">
                <span className="font-bold">Notice:</span>
                <span>This is your listing. Messaging is disabled for your own items.</span>
              </div>
            ) : isInactive ? (
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs font-semibold flex items-center gap-2">
                <span>This listing is no longer active or has been sold.</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {listing?.listing_type === 'product' && (
                  <Button 
                    size="lg" 
                    className="w-full h-13 text-base font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer disabled:opacity-50 shadow-sm rounded-xl" 
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                )}
                <div className={`grid gap-3 ${whatsappLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-12 text-sm sm:text-base font-bold cursor-pointer border-2 border-secondary/20 text-secondary hover:bg-secondary/5 flex items-center justify-center gap-2 rounded-xl" 
                    onClick={handleChatWithSeller}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat in App
                  </Button>
                  {whatsappLink && (
                    <Button 
                      size="lg" 
                      className="h-12 text-sm sm:text-base font-bold cursor-pointer bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center gap-2 shadow-sm rounded-xl" 
                      onClick={handleWhatsAppClick}
                    >
                      <Smartphone className="h-5 w-5" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seller Card */}
          <Card className="rounded-2xl border bg-white overflow-hidden">
            <CardContent className="p-6">
              {(() => {
                const prodObj = product as any;
                const storeObj = prodObj?.stores;
                // Only show store option if product.stores is present and store_id is set
                const hasStore = Boolean(prodObj?.store_id && storeObj && (storeObj.slug || storeObj.id));

                if (hasStore) {
                  const storeSlug = storeObj.slug || storeObj.id;
                  const isVerified = storeObj.verification_status === 'verified';

                  return (
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden">
                            {storeObj.banner_url ? (
                              <img 
                                src={storeObj.banner_url} 
                                alt={storeObj.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <StoreIcon className="w-7 h-7" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-lg text-slate-900 leading-snug">{storeObj.name}</h3>
                              {isVerified && (
                                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold py-0.5">
                                  <ShieldCheck className="h-3 w-3 text-indigo-600 mr-1 inline" /> Verified Store
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Official Campus Storefront
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Link 
                          to={`/store/${storeSlug}`} 
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm group cursor-pointer"
                        >
                          <StoreIcon className="w-4 h-4 text-white shrink-0" />
                          <span>View all products from {storeObj.name}</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16 border-2 border-muted">
                        <AvatarFallback className="bg-secondary text-white text-xl font-bold">
                          {listing.owner?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-1">
                          {listing.owner?.full_name || 'Kibabii Student'}
                          {listing.owner?.is_verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">Joined {listing.owner?.created_at ? new Date(listing.owner.created_at).toLocaleDateString() : 'recently'}</p>
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">🎓 Student Comrade Seller</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Campus</p>
                  <p className="font-bold text-secondary text-xs truncate">{listing.location || 'Main Campus'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Seller Rating</p>
                  <p className="font-mono font-bold text-secondary">
                    {sellerReputation.seller_rating > 0 
                      ? `${sellerReputation.seller_rating.toFixed(1)} ★` 
                      : 'New Seller'}
                  </p>
                </div>
              </div>

              {/* Trust Signal: Overall Seller Reputation across ALL listings */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Reputation</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {sellerReputation.seller_rating > 0 
                        ? `${sellerReputation.seller_rating.toFixed(1)} ★ across ${sellerReputation.seller_rating_count} reviews` 
                        : 'New campus seller (0 reviews)'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 shrink-0">
                  Trust Score
                </Badge>
              </div>

              {isOwner ? (
                <Button className="w-full bg-slate-100 text-slate-400 cursor-not-allowed h-11 text-sm font-bold rounded-xl" disabled>
                  Your Listing
                </Button>
              ) : isInactive ? (
                <Button className="w-full bg-slate-100 text-slate-400 cursor-not-allowed h-11 text-sm font-bold rounded-xl" disabled>
                  Listing Closed
                </Button>
              ) : whatsappLink ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="w-full bg-secondary hover:bg-secondary/90 text-white cursor-pointer h-11 text-sm font-bold flex items-center justify-center gap-1.5 rounded-xl" 
                    onClick={handleChatWithSeller}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    Chat in App
                  </Button>
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white border-none cursor-pointer h-11 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm rounded-xl" 
                    onClick={handleWhatsAppClick}
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />
                    WhatsApp
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90 text-white cursor-pointer h-11 text-sm font-bold flex items-center justify-center gap-2 rounded-xl" 
                  onClick={handleChatWithSeller}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat with Seller
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Location: <span className="font-semibold">{listing.location || 'Kibabii University, Main Campus'}</span></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>Security Guarantee: <span className="font-semibold">Verified Listing</span></span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 cursor-pointer">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button 
                variant={isFavorited ? "default" : "outline"}
                size="sm" 
                className={`h-8 px-3 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                  isFavorited 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700' 
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
                }`} 
                onClick={handleToggleFavorites}
              >
                <Heart className={`mr-1.5 h-4 w-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
                {isFavorited ? 'Saved to Wishlist' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-12 p-0 gap-6 sm:gap-8 overflow-x-auto">
            <TabsTrigger 
              value="description" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-sm sm:text-base cursor-pointer"
            >
              Description
            </TabsTrigger>
            <TabsTrigger 
              value="specifications" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-sm sm:text-base cursor-pointer"
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-sm sm:text-base flex items-center gap-1.5 cursor-pointer"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Reviews ({product?.rating_count || 0})</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-8 prose max-w-none text-muted-foreground">
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{listing.description}</div>
          </TabsContent>
          <TabsContent value="specifications" className="py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Condition', value: conditionName || product?.condition || 'second_hand' },
                { label: 'Negotiable', value: product?.is_negotiable ? 'Yes' : 'No' },
                { label: 'Category', value: categoryName || 'General' },
                { label: 'Subcategory', value: subcategoryName || 'None' },
                { label: 'Brand', value: brandName || 'None' },
                { label: 'Quantity Available', value: product?.quantity || 1 },
              ].map(spec => (
                <div key={spec.label} className="flex justify-between p-3 border-b text-sm">
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-bold text-slate-800">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-6">
            <ReviewsSection 
              targetType="product"
              targetId={product?.id || listing.product_id || listing.id}
              targetTitle={listing.title}
              targetRatingAvg={product?.rating_avg || 0}
              targetRatingCount={product?.rating_count || 0}
              sellerId={listing.owner_id || product?.seller_id}
              sellerName={listing.owner?.full_name || 'Seller'}
              onReviewUpdated={async () => {
                // Re-fetch precomputed product rating_avg, rating_count and seller reputation
                const prodId = product?.id || listing.product_id || id;
                if (prodId) {
                  try {
                    const { data: updatedProd } = await supabase
                      .from('products')
                      .select('rating_avg, rating_count')
                      .eq('id', prodId)
                      .maybeSingle();
                    if (updatedProd) {
                      setProduct((prev: any) => ({ ...prev, ...updatedProd }));
                    }
                  } catch {}
                }
                const sId = listing.owner_id || product?.seller_id;
                if (sId) {
                  try {
                    const rep = await reviewService.getSellerReputation(sId);
                    setSellerReputation(rep);
                  } catch {}
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
