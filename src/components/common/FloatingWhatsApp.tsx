interface FloatingWhatsAppProps {
  contact: string;
  restaurantName: string;
}

function formatWhatsAppDigits(rawContact: string): string {
  const digitsOnly = rawContact.replace(/\D/g, '');
  if (!digitsOnly) return '923001234567';
  if (digitsOnly.startsWith('920')) {
    return `92${digitsOnly.slice(3)}`;
  }
  if (digitsOnly.startsWith('0')) {
    return `92${digitsOnly.slice(1)}`;
  }
  return digitsOnly;
}

export function FloatingWhatsApp({ contact, restaurantName }: FloatingWhatsAppProps) {
  const phoneDigits = formatWhatsAppDigits(contact);
  const message = `Hello ${restaurantName}, I would like to inquire about a table reservation or order.`;
  const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

  return (
    <div className="no-print fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3 pointer-events-none">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${restaurantName} on WhatsApp`}
        className="pointer-events-auto group relative inline-flex flex-col items-center justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A36A]"
      >
        {/* Subtle desktop/tablet hover label */}
        <span
          aria-hidden="true"
          className="hidden sm:inline-flex items-center gap-1.5 absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-full bg-[#FAF1EB] border border-[#C6A36A]/85 text-[#1E1512] text-xs font-semibold tracking-[0.01em] whitespace-nowrap shadow-[0_12px_28px_-12px_rgba(30,21,18,0.4)] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200 pointer-events-none"
        >
          <span>WhatsApp</span>
          <span className="text-[#7D591D] font-mono font-bold tabular-nums">{contact}</span>
        </span>

        {/* Levitating 3D WhatsApp Medallion */}
        <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 animate-whatsapp-float transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
          <svg
            viewBox="0 0 80 84"
            fill="none"
            aria-hidden="true"
            className="w-full h-full drop-shadow-[0_10px_14px_rgba(73,56,50,0.28)]"
          >
            <defs>
              {/* 3D Extruded Bottom Rim Gradient */}
              <linearGradient id="waBaseDepth" x1="12" y1="16" x2="68" y2="76" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#128C7E" />
                <stop offset="55%" stopColor="#0D6E5D" />
                <stop offset="100%" stopColor="#074D41" />
              </linearGradient>

              {/* Main 3D Glossy Face Gradient */}
              <linearGradient id="waSurface" x1="14" y1="8" x2="66" y2="68" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4FF08B" />
                <stop offset="42%" stopColor="#25D366" />
                <stop offset="100%" stopColor="#128C7E" />
              </linearGradient>

              {/* Champagne Luxury Bezel Ring */}
              <linearGradient id="waGoldTrim" x1="10" y1="6" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF9F1" stopOpacity="0.9" />
                <stop offset="48%" stopColor="#C6A36A" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#8F6D39" stopOpacity="0.9" />
              </linearGradient>

              {/* Specular Top Sheen */}
              <linearGradient id="waGloss" x1="40" y1="8" x2="40" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* 3D White Emblem Face */}
              <linearGradient id="waIconWhite" x1="24" y1="20" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFF9F1" />
              </linearGradient>
            </defs>

            {/* 3D Extruded Side & Bottom Thickness */}
            <rect x="8" y="13" width="64" height="64" rx="22" fill="url(#waBaseDepth)" />

            {/* Champagne Metallic Edge Highlight */}
            <rect
              x="8.75"
              y="13.75"
              width="62.5"
              height="62.5"
              rx="21.25"
              stroke="#C6A36A"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />

            {/* Primary Front 3D Tile */}
            <rect x="8" y="6" width="64" height="64" rx="22" fill="url(#waSurface)" />
            <rect
              x="9"
              y="7"
              width="62"
              height="62"
              rx="21"
              stroke="url(#waGoldTrim)"
              strokeWidth="1.6"
            />

            {/* Top-Left Enamel Specular Highlight */}
            <path
              d="M14 25C14 15.6112 21.6112 8 31 8H49C58.3888 8 66 15.6112 66 25V27C55 32.5 25 32.5 14 27V25Z"
              fill="url(#waGloss)"
            />

            {/* Recessed Shadow Under WhatsApp Speech Bubble for 3D Relief */}
            <g transform="translate(0 2)" opacity="0.28">
              <path
                d="M40 20C30.0589 20 22 27.951 22 37.758C22 41.095 22.936 44.215 24.559 46.879L22.583 54.095L29.975 52.156C32.548 53.559 35.511 54.361 38.674 54.487L40 54.516C49.9411 54.516 58 46.565 58 36.758C58 26.951 49.9411 20 40 20Z"
                fill="#064036"
              />
            </g>

            {/* Sculpted WhatsApp Bubble */}
            <path
              d="M40.008 19.5C30.088 19.5 22.047 27.441 22.047 37.239C22.047 40.766 23.091 44.051 24.892 46.814L22.583 55.249L31.236 52.978C33.896 54.429 36.906 55.189 40.008 55.189C49.928 55.189 57.969 47.248 57.969 37.45C57.969 27.652 49.928 19.5 40.008 19.5ZM40.008 51.838C37.211 51.838 34.47 51.087 32.078 49.669L31.508 49.33L26.373 50.677L27.743 45.672L27.372 45.082C25.814 42.603 24.991 39.742 24.991 36.811C24.991 28.647 31.727 22.008 40.008 22.008C48.289 22.008 55.025 28.647 55.025 36.811C55.025 44.975 48.289 51.838 40.008 51.838Z"
              fill="url(#waIconWhite)"
            />

            {/* Crisp Raised Handset Glyph */}
            <path
              d="M48.241 42.192C47.79 41.966 45.573 40.875 45.16 40.724C44.747 40.573 44.446 40.498 44.145 40.949C43.844 41.4 42.98 42.417 42.717 42.718C42.454 43.019 42.19 43.057 41.739 42.831C41.288 42.605 39.835 42.128 38.111 40.591C36.77 39.395 35.864 37.917 35.601 37.466C35.338 37.015 35.573 36.771 35.799 36.546C36.002 36.344 36.25 36.019 36.476 35.756C36.701 35.493 36.776 35.305 36.927 35.004C37.077 34.703 37.002 34.44 36.889 34.214C36.776 33.988 35.875 31.771 35.499 30.869C35.133 29.991 34.761 30.111 34.484 30.097C34.221 30.084 33.92 30.081 33.619 30.081C33.318 30.081 32.83 30.194 32.416 30.645C32.003 31.096 30.838 32.186 30.838 34.403C30.838 36.62 32.454 38.762 32.679 39.063C32.905 39.364 35.859 43.918 40.382 45.871C41.458 46.336 42.298 46.613 42.953 46.821C44.033 47.164 45.016 47.115 45.793 46.999C46.66 46.87 48.466 45.908 48.842 44.855C49.218 43.802 49.218 42.899 49.105 42.711C48.992 42.523 48.692 42.418 48.241 42.192Z"
              fill="url(#waIconWhite)"
            />
          </svg>
        </span>

        {/* Grounded 3D Float Shadow */}
        <span
          aria-hidden="true"
          className="-mt-1 w-9 sm:w-10 h-2 rounded-full bg-[#1E1512]/35 blur-[3px] animate-whatsapp-shadow"
        />
      </a>
    </div>
  );
}
