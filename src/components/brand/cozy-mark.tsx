/** Tiny original Sengapp illustration; uses semantic shadcn colors across personal themes. */
export function CozyMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 250" fill="none" aria-hidden="true" className={className}>
      <circle cx="134" cy="130" r="107" fill="hsl(var(--accent))" />
      <circle cx="45" cy="67" r="7" fill="hsl(var(--primary) / 0.3)" />
      <circle cx="221" cy="49" r="5" fill="hsl(var(--primary) / 0.3)" />
      <path d="M211 80c18 35 14 93-19 110-15 7-32-1-32-18 0-14 17-24 29-15 5 4 6 8 6 13 12-13 5-35-13-42-32-13-53 16-48 47 5 38 47 52 76 26 39-36 31-93 1-121Z" fill="hsl(var(--primary) / 0.68)" />
      <path d="m93 88-1-41 31 20 28-20 4 41" fill="hsl(var(--primary))" />
      <path d="M88 115c0-30 22-49 51-49s51 19 51 49v69c0 31-19 45-51 45s-51-14-51-45v-69Z" fill="hsl(var(--primary))" />
      <ellipse cx="139" cy="180" rx="31" ry="41" fill="hsl(var(--card))" />
      <path d="M107 126c8-15 20-20 32-20 14 0 27 6 35 20v22c-12 17-57 17-67 0v-22Z" fill="hsl(var(--card))" />
      <ellipse cx="120" cy="131" rx="4.5" ry="5" fill="hsl(var(--foreground))" />
      <ellipse cx="159" cy="131" rx="4.5" ry="5" fill="hsl(var(--foreground))" />
      <path d="M134 140q5-5 10 0l-5 5-5-5Z" fill="hsl(var(--foreground))" />
      <path d="M139 145v7m0 0q-6 5-12-1m12 1q6 5 12-1" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="109" cy="145" r="7" fill="hsl(var(--primary) / 0.22)" />
      <circle cx="169" cy="145" r="7" fill="hsl(var(--primary) / 0.22)" />
      <path d="M121 186q-17-9-22 5m58-5q17-9 22 5" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round" />
      <path d="M34 183c10-23 21-29 39-27-12 16-19 29-39 27Z" fill="hsl(var(--primary) / 0.35)" />
      <path d="m34 183 34-23" stroke="hsl(var(--primary) / 0.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
