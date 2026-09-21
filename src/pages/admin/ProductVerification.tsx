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
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (error) {
        toast.error('Failed to load product details');
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
      
      // Update product record status in database
      await productService.updateProduct(id, {
        status: status === 'approved' ? 'active' : 'rejected'
      } as any);

      // Also trigger unified listing approval/rejection RPC if a corresponding listing exists
      try {
        const { data: listingData } = await supabase
          .from('listings')
          .select('id')
          .eq('product_id', id)
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

      toast.success(`Product ${status} successfully`);
      navigate('/admin');
    } catch (error: any) {
      console.error('Failed to update product status:', error);
      toast.error(error?.message || 'Failed to update product status');
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
