import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUploader } from '@/components/dashboard/CreationComponents';
import { listingService, Listing } from '@/services/listingService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);

  // Editable Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [condition, setCondition] = useState('New');

  useEffect(() => {
    if (id) {
      const loadListing = async () => {
        try {
          let itemFound = false;
          try {
            const { data: item, error } = await supabase
              .from('listings')
              .select(`
                *,
                products(price, condition_id),
                accommodations(price_per_month),
                services(starting_price),
                events(ticket_price)
              `)
              .eq('id', id)
              .single();

            if (!error && item) {
              const mappedItem: any = {
                ...item,
                product_price: item.products?.[0]?.price,
                product_condition: item.products?.[0]?.condition_id,
                accommodation_rent: item.accommodations?.[0]?.price_per_month,
                service_starting_price: item.services?.[0]?.starting_price,
                event_ticket_price: item.events?.[0]?.ticket_price
              };
              setListing(mappedItem);
              setTitle(item.title);
              setDescription(item.description);
              setPrice(String(mappedItem.product_price || mappedItem.accommodation_rent || mappedItem.service_starting_price || mappedItem.event_ticket_price || ''));
              setLocation(item.location || '');
              setImages(item.images || []);
              setCondition(mappedItem.product_condition || 'New');
              itemFound = true;
            }
          } catch (sbErr) {
            console.warn('Failed to load edit listing from Supabase:', sbErr);
          }

          if (!itemFound) {
            // Check local fallback
            try {
              const localListings = listingService.getLocalListings();
              const found: any = localListings.find((l: any) => l.id === id || l.product_id === id);
              if (found) {
                setListing(found);
                setTitle(found.title);
                setDescription(found.description);
                setPrice(String(found.price || found.product_details?.price || ''));
                setLocation(found.location || '');
                setImages(found.images || []);
                setCondition(found.condition || 'New');
                itemFound = true;
              }
            } catch {}
          }

          if (!itemFound) {
            toast.error('Listing not found or access denied');
            navigate('/dashboard/listings');
          }
        } catch (err) {
          console.error('Error loading listing:', err);
          toast.error('Listing not found or access denied');
          navigate('/dashboard/listings');
        } finally {
          setLoading(false);
        }
      };
      loadListing();
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!title.trim() || title.length < 5) return toast.error('Title must be at least 5 characters');
    if (!description.trim() || description.length < 15) return toast.error('Description must be at least 15 characters');
    if (images.length === 0) return toast.error('Please attach at least 1 image URL');

    setSaving(true);
    const numericPrice = parseFloat(price) || 0;
    try {
      // 1. Update master listing row
      const { error: masterErr } = await supabase
        .from('listings')
        .update({
          title,
          description,
          location,
          images,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (masterErr) throw masterErr;

      // 2. Update type-specific table
      if (listing?.listing_type === 'product') {
        await supabase
          .from('products')
          .update({
            price: numericPrice,
            condition
          })
          .eq('id', id);
      } else if (listing?.listing_type === 'accommodation') {
        await supabase
          .from('accommodations')
          .update({
            price: numericPrice
          })
          .eq('listing_id', id);
      } else if (listing?.listing_type === 'service') {
        await supabase
          .from('services')
          .update({
            starting_price: numericPrice
          })
          .eq('listing_id', id);
      } else if (listing?.listing_type === 'event') {
        await supabase
          .from('events')
          .update({
            ticket_price: numericPrice
          })
          .eq('listing_id', id);
      }

      toast.success('🎉 Listing details updated successfully!');
      navigate('/dashboard/listings');
    } catch (err) {
      console.error('Failed to update listing:', err);
      toast.error('Failed to update listing. Please verify your fields.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 text-slate-450 animate-spin" />
        <p className="text-xs uppercase font-black text-slate-400">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-left">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-0 min-h-[5rem] sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0 border border-slate-100 bg-white">
              <Link to="/dashboard/listings">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="font-black text-lg sm:text-xl text-slate-900 truncate">Edit Campus Listing</h1>
              <p className="text-[10px] text-primary uppercase font-black tracking-widest truncate">
                 Updating record ID: {id}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 justify-end w-full sm:w-auto">
            <Button variant="outline" asChild className="rounded-xl font-bold h-10 sm:h-11 border-slate-200 text-xs sm:text-sm flex-1 sm:flex-initial text-center justify-center">
               <Link to="/dashboard/listings">Cancel</Link>
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-primary text-white font-extrabold h-10 sm:h-11 px-5 sm:px-6 rounded-xl text-xs sm:text-sm flex-1 sm:flex-initial">
               {saving ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 mt-8 max-w-2xl">
         <Card className="border shadow-sm rounded-[32px] overflow-hidden bg-white p-2">
            <CardHeader className="p-6 sm:p-8">
               <CardTitle className="text-xl font-black">Configure Details</CardTitle>
               <CardDescription>Edit core attributes representing your listing package parameters.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listing Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cambridge Study Book"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pricing base rate (KES)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 500"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Area Spot Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Gate B stall"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              {listing?.listing_type === 'product' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Product quality</Label>
                  <select 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                     <option value="New">New</option>
                     <option value="Like New">Like New</option>
                     <option value="Used">Used</option>
                     <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description specs</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border rounded-2xl p-4 text-xs resize-none bg-slate-50/10 focus-visible:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2 border-t pt-5">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Upload Details Media</Label>
                <ImageUploader images={images} onChange={setImages} />
              </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
