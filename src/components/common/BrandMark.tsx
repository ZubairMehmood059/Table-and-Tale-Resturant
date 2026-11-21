export function BrandMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="#1E1512" />
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="12"
        stroke="#DFBD7E"
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      <path
        d="M16 40C16 30.0589 23.1634 22 32 22C40.8366 22 48 30.0589 48 40H16Z"
        stroke="#C6A36A"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle
        cx="32"
        cy="18"
        r="2.6"
        fill="#F3DFDC"
        stroke="#C6A36A"
        strokeWidth="1.4"
      />
      <path
        d="M12 44.5H52"
        stroke="#F3DFDC"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M27 32.5H37M32 28.5V36.5"
        stroke="#F3DFDC"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
