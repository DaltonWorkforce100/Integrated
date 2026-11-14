interface BrandMarkProps {
  inverted?: boolean;
}

export function BrandMark({ inverted = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="26"
          height="26"
          rx="6"
          fill={inverted ? '#0F172A' : '#0A1628'}
          stroke={inverted ? '#334155' : '#1E293B'}
          strokeWidth="1"
        />
        <path
          d="M7 9.5H21M14 9.5V20"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M8.5 14.5L11.5 17.5"
          stroke="#10B981"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M19.5 14.5L16.5 17.5"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-display text-base sm:text-lg font-bold tracking-tight ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}
      >
        Teracore Integrated Solution
      </span>
    </span>
  );
}
