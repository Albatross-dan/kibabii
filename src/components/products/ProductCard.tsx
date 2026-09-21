import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, MapPin, ShieldCheck, Store as StoreIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
import { Product } from '@/services/productService';
import AccountBadge from '@/components/products/AccountBadge';

interface ProductCardProps {
  product: Product;
  key?: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, hasItem } = useWishlistStore();
  const listingId = product.listing_id || (product as any).listings?.[0]?.id || product.id;
  const isWishlisted = hasItem(listingId) || hasItem(product.id);
  const [isAdding, setIsAdding] = React.useState(false);

  const isProductListing = !(product as any).listing_type || (product as any).listing_type === 'product';
  const primaryImg = (product as any).product_images?.find((img: any) => img.is_primary)?.image_url
    || (product as any).product_images?.[0]?.image_url;
  const coverImage = primaryImg || product.images?.[0] || (product as any).image || (product as any).primary_image || `https://picsum.photos/seed/${product.id}/400/400`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    setIsAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success('Added to cart!');
    } catch (err: any) {
      console.error('Failed to add item to cart:', err);
      if (err?.message && !err.message.includes('Authentication required')) {
        toast.error(err.message || 'Failed to add item to cart');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(listingId);
  };

  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0;

  return (
    <div 
      onClick={() => navigate(`/products/${product.id}`)}
      className="group block cursor-pointer"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/products/${product.id}`);
        }
      }}
    >
      <Card className="overflow-hidden border border-gray-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative bg-white rounded-lg">
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
          {product.condition === 'new' ? (
            <Badge className="bg-accent hover:bg-accent/90 border-none text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">NEW</Badge>
          ) : (
            <Badge variant="secondary" className="bg-secondary text-white hover:bg-secondary/90 border-none text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">2ND HAND</Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-primary text-white border-none text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">-{discount}%</Badge>
          ) || (product.is_negotiable && (
            <Badge className="bg-blue-500 text-white border-none text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">NEGOTIABLE</Badge>
          ))}
        </div>

        <button 
          type="button"
          aria-label={isWishlisted ? "Remove from favorites" : "Save to favorites"}
          className={`absolute top-1.5 right-1.5 z-10 p-1.5 bg-white/90 backdrop-blur-md rounded-md transition-all shadow-xs hover:scale-105 cursor-pointer ${
            isWishlisted 
              ? 'text-rose-500 opacity-100' 
              : 'text-gray-500 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:text-rose-500 hover:opacity-100'
          }`}
          onClick={handleWishlistToggle}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Image */}
        <div className="aspect-square overflow-hidden relative bg-slate-50 flex items-center justify-center p-2">
          <img
            src={coverImage}
            alt={product.title}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/[0.01] group-hover:bg-transparent transition-colors"></div>
        </div>

        <CardContent className="p-2 sm:p-2.5 space-y-1.5 text-left">
          {/* Title */}
          <h3 className="font-bold text-secondary text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(product.rating ?? 5) ? 'fill-current' : 'text-gray-300'}`} />
               ))}
            </div>
            <span className="text-[9px] text-gray-400 font-bold">({product.total_reviews ?? 0})</span>
          </div>

          {/* Metadata: Seller Type, Verification and Location */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100 text-[10px] font-sans">
            <div className="flex items-center justify-between gap-1 overflow-visible">
              {(() => {
                const storeObj = (product as any).stores;
                const hasStore = Boolean((product as any).store_id && (storeObj?.slug || storeObj?.id || (product as any).store_id));
                const storeName = storeObj?.name || storeObj?.store_name || 'Campus Store';
                const isVerifiedStore = storeObj?.verification_status === 'verified';
                const storeSlug = storeObj?.slug || storeObj?.id || (product as any).store_id;

                if (hasStore) {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (storeSlug && storeSlug !== 'undefined') {
                          navigate(`/store/${storeSlug}`);
                        } else {
                          navigate('/stores');
                        }
                      }}
                      className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 px-1.5 py-0.5 rounded font-bold text-[9px] transition-colors truncate max-w-[125px] cursor-pointer"
                      title={`Store: ${storeName}`}
                    >
                      <StoreIcon className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{storeName}</span>
                      {isVerifiedStore && (
                        <span title="Verified Store" className="inline-flex">
                          <ShieldCheck className="w-2.5 h-2.5 text-indigo-600 fill-indigo-100 shrink-0" />
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-bold text-[9px]">
                    🎓 Student
                  </span>
                );
              })()}
              
              {(() => {
                const isStoreSeller = (product as any).seller_type === 'store' || Boolean((product as any).store_id);
                const storeObj = (product as any).stores;
                const isVerifiedStore = Boolean(storeObj?.is_verified || storeObj?.verification_badge_tier);

                return (
                  <AccountBadge 
                    emailVerified={(product.seller as any)?.email_verified ?? true}
                    studentVerificationStatus={!isStoreSeller ? ((product.seller as any)?.student_verification_status ?? 'approved') : 'unverified'}
                    storeVerificationStatus={isStoreSeller ? ((product.seller as any)?.store_verification_status || isVerifiedStore ? 'approved' : 'unverified') : 'unverified'}
                    isTopSeller={(product.seller as any)?.is_top_seller ?? (product.rating ? product.rating >= 4.7 : false)}
                    role={isStoreSeller ? 'store' : 'student'}
                    size="sm"
                  />
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-slate-400 gap-1 font-semibold text-[9px]">
              <span className="truncate flex items-center gap-0.5 text-slate-500">
                <MapPin className="h-2.5 w-2.5 text-red-400 shrink-0" />
                {product.location || 'Campus'}
              </span>
              <span className="capitalize px-1 py-0.2 bg-slate-100 text-slate-500 border border-slate-200/50 rounded shrink-0 text-[8px]">
                {product.category_id ? product.category_id.replace('-', ' ') : 'Campus'}
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
            <div className="flex flex-col">
               <div className="flex items-baseline gap-1">
                 <span className="text-xs sm:text-sm font-black text-primary leading-tight">
                    {formatPrice(product.price).replace('KES', 'KSh').trim()}
                 </span>
               </div>
               {product.original_price && (
                 <span className="text-[9px] text-gray-400 line-through font-bold">
                    {formatPrice(product.original_price)}
                 </span>
               )}
            </div>
            
            {isProductListing && (
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                aria-label="Add to cart"
                className="p-1.5 bg-secondary text-white rounded-md hover:bg-primary transition-all cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
