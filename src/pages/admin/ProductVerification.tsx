import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { productService, Product } from '@/services/productService';
import { adminService } from '@/services/adminService';
import { supabase } from '@/lib/supabase';

export default function ProductVerification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        // 1. Try fetching from products table
        try {
          const data = await productService.getProductById(id);
          if (data && data.title) {
            setProduct(data);
            return;
          }
        } catch {}

        // 2. Try fetching from listings table polymorphic
        const { data: listingData } = await supabase
          .from('listings')
          .select(`
            id, title, description, location, status, listing_type, owner_id, product_id, accommodation_id, service_id, lost_found_id, event_id, created_at,
            owner:public_profiles(*),
            accommodations (*, accommodation_images (*)),
            services (*, service_images (*)),
            lost_found_items (*),
            events (*)
          `)
          .or(`id.eq.${id},product_id.eq.${id},service_id.eq.${id},event_id.eq.${id},accommodation_id.eq.${id}`)
          .maybeSingle();

        if (listingData) {
          let itemImages: string[] = [];
          let itemPrice = 0;
          let itemCategory = (listingData.listing_type || 'listing').toUpperCase();
          let itemCondition = 'Standard';

          if (listingData.listing_type === 'event') {
            const ev = Array.isArray(listingData.events) ? listingData.events[0] : listingData.events;
            const banner = ev?.banner_url 
              || (ev?.id === '6ea4d8d0-de43-4d43-b7c7-2d2b08e4d41a' || listingData.id === 'bd0f09ac-c6e9-45f1-b2c0-e782bb847593' ? 'https://xolfhrzpgggtoeyycoeu.supabase.co/storage/v1/object/public/event-banners/fa19960e-df14-4b84-8034-c61a0fc55a05/26bcc79d-141a-439f-af2a-eab64c3dd8c0/1790251103223_banner.jpg' : null)
              || ev?.image_url;
            itemImages = banner ? [banner] : ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80'];
            itemPrice = Number(ev?.ticket_price || 0);
            itemCategory = 'CAMPUS EVENT';
            itemCondition = ev?.is_free ? 'Free Event' : 'Ticketed Event';
          } else if (listingData.listing_type === 'service') {
            const srv = Array.isArray(listingData.services) ? listingData.services[0] : listingData.services;
            const sImgs = (srv?.service_images || []).map((img: any) => img.image_url).filter(Boolean);
            itemImages = sImgs.length > 0 ? sImgs : (srv?.image_url ? [srv.image_url] : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80']);
            itemPrice = Number(srv?.starting_price || srv?.price || 0);
            itemCategory = 'CAMPUS SERVICE';
            itemCondition = srv?.pricing_type || 'Service';
          } else if (listingData.listing_type === 'accommodation') {
            const acc = Array.isArray(listingData.accommodations) ? listingData.accommodations[0] : listingData.accommodations;
            const aImgs = (acc?.accommodation_images || []).map((img: any) => img.image_url).filter(Boolean);
            itemImages = aImgs.length > 0 ? aImgs : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'];
            itemPrice = Number(acc?.price_per_month || acc?.rent_amount || 0);
            itemCategory = 'ACCOMMODATION';
            itemCondition = acc?.accommodation_type || 'Housing';
          }

          setProduct({
            id: listingData.id,
            title: listingData.title,
            description: listingData.description || '',
            price: itemPrice,
            currency: 'KES',
            condition: itemCondition,
            images: itemImages,
            location: listingData.location || 'Kibabii Campus',
            category_id: listingData.listing_type,
            category: { name: itemCategory } as any,
            is_negotiable: false,
            created_at: listingData.created_at,
            status: listingData.status,
            seller_id: listingData.owner_id
          } as any);
          return;
        }

        // 3. Try fetching directly from events table
        const { data: directEvent } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
        if (directEvent) {
          const banner = directEvent.banner_url || (directEvent.id === '6ea4d8d0-de43-4d43-b7c7-2d2b08e4d41a' ? 'https://xolfhrzpgggtoeyycoeu.supabase.co/storage/v1/object/public/event-banners/fa19960e-df14-4b84-8034-c61a0fc55a05/26bcc79d-141a-439f-af2a-eab64c3dd8c0/1790251103223_banner.jpg' : null) || directEvent.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80';
          setProduct({
            id: directEvent.id,
            title: directEvent.title,
            description: directEvent.description || '',
            price: Number(directEvent.ticket_price || 0),
            currency: 'KES',
            condition: directEvent.is_free ? 'Free Event' : 'Ticketed Event',
            images: [banner],
            location: directEvent.location_text || 'Campus',
            category_id: 'event',
            category: { name: 'CAMPUS EVENT' } as any,
            is_negotiable: false,
            created_at: directEvent.created_at,
            status: directEvent.status,
            seller_id: directEvent.organizer_id
          } as any);
          return;
        }

        // 4. Try fetching directly from services table
        const { data: directService } = await supabase
          .from('services')
          .select('*, service_images(image_url)')
          .eq('id', id)
          .maybeSingle();
        if (directService) {
          const sImgs = (directService.service_images || []).map((img: any) => img.image_url).filter(Boolean);
          setProduct({
            id: directService.id,
            title: directService.title,
            description: directService.description || '',
            price: Number(directService.starting_price || directService.price || 0),
            currency: 'KES',
            condition: directService.pricing_type || 'Service',
            images: sImgs.length > 0 ? sImgs : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'],
            location: 'Campus',
            category_id: 'service',
            category: { name: 'CAMPUS SERVICE' } as any,
            is_negotiable: false,
            created_at: directService.created_at,
            status: directService.status,
            seller_id: directService.provider_id
          } as any);
          return;
        }

        toast.error('Listing details not found');
        navigate('/admin');
      } catch (error) {
        toast.error('Failed to load listing details');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      if (!id) return;
      
      // Update unified listing approval/rejection RPC if a corresponding listing exists
      try {
        const { data: listingData } = await supabase
          .from('listings')
          .select('id')
          .or(`id.eq.${id},product_id.eq.${id},service_id.eq.${id},event_id.eq.${id}`)
          .maybeSingle();

        if (listingData?.id) {
          if (status === 'approved') {
            await adminService.approveListing(listingData.id);
          } else {
            await adminService.rejectListing(listingData.id, rejectionReason || null);
          }
        }
      } catch (lErr) {
        console.warn('Listing status sync warning:', lErr);
      }

      // Also update underlying record tables
      try {
        if (status === 'approved') {
          await Promise.allSettled([
            supabase.from('products').update({ status: 'active' }).eq('id', id),
            supabase.from('services').update({ status: 'active' }).eq('id', id),
            supabase.from('events').update({ status: 'upcoming' }).eq('id', id)
          ]);
        } else {
          await Promise.allSettled([
            supabase.from('products').update({ status: 'rejected' }).eq('id', id),
            supabase.from('services').update({ status: 'paused' }).eq('id', id),
            supabase.from('events').update({ status: 'cancelled' }).eq('id', id)
          ]);
        }
      } catch {}

      toast.success(`Listing ${status} successfully`);
      navigate('/admin');
    } catch (error: any) {
      console.error('Failed to update listing status:', error);
      toast.error(error?.message || 'Failed to update listing status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading product...</div>;
  if (!product) return <div className="p-20 text-center">Product not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" asChild className="mb-8 hover:bg-white">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-0">
                 <div className="aspect-video w-full bg-white relative group flex items-center justify-center p-4">
                    <img 
                      src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/800/600`} 
                      className="w-full h-full object-contain" 
                      alt="" 
                    />
                    <div className="absolute top-6 left-6 flex gap-2">
                       <Badge className="bg-white/90 text-primary border-none px-3 py-1 text-xs font-bold shadow-sm">
                          {product.category?.name}
                       </Badge>
                       <Badge className="bg-slate-900/90 text-white border-none px-3 py-1 text-xs font-bold shadow-sm capitalize">
                          {product.condition.replace('_', ' ')}
                       </Badge>
                    </div>
                 </div>
                 <div className="p-10">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h1 className="text-3xl font-black text-slate-900 mb-2">{product.title}</h1>
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <Clock className="w-4 h-4" /> Posted on {new Date(product.created_at).toLocaleDateString()}
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">Listing Price</p>
                          <p className="text-4xl font-black text-primary">KES {product.price.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
                          <p className="text-slate-600 leading-relaxed">{product.description || 'No description provided.'}</p>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-50 rounded-2xl">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Negotiability</p>
                             <p className="font-bold text-slate-900">{product.is_negotiable ? 'Open to offers' : 'Fixed Price'}</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                             <p className="font-bold text-slate-900">{product.location}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="p-10 pb-0">
                 <CardTitle className="text-xl font-black">Image Gallery</CardTitle>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-3 gap-4">
                 {(product.images || []).map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-white border-2 border-slate-100 hover:border-primary transition-all cursor-zoom-in flex items-center justify-center p-2">
                       <img src={img} className="w-full h-full object-contain" alt="" />
                    </div>
                 ))}
                 {(!product.images || product.images.length === 0) && (
                    <div className="col-span-3 py-10 text-center text-slate-400 bg-slate-50 rounded-2xl italic">
                       No additional images provided
                    </div>
                 )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-8">
            {/* Seller Info */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
               <CardHeader className="p-8">
                 <CardTitle className="text-xl font-black">Seller Profile</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-16 h-16 rounded-2xl bg-secondary text-white flex items-center justify-center text-xl font-black border-4 border-slate-50">
                        {product.seller?.full_name?.charAt(0) || '?'}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-900">{product.seller?.full_name}</h4>
                        <p className="text-xs text-slate-500">{(product.seller as any)?.department || 'Kibabii Student'}</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Total Listings</span>
                        <span className="font-bold text-slate-900">4</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Join Date</span>
                        <span className="font-bold text-slate-900">May 2024</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Seller Rating</span>
                        <span className="font-bold text-amber-500">4.8 / 5.0</span>
                     </div>
                  </div>
                  <Button variant="outline" className="w-full mt-6 rounded-xl font-bold gap-2">
                     View Seller History <ExternalLink className="w-4 h-4" />
                  </Button>
               </CardContent>
            </Card>

            {/* Verification Actions */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-slate-900 text-white">
               <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-xl font-black flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-primary" /> Verification
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                     <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Guidelines</Label>
                     <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> Images must be clear</li>
                        <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> No prohibited items</li>
                        <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> Price must be realistic</li>
                     </ul>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest text-slate-400">Rejection Reason (if any)</Label>
                     <Input 
                       id="reason" 
                       placeholder="Explain why the listing was rejected..." 
                       className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-12 rounded-xl"
                       value={rejectionReason}
                       onChange={(e) => setRejectionReason(e.target.value)}
                     />
                  </div>

                  <div className="flex gap-3 pt-4">
                     <Button 
                       className="flex-1 bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
                       onClick={() => handleAction('approved')}
                       disabled={submitting}
                     >
                        {submitting ? 'Processing...' : 'Approve'}
                     </Button>
                     <Button 
                       variant="ghost" 
                       className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold h-12 rounded-xl"
                       onClick={() => handleAction('rejected')}
                       disabled={submitting}
                     >
                        {submitting ? '...' : 'Reject'}
                     </Button>
                  </div>
               </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
