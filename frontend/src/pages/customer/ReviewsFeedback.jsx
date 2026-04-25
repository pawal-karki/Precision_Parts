import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
          aria-label={`${s} star`}
        >
          <Icon
            name="star"
            filled
            className={`text-2xl transition-colors ${s <= (hovered || value) ? "text-amber-400" : "text-surface-container-highest dark:text-stone-700"}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, idx }) {
  return (
    <motion.div
      className="bg-surface-container-lowest dark:bg-stone-900 p-6 rounded-xl border border-surface-container dark:border-stone-800"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-primary font-bold shrink-0">
          {(review.reviewer || "U").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-on-surface dark:text-white truncate">{review.title}</h4>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon
                  key={s}
                  name="star"
                  filled
                  className={`text-sm ${s <= Math.round(review.rating) ? "text-amber-400" : "text-surface-container-highest dark:text-stone-700"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">{review.reviewer} · {review.date}</p>
        </div>
      </div>
      <p className="text-sm text-on-surface-variant italic leading-relaxed">{review.text}</p>
      <div className="flex items-center gap-1 mt-3 text-amber-400">
        <Icon name="star" filled className="text-sm" />
        <span className="text-xs font-bold text-on-surface dark:text-white">{review.rating?.toFixed(1)}</span>
      </div>
    </motion.div>
  );
}

export default function ReviewsFeedback() {
  const toast = useToast();
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await api.getReviews();
      if (Array.isArray(res) && res.length > 0) {
        setReviews(res.map(r => ({
          id: r.id,
          title: r.appointmentId
            ? `Service #${String(r.appointmentId).substring(0, 6).toUpperCase()}`
            : "General Feedback",
          date: new Date(r.createdAtUtc).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" }),
          rating: r.rating,
          text: `"${r.comment}"`,
          reviewer: "You",
        })));
      } else {
        // Show placeholder reviews if API returns empty
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast("Please provide your detailed feedback", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({ rating, comment: feedback.trim() });
      toast("Review posted successfully! Thank you for your feedback.", "success");
      setFeedback("");
      setRating(4);
      await loadReviews();
    } catch {
      toast("Failed to post review. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header
          className="flex flex-col gap-2 max-w-2xl"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter font-headline text-on-surface dark:text-white">
            Experience Review
          </h1>
          <p className="text-on-surface-variant dark:text-stone-400 leading-relaxed">
            Help us maintain the standard of excellence. Share your feedback on recent services and orders.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stats + Submit Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rating Stats */}
            <motion.div
              className="bg-surface-container-lowest dark:bg-stone-900 rounded-xl p-6 border border-surface-container dark:border-stone-800"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-extrabold font-headline text-on-surface dark:text-white">{avgRating}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon
                        key={s}
                        name="star"
                        filled
                        className={`text-sm ${avgRating !== "—" && s <= Math.round(parseFloat(avgRating)) ? "text-amber-400" : "text-surface-container-highest"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(r => Math.round(r.rating) === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-on-surface-variant w-4">{star}</span>
                        <div className="flex-1 h-1.5 bg-surface-container dark:bg-stone-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-on-surface-variant w-4">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Submit Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest dark:bg-stone-900 rounded-xl p-6 border border-surface-container dark:border-stone-800 space-y-5"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">Write a Review</h2>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Your Rating</label>
                <StarInput value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  Your Feedback <span className="text-error">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe your experience with the service or product quality..."
                  className="w-full bg-surface-container-low dark:bg-stone-800 border border-outline-variant/20 dark:border-stone-700 rounded-xl p-4 text-sm text-on-surface dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all resize-none placeholder:text-on-surface-variant/50"
                />
                <p className="text-[10px] text-on-surface-variant text-right mt-1">{feedback.length} characters</p>
              </div>

              <Button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="w-full bg-secondary text-on-primary"
              >
                {submitting ? (
                  <><Icon name="progress_activity" className="text-sm animate-spin" /> Posting…</>
                ) : (
                  <><Icon name="send" className="text-sm" /> Submit Review</>
                )}
              </Button>
            </motion.form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">
                {loading ? "Loading reviews…" : reviews.length === 0 ? "No Reviews Yet" : "Your Reviews"}
              </h2>
              {reviews.length > 0 && (
                <Button variant="outline" size="sm" onClick={loadReviews}>
                  <Icon name="refresh" className="text-sm" /> Refresh
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-secondary">
                <Icon name="progress_activity" className="text-4xl animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface-container-low dark:bg-stone-900 rounded-2xl border border-dashed border-outline-variant/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Icon name="rate_review" className="text-6xl mb-3" />
                <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-1">No Reviews Yet</h3>
                <p className="text-sm text-center max-w-xs">
                  Be the first to share your experience with our precision services!
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((review, idx) => (
                  <ReviewCard key={review.id || idx} review={review} idx={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}