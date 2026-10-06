interface BrandProps {
  compact?: boolean;
  className?: string;
}

export function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.83c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="34" viewBox="0 0 28 34" fill="none" aria-hidden="true">
      <path d="M14 2 25 8.5v17L14 32 3 25.5v-17L14 2Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14 8v17M8.5 13l5.5-5 5.5 5M8.5 20l5.5 5 5.5-5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function Brand({ compact = false, className = '' }: BrandProps) {
  return (
    <span className={`brand ${className}`}>
      <BrandMark />
      {!compact && <span>LISI&Egrave;RE</span>}
    </span>
  );
}