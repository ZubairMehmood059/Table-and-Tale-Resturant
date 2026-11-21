import { Menu, ShoppingBag, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/common';
import type { AppSection } from '@/types/restaurant';

export type { AppSection };

interface HeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  cartCount: number;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'menu', label: 'Menu & Order' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'order', label: 'Checkout' },
  { id: 'management', label: 'Management' },
];

export function Header({ activeSection, onNavigate, cartCount }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 18);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSelect = (id: AppSection) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={`no-print sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-[#FAF1EB]/95 backdrop-blur-md border-b border-[#C6A36A]/65 shadow-[0_12px_32px_-18px_rgba(30,21,18,0.22)]'
          : 'bg-[#FAF1EB]/92 backdrop-blur-sm border-b border-[#C6A36A]/45'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2.5 md:gap-3 lg:gap-8">
        {/* Zone 1: Brand Crest + Single-Line Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleSelect('home');
          }}
          className="inline-flex items-center gap-2 sm:gap-2.5 lg:gap-3 whitespace-nowrap shrink-0 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A36A]"
        >
          <BrandMark className="w-8 h-8 md:w-8 md:h-8 lg:w-9 lg:h-9 shrink-0 transition-transform duration-200 group-hover:scale-[1.04]" />
          <span className="font-display text-[1.4rem] sm:text-[1.5rem] lg:text-[1.85rem] font-bold tracking-[-0.02em] text-[#1E1512] group-hover:text-[#7D591D] transition-colors duration-150">
            Table &amp; Tale
          </span>
        </a>

        {/* Zone 2: Floating Editorial Navigation Rail */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-0.5 lg:gap-1 px-1 lg:px-2 py-1 lg:py-1.5 rounded-full bg-[#EFE1DA]/85 border border-[#C6A36A]/55 shadow-[0_6px_18px_-12px_rgba(30,21,18,0.18)]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative px-2.5 lg:px-4 py-1.5 rounded-full text-xs lg:text-[13px] tracking-[0.01em] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A] ${
                  isActive
                    ? 'text-[#FFF9F1]'
                    : 'text-[#2D201B] hover:text-[#1E1512]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/65 shadow-[0_4px_12px_-4px_rgba(30,21,18,0.45)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Mobile Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => handleSelect('order')}
              aria-label={`View order with ${cartCount} items`}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/70 tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#DFBD7E]" />
              <span>{cartCount}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelect('order')}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 lg:gap-2 px-3.5 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-[13px] font-semibold tracking-[0.02em] rounded-full bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] shadow-[0_8px_20px_-10px_rgba(30,21,18,0.45)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A36A]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#DFBD7E]" />
            <span className="tabular-nums">
              {cartCount > 0 ? `Order (${cartCount})` : 'Start Order'}
            </span>
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#C6A36A]/65 bg-[#EFE1DA] text-[#1E1512] hover:bg-[#EED8D3] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#C6A36A]/55 bg-[#FAF1EB] px-4 py-4 space-y-1.5 shadow-[0_14px_30px_-14px_rgba(30,21,18,0.22)]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/60'
                    : 'text-[#2D201B] hover:bg-[#EED8D3]/75 hover:text-[#1E1512]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#C6A36A]/40">
            <button
              type="button"
              onClick={() => handleSelect('order')}
              className="w-full py-3 px-4 rounded-xl bg-[#C6A36A] border border-[#7D591D]/45 text-[#1E1512] text-sm font-bold cursor-pointer tabular-nums"
            >
              {cartCount > 0 ? `View Order (${cartCount})` : 'Start Order'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
