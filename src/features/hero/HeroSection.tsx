import { ArrowRight } from 'lucide-react';
import { FloatingFoodHero, type FloatingImageProps } from '@/components/ui';
import { formatWholeCurrency } from '@/lib/formatters';
import type {
  AppSection,
  RestaurantInfo,
  RestaurantSettings,
  TableSummary,
} from '@/types/restaurant';

interface HeroSectionProps {
  restaurant: RestaurantInfo;
  settings: RestaurantSettings;
  tableSummary: TableSummary | null;
  onNavigate: (section: AppSection) => void;
}

const HERO_FLOATING_IMAGES: FloatingImageProps[] = [
  {
    src: '/assets/aistudio/view-delicious-food-sold-streets_614bf49c.png',
    alt: 'Crispy golden Zinger Burger served with seasoned fries',
    className:
      'w-24 h-18 sm:w-36 sm:h-24 md:w-40 md:h-28 lg:w-44 lg:h-30 xl:w-56 xl:h-40 top-4 left-3 sm:top-6 sm:left-5 md:top-7 md:left-7 lg:top-8 lg:left-8 xl:top-10 xl:left-10 rounded-2xl sm:rounded-3xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_22px_44px_-16px_rgba(30,21,18,0.42)] animate-float',
  },
  {
    src: '/assets/aistudio/images_6cc74a94.png',
    alt: 'Artisanal stone-baked Chicken Pizza topped with olives and fresh basil',
    className:
      'w-24 h-18 sm:w-36 sm:h-24 md:w-40 md:h-28 lg:w-44 lg:h-30 xl:w-56 xl:h-40 top-4 right-3 sm:top-6 sm:right-5 md:top-7 md:right-7 lg:top-8 lg:right-8 xl:top-10 xl:right-10 rounded-2xl sm:rounded-3xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_22px_44px_-16px_rgba(30,21,18,0.42)] animate-float',
  },
  {
    src: '/assets/aistudio/plate-food-with-noodles-meat-veg_8ecb98be.png',
    alt: 'Aromatic spiced Chicken Biryani served with cool raita and chutney',
    className:
      'w-24 h-18 sm:w-36 sm:h-24 md:w-40 md:h-28 lg:w-44 lg:h-30 xl:w-56 xl:h-40 bottom-4 left-3 sm:bottom-6 sm:left-5 md:bottom-7 md:left-7 lg:bottom-8 lg:left-8 xl:bottom-10 xl:left-10 rounded-2xl sm:rounded-3xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_22px_44px_-16px_rgba(30,21,18,0.42)] animate-float',
  },
  {
    src: '/assets/aistudio/lemon-orange-strawberry-juice-bl_5c0d976a.png',
    alt: 'Freshly pressed citrus, strawberry, and pineapple craft beverages',
    className:
      'w-24 h-18 sm:w-36 sm:h-24 md:w-40 md:h-28 lg:w-44 lg:h-30 xl:w-56 xl:h-40 bottom-4 right-3 sm:bottom-6 sm:right-5 md:bottom-7 md:right-7 lg:bottom-8 lg:right-8 xl:bottom-10 xl:right-10 rounded-2xl sm:rounded-3xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_22px_44px_-16px_rgba(30,21,18,0.42)] animate-float',
  },
];

export function HeroSection({
  restaurant,
  settings,
  tableSummary,
  onNavigate,
}: HeroSectionProps) {
  return (
    <section id="home" className="bg-[#EFE1DA] border-b border-[#C6A36A]/55">
      <FloatingFoodHero
        kicker="Plot 18-C, Khayaban-e-Shahbaz · Phase 6, DHA"
        backgroundImageSrc="/assets/aistudio/images__1__1cd3772a.png"
        backgroundImageAlt="Table & Tale chandelier dining room with blush pink and ivory upholstered seating"
        title={
          <>
            Where Fine Dining Meets{' '}
            <span className="italic font-semibold text-[#7D591D]">Unforgettable Stories.</span>
          </>
        }
        description={`Welcome to ${restaurant.name}. Reserve an intimate dining table for up to ${settings.tableCapacity} guests per table, curate dishes from our 20-item kitchen menu, or arrange direct doorstep delivery.`}
        images={HERO_FLOATING_IMAGES}
      >
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-3.5">
          <button
            type="button"
            onClick={() => onNavigate('menu')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/75 text-sm font-semibold tracking-[0.01em] hover:bg-[#2E211C] hover:border-[#DFBD7E] shadow-[0_10px_24px_-10px_rgba(30,21,18,0.5)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A]"
          >
            Explore Menu &amp; Order
            <ArrowRight className="w-4 h-4 text-[#DFBD7E]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reservations')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-[#C6A36A]/80 bg-[#FAF1EB] text-[#1E1512] text-sm font-semibold tracking-[0.01em] hover:border-[#B58E4C] hover:bg-[#EED8D3]/80 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A]"
          >
            Reserve a Table
          </button>
        </div>
      </FloatingFoodHero>

      {/* Full-width 4-column hospitality ledger strip below hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14 lg:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover">
            <p className="section-kicker">Opening Hours</p>
            <p className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#1E1512] tabular-nums">
              {restaurant.hours}
            </p>
            <p className="mt-1 text-xs font-medium text-[#3D2E28]">Dinner &amp; midnight service</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover">
            <p className="section-kicker">Live Floor Seating</p>
            <p className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#1E1512] tabular-nums">
              {tableSummary
                ? `${tableSummary.availableTables} of ${tableSummary.totalTables} Tables Free`
                : `${settings.numTables} Dining Tables`}
            </p>
            <p className="mt-1 text-xs font-medium text-[#3D2E28] tabular-nums">
              {settings.tableCapacity} guests per table ·{' '}
              {tableSummary
                ? tableSummary.availableSeats
                : settings.numTables * settings.tableCapacity}{' '}
              seats open
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover">
            <p className="section-kicker">Dining Privileges</p>
            <p className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#1E1512] tabular-nums">
              {Math.round(settings.discountRate * 100)}% Off {formatWholeCurrency(settings.discountLimit)}+
            </p>
            <p className="mt-1 text-xs font-medium text-[#3D2E28] tabular-nums">
              {Math.round(settings.taxRate * 100)}% tax applied after discount
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover">
            <p className="section-kicker">Direct Inquiries</p>
            <p className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#1E1512] tabular-nums">
              {restaurant.contact}
            </p>
            <p className="mt-1 text-xs font-medium text-[#3D2E28] tabular-nums">
              Online delivery fee {formatWholeCurrency(settings.deliveryFee)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
