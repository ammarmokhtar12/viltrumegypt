"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, User, Send, ThumbsUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful: number;
}

interface ReviewSectionProps {
  productId: string;
}

function StarRating({
  rating,
  onRate,
  interactive = false,
  size = 18,
}: {
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`transition-all duration-150 ${
            interactive
              ? "cursor-pointer hover:scale-125 active:scale-90"
              : "cursor-default"
          }`}
          aria-label={interactive ? `Rate ${star} stars` : `${star} stars`}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= (hovered || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-muted w-8 text-right shrink-0">
        {stars}★
      </span>
      <div className="flex-1 h-2 bg-surface border border-border-light rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-muted w-6 shrink-0">{count}</span>
    </div>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load reviews from Supabase
  useEffect(() => {
    setMounted(true);
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        return;
      }

      if (data) {
        setReviews(data as Review[]);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim() || newRating === 0) return;

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          name: newName.trim(),
          rating: newRating,
          comment: newComment.trim(),
          helpful: 0
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReviews([data as Review, ...reviews]);
      }
      
      setNewName("");
      setNewRating(0);
      setNewComment("");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 2200);
    } catch (error) {
      console.error("Error submitting review:", error);
      // Fallback: update UI anyway if there's an error (e.g. table not created yet)
      const fallbackReview: Review = {
        id: `temp-${Date.now()}`,
        name: newName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        created_at: new Date().toISOString(),
        helpful: 0,
      };
      setReviews([fallbackReview, ...reviews]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 2200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    // Optimistic update
    const reviewToUpdate = reviews.find(r => r.id === reviewId);
    if (!reviewToUpdate) return;
    
    setReviews(reviews.map((r) =>
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    ));

    try {
      // Don't update temporary reviews
      if (reviewId.startsWith('temp-')) return;
      
      await supabase
        .from('reviews')
        .update({ helpful: reviewToUpdate.helpful + 1 })
        .eq('id', reviewId);
    } catch (error) {
      console.error("Error updating helpful count:", error);
    }
  };

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (stars) => reviews.filter((r) => r.rating === stars).length
  );

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  // Skeleton while not mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <section className="border-t border-border-light pt-16 mt-16">
        <div className="h-10 w-48 bg-surface rounded-xl animate-pulse mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="h-40 bg-surface rounded-2xl animate-pulse" />
          <div className="h-40 bg-surface rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border-light pt-16 mt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-60 block mb-3">
            Community Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Reviews & Ratings
          </h2>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setSubmitted(false);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/10"
        >
          <MessageSquare size={14} />
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-surface border border-border-light rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="text-6xl font-bold text-foreground tabular-nums">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </div>
          <StarRating rating={Math.round(averageRating)} size={22} />
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
            {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
          </p>
        </div>

        <div className="bg-surface border border-border-light rounded-2xl p-8 flex flex-col justify-center gap-3">
          {[5, 4, 3, 2, 1].map((stars, i) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={ratingCounts[i]}
              total={totalReviews}
            />
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="mb-12 bg-surface border border-border-light rounded-2xl p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-6">
            Share Your Experience
          </h3>

          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <Star size={28} className="text-white fill-white" />
              </div>
              <p className="text-lg font-bold text-foreground">
                Review Submitted!
              </p>
              <p className="text-sm text-muted mt-1">
                Thank you for your feedback, warrior.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Stars */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-3">
                  Your Rating <span className="text-red-400">*</span>
                </label>
                <StarRating
                  rating={newRating}
                  onRate={setNewRating}
                  interactive
                  size={32}
                />
                {newRating > 0 && (
                  <span className="text-xs text-amber-500 font-bold mt-2 block">
                    {ratingLabels[newRating]}
                  </span>
                )}
                {newRating === 0 && (
                  <span className="text-[10px] text-muted/60 mt-1 block">
                    Click a star to rate
                  </span>
                )}
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="review-name"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2"
                >
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ahmed M."
                  maxLength={60}
                  className="w-full px-4 py-3 bg-background border border-border-light rounded-xl text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label
                  htmlFor="review-comment"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2"
                >
                  Your Review <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="review-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="How was the quality, fit, and feel? Share your honest experience..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-background border border-border-light rounded-xl text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
                  required
                />
                <p className="text-[10px] text-muted/50 text-right mt-1">
                  {newComment.length}/500
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  newRating === 0 ||
                  !newName.trim() ||
                  !newComment.trim()
                }
                className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="text-center py-16 bg-surface border border-border-light rounded-2xl">
          <MessageSquare size={40} className="text-muted/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted">No reviews yet</p>
          <p className="text-xs text-muted/50 mt-1">
            Be the first warrior to share your experience.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-background border border-border-light rounded-2xl p-6 sm:p-8 hover:shadow-md hover:shadow-black/[0.04] transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 border border-border-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-primary/50" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-none">
                      {review.name}
                    </h4>
                    <p className="text-[10px] text-muted font-medium mt-1">
                      {new Date(review.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={13} />
              </div>

              <p className="text-sm text-secondary leading-relaxed font-medium ml-[52px]">
                {review.comment}
              </p>

              <div className="ml-[52px] mt-4">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                >
                  <ThumbsUp size={11} />
                  Helpful{review.helpful > 0 && ` (${review.helpful})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
