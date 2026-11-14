import { useState } from 'react';
import { Shield, Sun, Server } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  category?: 'solar' | 'cctv' | 'it' | 'general';
  loading?: 'eager' | 'lazy';
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  category = 'general',
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const Icon = category === 'solar' ? Sun : category === 'cctv' ? Shield : Server;
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-6 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-8 h-8 text-emerald-500 mb-2" strokeWidth={1.75} />
        <span className="text-xs font-medium text-center text-slate-400 max-w-xs">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
