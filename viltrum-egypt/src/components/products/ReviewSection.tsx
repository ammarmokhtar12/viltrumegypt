"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, User, Send, ThumbsUp } from "lucide-react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

interface ReviewSectionProps {
  productId: string;
}

// Star Rating Component
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
          className={`transition-all duration-200 ${
            interactive
              ? "cursor-pointer hover:scale-125 active:scale-90"
              : "cursor-default"
          }`}
        >
          <Star
            size={size}
            className={`transition-colors duration-200 ${
              star <= (hovered || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Rating Distribution Bar
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
    <div className="flex items-center gap-3 group">
      <span className="text-[11px] font-bold text-muted w-8 text-right">
        {stars}★
      </span>
      <div className="flex-1 h-2 bg-surface border border-border-light rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-muted w-8">{count}</span>
    </div>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load reviews from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`viltrum-reviews-${productId}`);
    if (stored) {
      try {
        setReviews(JSON.parse(stored));
      } catch {
        setReviews([]);
      }
    }
  }, [productId]);

  // Save reviews to localStorage
  const saveReviews = (updatedReviews: Review[]) => {
    localStorage.setItem(
      `viltrum-reviews-${productId}`,
      JSON.stringify(updatedReviews)
    );
    setReviews(updatedReviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim() || newRating === 0) return;

    setSubmitting(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      const newReview: Review = {
        id: Date.now().toString(),
        name: newName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        helpful: 0,
      };

      const updated = [newReview, ...reviews];
      saveReviews(updated);

      setNewName("");
      setNewRating(0);
      setNewComment("");
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 2000);
    }, 800);
  };

  const handleHelpful = (reviewId: string) => {
    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    );
    saveReviews(updated);
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (stars) => reviews.filter((r) => r.rating === stars).length
  );

  return (
    <section className="border-t border-border-light pt-16 mt-16">
      {/* Section Header */}
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
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/10"
        >
          <MessageSquare size={14} />
          Write a Review
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Average Rating */}
        <div className="bg-surface border border-border-light rounded-2xl p-8 text-center">
          <div className="text-6xl font-bold text-foreground mb-2">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </div>
          <StarRating rating={Math.round(averageRating)} size={22} />
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-3">
            {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="bg-surface border border-border-light rounded-2xl p-8 flex flex-col justify-center gap-2.5">
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
        <div className="mb-12 bg-surface border border-border-light rounded-2xl p-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-6">
            Share Your Experience
          </h3>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
              {/* Rating Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-3">
                  Your Rating
                </label>
                <StarRating
                  rating={newRating}
                  onRate={setNewRating}
                  interactive
                  size={28}
                />
                {newRating > 0 && (
                  <span className="text-xs text-amber-500 font-bold mt-2 block">
                    {
                      [
                        "",
                        "Poor",
                        "Fair",
                        "Good",
                        "Very Good",
                        "Excellent",
                      ][newRating]
                    }
                  </span>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ahmed M."
                  className="w-full px-4 py-3 bg-background border border-border-light rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2">
                  Your Review
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tell us about your experience with this product..."
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border-light rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                  required
                />
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
          <MessageSquare
            size={40}
            className="text-muted/30 mx-auto mb-4"
          />
          <p className="text-sm font-bold text-muted">No reviews yet</p>
          <p className="text-xs text-muted/60 mt-1">
            Be the first to share your warrior experience.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-background border border-border-light rounded-2xl p-6 sm:p-8 transition-all hover:shadow-lg hover:shadow-black/[0.03] group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-primary/10 to-primary/5 border border-border-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-primary/60" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {review.name}
                    </h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">
                      {review.date}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>

              <p className="text-sm text-secondary leading-relaxed font-medium pl-[60px]">
                {review.comment}
              </p>

              {/* Helpful Button */}
              <div className="pl-[60px] mt-4">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                >
                  <ThumbsUp size={12} />
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
