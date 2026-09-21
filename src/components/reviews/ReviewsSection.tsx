import { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Clock, 
  ShoppingBag, 
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { reviewService, ReviewRow } from '@/services/reviewService';

interface ReviewsSectionProps {
  targetType: 'product' | 'service' | 'accommodation' | 'store';
  targetId: string;
  targetTitle?: string;
  // Precomputed ratings directly from target table (e.g. products.rating_avg, stores.rating_avg)
  targetRatingAvg?: number | null;
  targetRatingCount?: number | null;
  // Seller reputation directly from profiles.seller_rating / profiles.seller_rating_count
  sellerId?: string | null;
  sellerName?: string | null;
  onReviewUpdated?: () => void;
}

export default function ReviewsSection({
  targetType,
  targetId,
  targetTitle,
  targetRatingAvg = 0,
  targetRatingCount = 0,
  sellerId,
  sellerName,
  onReviewUpdated
}: ReviewsSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<ReviewRow | null>(null);
  const [sellerReputation, setSellerReputation] = useState<{ seller_rating: number; seller_rating_count: number }>({
    seller_rating: 0,
    seller_rating_count: 0
  });

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [formComment, setFormComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [deliveredOrder, setDeliveredOrder] = useState<{ order_id: string; created_at: string } | null>(null);

  // Load reviews and user review state
  const loadReviewsData = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [list, sellerRep] = await Promise.all([
        reviewService.getReviewsForTarget(targetType, targetId),
        sellerId ? reviewService.getSellerReputation(sellerId) : Promise.resolve({ seller_rating: 0, seller_rating_count: 0 })
      ]);

      setReviews(list);
      setSellerReputation(sellerRep);

      if (user?.id) {
        const existing = list.find(r => r.reviewer_id === user.id) || null;
        setUserReview(existing);

        // For products, check if buyer has a delivered order for verified purchase badge
        if (targetType === 'product') {
          const ord = await reviewService.getDeliveredOrderForProduct(user.id, targetId);
          setDeliveredOrder(ord);
        }
      } else {
        setUserReview(null);
        setDeliveredOrder(null);
      }
    } catch (err) {
      console.error('Error loading reviews data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, user?.id, sellerId]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  // Open create form
  const handleOpenCreate = () => {
    if (!user) {
      toast.info('Please sign in to rate and review this item.');
      return;
    }
    if (userReview) {
      handleOpenEdit(userReview);
      return;
    }
    setEditingReviewId(null);
    setEditingCreatedAt(null);
    setFormRating(5);
    setHoverRating(0);
    setFormComment('');
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (rev: ReviewRow) => {
    const isOwner = user?.id === rev.reviewer_id;
    if (!isOwner) return;

    // Check 48h limit
    const reviewDate = new Date(rev.created_at).getTime();
    const hoursPassed = (Date.now() - reviewDate) / (1000 * 60 * 60);
    if (hoursPassed > 48) {
      toast.error('Reviews can only be edited within 48 hours of posting.');
      return;
    }

    setEditingReviewId(rev.id);
    setEditingCreatedAt(rev.created_at);
    setFormRating(rev.rating || 5);
    setHoverRating(0);
    setFormComment(rev.comment || '');
    setIsFormOpen(true);
  };

  // Submit review (insert or update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in.');
      return;
    }

    if (formRating < 1 || formRating > 5) {
      toast.error('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        // Update review
        const result = await reviewService.updateReview(
          editingReviewId,
          formRating,
          formComment,
          editingCreatedAt || undefined
        );

        if (!result.success) {
          toast.error(result.error || 'Failed to update review.');
          return;
        }

        toast.success('Your review has been updated!');
        setIsFormOpen(false);
        await loadReviewsData();
        if (onReviewUpdated) onReviewUpdated();
      } else {
        // Insert review
        const result = await reviewService.submitReview({
          reviewer_id: user.id,
          target_type: targetType,
          target_id: targetId,
          rating: formRating,
          comment: formComment,
          order_id: deliveredOrder?.order_id || null
        });

        if (!result.success) {
          if (result.isDuplicate) {
            toast.info(result.error || "You have already reviewed this item. You can edit your existing review.");
            setIsFormOpen(false);
            await loadReviewsData();
            return;
          }
          toast.error(result.error || 'Failed to submit review.');
          return;
        }

        // Check if verified purchase was assigned by server
        if (result.data?.is_verified_purchase) {
          toast.success('Review posted with Verified Purchase badge!');
        } else {
          toast.success('Thank you! Your review has been published.');
        }

        setIsFormOpen(false);
        await loadReviewsData();
        if (onReviewUpdated) onReviewUpdated();
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred while saving your review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (revId: string) => {
    if (!window.confirm('Are you sure you want to delete your review? This will also update the listing rating.')) {
      return;
    }

    try {
      const result = await reviewService.deleteReview(revId);
      if (result.success) {
        toast.success('Review deleted successfully.');
        await loadReviewsData();
        if (onReviewUpdated) onReviewUpdated();
      } else {
        toast.error(result.error || 'Failed to delete review.');
      }
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  // Precomputed values from target table
  const avgDisplay = targetRatingAvg ? Number(targetRatingAvg).toFixed(1) : '0.0';
  const countDisplay = targetRatingCount || reviews.length;

  return (
    <div id="reviews-section" className="space-y-6 pt-4 font-sans">
      {/* Header & Reputation Summary Cards */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Listing Target Rating Summary (Read directly from precomputed columns) */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>Customer Ratings & Reviews</span>
            </h3>
            
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{avgDisplay}</span>
              <div className="space-y-0.5">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(Number(targetRatingAvg || 0))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {countDisplay} {countDisplay === 1 ? 'review' : 'reviews'} for this {targetType}
                </p>
              </div>
            </div>
          </div>

          {/* Seller Reputation Combined Score (Section 3: profiles.seller_rating / profiles.seller_rating_count) */}
          {sellerId && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Seller Trust Reputation</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {sellerName || 'Seller'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-500 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                  <span>{sellerReputation.seller_rating > 0 ? sellerReputation.seller_rating.toFixed(1) : 'New Seller'}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {sellerReputation.seller_rating_count > 0 
                    ? `across ${sellerReputation.seller_rating_count} reviews` 
                    : 'combined across all listings'}
                </span>
              </div>
            </div>
          )}

          {/* Action Button: Rate & Review */}
          <div className="shrink-0 flex items-center">
            {userReview ? (
              <Button
                id="edit-my-review-btn"
                onClick={() => handleOpenEdit(userReview)}
                variant="outline"
                className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs h-10 px-4 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Your Review
              </Button>
            ) : (
              <Button
                id="write-review-btn"
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl h-10 px-5 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Star className="w-3.5 h-3.5" />
                Write a Review
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading verified community reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 px-4 border border-dashed border-slate-200 rounded-2xl text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No reviews yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first campus comrade to share honest feedback and rate this {targetType}.
          </p>
          {!userReview && (
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Leave First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isAuthor = user?.id === rev.reviewer_id;
            const reviewerName = rev.reviewer?.full_name || rev.reviewer?.username || 'Kibabii Comrade';
            const reviewerAvatar = rev.reviewer?.avatar_url || undefined;
            const isVerifiedComrade = rev.reviewer?.is_verified || rev.reviewer?.verification_status === 'verified';
            
            // 48-Hour edit window check
            const reviewDate = new Date(rev.created_at).getTime();
            const hoursSince = (Date.now() - reviewDate) / (1000 * 60 * 60);
            const canEdit = isAuthor && hoursSince <= 48;

            return (
              <div 
                key={rev.id} 
                id={`review-item-${rev.id}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isAuthor 
                    ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs' 
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={reviewerAvatar} />
                      <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xs">
                        {reviewerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{reviewerName}</span>
                        {isVerifiedComrade && (
                          <span title="Verified Student">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        )}
                        {isAuthor && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0 border-none">
                            You
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(rev.created_at).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        {rev.updated_at && rev.updated_at !== rev.created_at && (
                          <span className="text-[10px] text-slate-400 italic">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Badges */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Section 2: VERIFIED PURCHASE BADGE — FULLY SERVER-CONTROLLED */}
                    {/* ONLY shown for target_type === 'product' AND rev.is_verified_purchase === true */}
                    {rev.target_type === 'product' && rev.is_verified_purchase && (
                      <Badge 
                        id="verified-purchase-badge"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold py-0.5 px-2 inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Comment */}
                {rev.comment && (
                  <p className="text-sm text-slate-700 mt-3.5 leading-relaxed whitespace-pre-line pl-0 sm:pl-13">
                    {rev.comment}
                  </p>
                )}

                {/* Reviewer Actions (Owner within 48h) */}
                {isAuthor && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 pl-0 sm:pl-13">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {canEdit ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Editable for 48 hours
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Edit window closed (over 48h)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal / Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingReviewId ? 'Edit Your Review' : 'Rate & Review'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {targetTitle ? `For "${targetTitle}"` : `Share your honest experience on Kibabii Campus`}
                </p>
              </div>

              {/* Order verification indicator */}
              {targetType === 'product' && deliveredOrder && !editingReviewId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Delivered Order Found:</span> Your purchase of this product was verified on KibabiiMart. Submitting this review will award you the official <strong>Verified Purchase</strong> badge.
                  </div>
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="space-y-1.5 text-center py-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Overall Rating
                </label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || formRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            active
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {formRating === 5 && 'Outstanding / Excellent'}
                  {formRating === 4 && 'Very Good'}
                  {formRating === 3 && 'Average / Acceptable'}
                  {formRating === 2 && 'Below Average'}
                  {formRating === 1 && 'Poor experience'}
                </p>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Your Feedback (Optional)
                </label>
                <Textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Tell other students about the quality, accuracy, condition, and communication..."
                  className="min-h-[110px] rounded-xl text-sm border-slate-200 focus:border-primary resize-none"
                />
              </div>

              {/* Policy note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Reviews are editable for up to 48 hours following submission.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold text-slate-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl px-5 cursor-pointer shadow-sm"
                >
                  {submitting ? 'Saving...' : editingReviewId ? 'Update Review' : 'Post Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
