export function FingerprintMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 11.2a1.8 1.8 0 0 1 1.8 1.8c0 2.1-.9 4-2 5.8" />
      <path d="M8.6 10.4a3.8 3.8 0 0 1 7.1 1.5c0 1.5-.4 2.9-1 4.2" />
      <path d="M6.3 9.3a6.4 6.4 0 0 1 11.6 2.2c.2 1.4 0 2.8-.5 4.1" />
      <path d="M4.5 8.5a8.6 8.6 0 0 1 15.2 3.1" />
    </svg>
  );
}
