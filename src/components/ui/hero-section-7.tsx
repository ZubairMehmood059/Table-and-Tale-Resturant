import React from 'react';
import { cn } from '@/lib/utils';

/**
 * @typedef FloatingImageProps
 * @property {string} src - The source URL for the image.
 * @property {string} alt - The alt text for the image for accessibility.
 * @property {string} className - Tailwind CSS classes for positioning, sizing, and animation.
 */
export interface FloatingImageProps {
  src: string;
  alt: string;
  className: string;
}

/**
 * @typedef FloatingFoodHeroProps
 * @property {React.ReactNode} title - The main heading text.
 * @property {string} description - The paragraph text below the heading.
 * @property {FloatingImageProps[]} images - An array of image objects to be displayed.
 * @property {string} [className] - Optional additional classes for the section container.
 * @property {string} [kicker] - Optional uppercase kicker displayed above the heading.
 * @property {React.ReactNode} [children] - Optional call-to-action controls below the description.
 */
export interface FloatingFoodHeroProps {
  title: React.ReactNode;
  description: string;
  images: FloatingImageProps[];
  className?: string;
  kicker?: string;
  backgroundImageSrc?: string;
  backgroundImageAlt?: string;
  children?: React.ReactNode;
}

/**
 * A decorative SVG component for the background swirl lines.
 */
const Swirls = () => (
  <>
    <svg
      className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 text-[#C6A36A]/45"
      width="600"
      height="600"
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
      className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 text-[#C6A36A]/45"
      width="700"
      height="700"
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

/**
 * A responsive and animated hero section component.
 */
export function FloatingFoodHero({
  title,
  description,
  images,
  className,
  kicker,
  backgroundImageSrc,
  backgroundImageAlt = 'Dining room interior',
  children,
}: FloatingFoodHeroProps) {
  return (
    <div
      className={cn(
        'relative w-full min-h-[70vh] lg:min-h-[78vh] flex items-center justify-center overflow-hidden bg-[#EFE1DA] text-[#1E1512] pt-32 pb-36 sm:pt-38 sm:pb-40 md:pt-40 md:pb-40 lg:pt-42 lg:pb-42 xl:py-32',
        className
      )}
    >
      {/* Optional full-bleed dining room photography with warm atmospheric veil */}
      {backgroundImageSrc && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src={backgroundImageSrc}
            alt={backgroundImageAlt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#F5E7E1]/72 via-[#F6EAE4]/62 to-[#EFE1DA]/96"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#F3DFDC]/20"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <Swirls />
      </div>

      {/* Render floating images */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {images.map((image, index) => (
          <img
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt}
            loading="eager"
            decoding="async"
            className={cn('absolute object-contain', image.className)}
            style={{ animationDelay: `${index * 300}ms` }}
          />
        ))}
      </div>

      {/* Text Content */}
      <div className="relative z-20 mx-3 sm:mx-6 md:mx-auto px-5 py-7 sm:px-9 sm:py-9 lg:px-10 lg:py-11 text-center max-w-2xl md:max-w-xl lg:max-w-2xl rounded-2xl sm:rounded-3xl bg-[#FAF1EB]/96 backdrop-blur-md text-[#1E1512] border border-[#C6A36A]/85 ring-1 ring-[#C6A36A]/35 shadow-[0_28px_64px_-22px_rgba(30,21,18,0.38)]">
        {kicker && <p className="section-kicker mb-2.5 sm:mb-3">{kicker}</p>}
        <h1
          className="font-display text-[1.95rem] font-bold tracking-[-0.02em] text-[#1E1512] sm:text-[2.6rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.08]"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h1>
        <p className="mt-4 sm:mt-5 text-[14px] sm:text-base lg:text-lg font-medium leading-[1.65] sm:leading-[1.7] text-[#362823] max-w-xl mx-auto">
          {description}
        </p>
        {children && <div className="mt-6 sm:mt-7 lg:mt-8">{children}</div>}
      </div>
    </div>
  );
}
