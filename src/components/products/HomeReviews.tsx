"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  helpful: number;
  image_url?: string | null;
  product_id: string;
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const perPage = typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 3;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, rating, comment, helpful, product_id")
        .gte("rating", 4)
        .order("helpful", { ascending: false })
        .limit(30);
      if (!error && data) setReviews(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-surface rounded-xl animate-pulse mx-auto mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const totalPages = Math.ceil(reviews.length / perPage);
  const visible = reviews.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="py-20 px-4 border-t border-border-light">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent block mb-3">
            What Warriors Say
          </span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-foreground tracking-tight">
            Customer Reviews
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <span className="text-xs text-muted">
              ({reviews.length} reviews)
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {visible.map((review) => (
            <div
              key={review.id}
              className="group bg-surface border border-border-light rounded-2xl p-6 hover:border-accent/20 transition-all duration-300 relative overflow-hidden"
            >
              <Quote size={32} className="absolute top-4 right-4 text-border-light opacity-50" />

              {review.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border-light">
                  <img
                    src={review.image_url}
                    alt={`Review by ${review.name}`}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={13}
                    className={s <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-muted/30"
                    }
                  />
                ))}
              </div>

              <p className="text-sm text-secondary leading-relaxed mb-4 line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border-light">
                <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">
                    {review.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{review.name}</p>
                  {review.helpful > 0 && (
                    <p className="text-[10px] text-muted">
                      {review.helpful} found this helpful
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-10 h-10 rounded-xl border border-border-light bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === page ? "bg-accent w-6" : "bg-border-light hover:bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-10 h-10 rounded-xl border border-border-light bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
