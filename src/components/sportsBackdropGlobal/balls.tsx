import { useId } from 'react';

// Bola de basquete em SVG (sem imagem externa); viewBox 100x100.
export function BasketballSvg() {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FF8A3D" />
          <stop offset="60%" stopColor="#E8590C" />
          <stop offset="100%" stopColor="#B33F00" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} />
      <g fill="none" stroke="#2B1204" strokeWidth="3.2" strokeLinecap="round">
        <circle cx="50" cy="50" r="48" />
        <path d="M2 50h96M50 2v96" />
        <path d="M16 16c14 12 14 56 0 68M84 16c-14 12-14 56 0 68" />
      </g>
    </svg>
  );
}
