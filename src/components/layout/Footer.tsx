import { ArrowUpRight, CheckCircle2, Clock, MapPin, MessageSquareHeart, Phone, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { submitGuestFeedback } from '@/api/client';
import { BrandMark } from '@/components/common';
import type { AppSection, GuestFeedback, RestaurantInfo } from '@/types/restaurant';

interface FooterProps {
  restaurant: RestaurantInfo;
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  defaultCustomerName?: string;
}

const FOOTER_NAV: Array<{ id: AppSection; label: string; path: string }> = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'menu', label: 'Menu & Order', path: '/menu' },
  { id: 'reservations', label: 'Reservations', path: '/reservations' },
  { id: 'order', label: 'Order & Checkout', path: '/order' },
  { id: 'management', label: 'Management Panel', path: '/management' },
];

const SERVICE_CATEGORIES = [
  'Food Quality',
  'Hospitality & Staff',
  'Ambiance & Seating',
  'Dine-in',
  'Takeaway',
  'Online Delivery',
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Care',
  2: 'Fair Experience',
  3: 'Pleasant Visit',
  4: 'Memorable Evening',
  5: 'Exceptional Tale',
};

export function Footer({
  restaurant,
  activeSection,
  onNavigate,
  defaultCustomerName = '',
}: FooterProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [guestName, setGuestName] = useState(defaultCustomerName);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Food Quality']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedEntry, setSavedEntry] = useState<GuestFeedback | null>(null);

  const openModal = () => {
    setGuestName((prev) => prev || defaultCustomerName);
    setErrorMsg(null);
    setSavedEntry(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, submitting]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter your name so our hospitality team knows who visited.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Please choose at least one service category.');
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Please add a few words about your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await submitGuestFeedback({
        customerName: guestName.trim(),
        rating,
        categories: selectedCategories,
        comment: comment.trim(),
      });
      setSavedEntry(resp.feedback);
      setComment('');
    } catch (err) {
      setErrorMsg((err as Error).message || 'Could not save feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarPreview = hoverRating || rating;

  return (
    <>
      <footer className="no-print bg-[#F3DFDC] border-t border-[#C6A36A]/65 text-[#1E1512]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pb-16 lg:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-9 lg:gap-12">
            {/* Column 1: Brand Identity & Feedback CTA */}
            <div className="md:col-span-7 lg:col-span-5 space-y-5">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('home');
                }}
                className="inline-flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A36A]"
              >
                <BrandMark className="w-10 h-10 shrink-0 transition-transform duration-200 group-hover:scale-[1.04]" />
                <span className="font-display text-[1.85rem] font-bold tracking-[-0.02em] text-[#1E1512]">
                  {restaurant.name}
                </span>
              </a>

              <p className="font-display italic font-medium text-lg text-[#362823] leading-snug max-w-md">
                {restaurant.tagline}
              </p>

              <p className="text-sm font-medium text-[#362823] leading-relaxed max-w-md">
                Every evening at Table &amp; Tale is shaped by our guests. Rate your visit and
                leave notes directly for our kitchen and floor team.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={openModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs sm:text-sm font-semibold tracking-[0.02em] border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] shadow-[0_8px_20px_-10px_rgba(30,21,18,0.45)] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A]"
                >
                  <MessageSquareHeart className="w-4 h-4 text-[#DFBD7E]" />
                  <span>Leave Guest Feedback</span>
                </button>

                <a
                  href="/reservations"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('reservations');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-[#FAF1EB] text-[#1E1512] text-xs sm:text-sm font-semibold border border-[#C6A36A]/75 hover:bg-[#EFE1DA] hover:border-[#B58E4C] transition-colors cursor-pointer"
                >
                  <span>Reserve a Table</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#7D591D]" />
                </a>
              </div>
            </div>

            {/* Column 2: Editorial House Navigation */}
            <div className="md:col-span-5 lg:col-span-3 space-y-4">
              <p className="section-kicker">House Navigation</p>
              <nav aria-label="Footer Navigation" className="flex flex-col items-start gap-2">
                {FOOTER_NAV.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.id);
                      }}
                      className={`group inline-flex items-center gap-2.5 py-1 text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A] ${
                        isActive
                          ? 'font-bold text-[#1E1512]'
                          : 'font-medium text-[#362823] hover:text-[#1E1512]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          isActive
                            ? 'bg-[#B58E4C] ring-2 ring-[#C6A36A]/35'
                            : 'bg-[#C6A36A]/65 group-hover:bg-[#7D591D]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Column 3: Location & Service Ledger */}
            <div className="md:col-span-12 lg:col-span-4 space-y-4">
              <p className="section-kicker">Visit &amp; Reservations Desk</p>
              <div className="rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 divide-y md:divide-y-0 md:divide-x lg:divide-x-0 lg:divide-y divide-[#C6A36A]/30 surface-card">
                <div className="p-4 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#7D591D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D591D]">
                      Dining Room
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[#1E1512]">{restaurant.address}</p>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#7D591D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D591D]">
                      Service Hours
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-[#1E1512]">
                      Open Daily · {restaurant.hours}
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#7D591D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D591D]">
                      Direct Line
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-[#1E1512]">
                      {restaurant.contact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Editorial Sub-Bar */}
          <div className="mt-10 pt-6 border-t border-[#C6A36A]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#362823]">
            <p className="font-display italic font-medium text-sm text-[#1E1512]">
              &ldquo;{restaurant.receiptClosing}&rdquo;
            </p>
            <p className="font-mono text-xs font-semibold tabular-nums text-[#3D2E28] shrink-0">
              {restaurant.name} · 10 Tables · Up to 6 Guests / Table
            </p>
          </div>
        </div>
      </footer>

      {/* Customer Feedback Modal */}
      {modalOpen && (
        <div
          className="no-print fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4 bg-[#1E1512]/55 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            className="my-auto w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-[#FAF1EB] border border-[#C6A36A] ring-2 ring-[#C6A36A]/35 shadow-[0_28px_70px_-20px_rgba(30,21,18,0.5)]"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#F3DFDC]/95 backdrop-blur-xs border-b border-[#C6A36A]/45 px-5 sm:px-8 py-4 sm:py-5 flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Guest Hospitality Ledger</p>
                <h2
                  id="feedback-modal-title"
                  className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#1E1512]"
                >
                  Rate Your Experience
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close feedback modal"
                className="w-9 h-9 rounded-full bg-[#FAF1EB] border border-[#C6A36A]/65 text-[#1E1512] hover:bg-[#EFE1DA] hover:border-[#B58E4C] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedEntry ? (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#EFE1DA] border border-[#C6A36A] ring-1 ring-[#C6A36A]/30">
                  <CheckCircle2 className="w-6 h-6 text-[#7D591D] shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h3 className="font-display text-2xl font-bold text-[#1E1512]">
                      Thank You, {savedEntry.customerName}
                    </h3>
                    <p className="text-sm font-medium text-[#362823]">
                      Your feedback has been saved to the Table &amp; Tale management ledger.
                    </p>
                    <p className="pt-1 font-mono text-xs font-bold text-[#7D591D] tabular-nums">
                      Rating: {savedEntry.rating}/5 · {savedEntry.categories.join(' · ')}
                    </p>
                    <p className="text-sm italic font-medium text-[#1E1512] pt-1">
                      &ldquo;{savedEntry.comment}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSavedEntry(null)}
                    className="px-5 py-2.5 rounded-full border border-[#C6A36A]/75 bg-[#EFE1DA] text-xs font-semibold text-[#1E1512] hover:bg-[#EED8D3] hover:border-[#B58E4C] cursor-pointer"
                  >
                    Write Another Review
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="p-5 sm:p-8 space-y-5">
                {/* Guest Name */}
                <div>
                  <label
                    htmlFor="footer-feedback-name"
                    className="block text-xs font-bold text-[#1E1512] mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="footer-feedback-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g., Hira Mansoor"
                    className="w-full h-11 px-4 rounded-xl bg-[#EFE1DA]/75 border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                  />
                </div>

                {/* Experience Star Rating */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[#1E1512]">
                      Overall Experience Rating
                    </span>
                    <span className="font-mono text-xs font-bold text-[#7D591D] tabular-nums">
                      {activeStarPreview}/5 · {RATING_LABELS[activeStarPreview]}
                    </span>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="Star rating from 1 to 5"
                    className="flex flex-wrap items-center gap-2"
                  >
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const active = starValue <= activeStarPreview;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          role="radio"
                          aria-checked={rating === starValue}
                          aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starValue)}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A] ${
                            active
                              ? 'bg-[#1E1512] border-[#C6A36A] text-[#DFBD7E] ring-1 ring-[#C6A36A]/45'
                              : 'bg-[#EFE1DA] border-[#C6A36A]/55 text-[#3D2E28] hover:border-[#B58E4C]'
                          }`}
                        >
                          <Star
                            className="w-5 h-5"
                            fill={active ? '#DFBD7E' : 'none'}
                            stroke={active ? '#DFBD7E' : '#7D591D'}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service Categories */}
                <div>
                  <p className="text-xs font-bold text-[#1E1512] mb-2">
                    Service Categories <span className="font-medium text-[#3D2E28]">(select all that apply)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map((category) => {
                      const selected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleCategory(category)}
                          className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#1E1512] text-[#FFF9F1] border-[#C6A36A]'
                              : 'bg-[#EFE1DA] text-[#1E1512] border-[#C6A36A]/60 hover:bg-[#EED8D3] hover:border-[#B58E4C]'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label
                    htmlFor="footer-feedback-comment"
                    className="block text-xs font-bold text-[#1E1512] mb-1.5"
                  >
                    Your Comments
                  </label>
                  <textarea
                    id="footer-feedback-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share highlights about the dishes, service, or ambiance..."
                    className="w-full p-3.5 rounded-xl bg-[#EFE1DA]/75 border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25 resize-y"
                  />
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-[#EED8D3] border border-[#C6A36A] text-xs font-semibold text-[#1E1512]"
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="pt-1 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#C6A36A]/65 bg-[#EFE1DA] text-xs font-semibold text-[#1E1512] hover:bg-[#EED8D3] hover:border-[#B58E4C] cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs sm:text-sm font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving Feedback...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
