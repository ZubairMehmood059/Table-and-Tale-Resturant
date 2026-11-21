import type React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface SectionFloatingAccent {
  src: string;
  alt: string;
}

interface SectionStageProps {
  id: string;
  kicker: string;
  title: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  floatingImages: [SectionFloatingAccent, SectionFloatingAccent];
  backgroundImageSrc?: string;
  backgroundImageAlt?: string;
  tone?: 'blush' | 'linen';
  className?: string;
  noPrint?: boolean;
  children: React.ReactNode;
}

const StageSwirls = () => (
  <>
    <svg
      className="absolute -top-24 -left-24 text-[#C6A36A]/45"
      width="480"
      height="480"
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M515.266 181.33C377.943 51.564 128.537 136.256 50.8123 293.565C-26.9127 450.874 125.728 600 125.728 600"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
    <svg
      className="absolute -bottom-24 -right-24 text-[#B58E4C]/40"
      width="520"
      height="520"
      viewBox="0 0 700 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M26.8838 528.274C193.934 689.816 480.051 637.218 594.397 451.983C708.742 266.748 543.953 2.22235 543.953 2.22235"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </>
);

export function SectionStage({
  id,
  kicker,
  title,
  subtitle,
  headerAction,
  floatingImages,
  backgroundImageSrc,
  backgroundImageAlt = 'Table & Tale dining hospitality backdrop',
  tone = 'blush',
  className,
  noPrint = false,
  children,
}: SectionStageProps) {
  const [leftImage, rightImage] = floatingImages;
  const bgSurface = tone === 'blush' ? 'bg-[#F5E7E1]' : 'bg-[#EFE1DA]';
  const veilGradient =
    tone === 'blush'
      ? 'from-[#F5E7E1]/82 via-[#F5E7E1]/88 to-[#F5E7E1]/96'
      : 'from-[#EFE1DA]/82 via-[#EFE1DA]/88 to-[#EFE1DA]/96';

  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden py-12 sm:py-18 lg:py-20 border-b border-[#C6A36A]/55',
        bgSurface,
        noPrint && 'no-print',
        className
      )}
    >
      {/* Atmospheric photographic backdrop with warm blush/linen veil */}
      {backgroundImageSrc && (
        <div className="no-print pointer-events-none absolute inset-0 z-0">
          <img
            src={backgroundImageSrc}
            alt={backgroundImageAlt}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-45"
          />
          <div aria-hidden="true" className={cn('absolute inset-0 bg-gradient-to-b', veilGradient)} />
          <div aria-hidden="true" className="absolute inset-0 bg-[#F3DFDC]/20" />
        </div>
      )}

      {/* Editorial Swirl Lines */}
      <div className="no-print pointer-events-none absolute inset-0 z-[1]">
        <StageSwirls />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floated Section Header Stage matching the Home Hero */}
        <div className="no-print relative pt-16 pb-2 sm:pt-20 md:pt-4 md:pb-4 md:px-32 lg:px-40 xl:px-44">
          {/* Top-Left / Flanking Left Floating Plate */}
          <img
            src={leftImage.src}
            alt={leftImage.alt}
            loading="eager"
            decoding="async"
            className="pointer-events-none absolute top-0 left-2 sm:left-4 md:top-1/2 md:-translate-y-1/2 md:left-0 w-20 h-14 sm:w-28 sm:h-20 lg:w-36 lg:h-26 rounded-2xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_18px_36px_-14px_rgba(30,21,18,0.4)] animate-float-gentle z-20"
          />

          {/* Top-Right / Flanking Right Floating Plate */}
          <img
            src={rightImage.src}
            alt={rightImage.alt}
            loading="eager"
            decoding="async"
            style={{ animationDelay: '700ms' }}
            className="pointer-events-none absolute top-0 right-2 sm:right-4 md:top-1/2 md:-translate-y-1/2 md:right-0 w-20 h-14 sm:w-28 sm:h-20 lg:w-36 lg:h-26 rounded-2xl object-cover border-2 border-[#C6A36A]/85 ring-4 ring-[#FAF1EB]/90 shadow-[0_18px_36px_-14px_rgba(30,21,18,0.4)] animate-float-gentle z-20"
          />

          <motion.div
            initial={{ y: 12 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 rounded-2xl sm:rounded-3xl bg-[#FAF1EB]/96 backdrop-blur-md border border-[#C6A36A]/80 ring-1 ring-[#C6A36A]/25 p-5 sm:p-6 lg:p-8 shadow-[0_24px_54px_-22px_rgba(30,21,18,0.28)]"
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-5">
              <div className="min-w-0">
                <p className="section-kicker">{kicker}</p>
                <h2
                  className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1512]"
                  style={{ textWrap: 'balance' }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 text-sm font-medium text-[#362823] leading-relaxed max-w-2xl">
                    {subtitle}
                  </p>
                )}
              </div>

              {headerAction && <div className="w-full lg:w-auto shrink-0">{headerAction}</div>}
            </div>
          </motion.div>
        </div>

        {/* Main Section Workspace */}
        <div className="mt-8 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}
