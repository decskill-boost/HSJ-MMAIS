interface SimboloMmaisProps {
  /** Com rosto = Escudinho (capa, cara e brilhos); só no mundo das crianças, nunca em contexto clínico */
  comRosto?: boolean;
  className?: string;
  title?: string;
}

/** Escudo MMAIS «Versão Heróis» — o emblema de peito da marca (brandbook, cap. 02). */
const SimboloMmais = ({
  comRosto = false,
  className = "h-16 w-auto",
  title = "MMAIS",
}: SimboloMmaisProps) => (
  <svg viewBox="0 0 140 150" className={className} role="img" aria-label={title}>
    <defs>
      <linearGradient id="mmais-escudo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3D6BFF" />
        <stop offset="1" stopColor="#1D42C8" />
      </linearGradient>
      <linearGradient id="mmais-capa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF3D57" />
        <stop offset="1" stopColor="#C2183B" />
      </linearGradient>
    </defs>
    {comRosto && (
      <path
        d="M46 30 C22 46 10 74 16 108 C24 103 29 107 35 99 C42 105 50 96 58 82 L58 44 Z"
        fill="url(#mmais-capa)" stroke="#141F3C" strokeWidth="4.5" strokeLinejoin="round"
      />
    )}
    <path
      d="M70 8 C84 13 100 17 114 21 C115 38 115 54 115 66 C115 100 96 124 70 138 C44 124 25 100 25 66 C25 54 25 38 26 21 C40 17 56 13 70 8 Z"
      fill="url(#mmais-escudo)" stroke="#141F3C" strokeWidth="5.5" strokeLinejoin="round"
    />
    <path
      d="M70 17 C81 21 93 24 106 27.5 C106.7 41 106.7 53 106.7 64 C106.7 93 91 113 70 125.5 C49 113 33.3 93 33.3 64 C33.3 53 33.3 41 34 27.5 C47 24 59 21 70 17 Z"
      fill="none" stroke="#FFCE29" strokeWidth="3.5"
    />
    <g transform="rotate(-4 70 72)">
      <rect x="58" y="36" width="24" height="72" rx="11.5" fill="#FFCE29" stroke="#141F3C" strokeWidth="4" />
      <rect x="34" y="60" width="72" height="24" rx="11.5" fill="#FFCE29" stroke="#141F3C" strokeWidth="4" />
    </g>
    <ellipse cx="49" cy="34" rx="10" ry="6" fill="#FAF4E4" opacity=".3" transform="rotate(-24 49 34)" />
    {comRosto && (
      <g>
        <ellipse cx="62.5" cy="66" rx="5.6" ry="6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.4" />
        <ellipse cx="78.5" cy="65" rx="5.6" ry="6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.4" />
        <circle cx="63.2" cy="66.8" r="2.4" fill="#141F3C" />
        <circle cx="79" cy="65.8" r="2.4" fill="#141F3C" />
        <circle cx="64" cy="65.6" r=".9" fill="#FFFDF4" />
        <circle cx="79.8" cy="64.6" r=".9" fill="#FFFDF4" />
        <circle cx="52" cy="77" r="4.2" fill="#FF3D57" opacity=".5" />
        <circle cx="89" cy="75.5" r="4.2" fill="#FF3D57" opacity=".5" />
        <path d="M62 79 Q70.5 88 79 78" stroke="#141F3C" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M66 83.5 Q70.5 86.5 75 83" stroke="#FF6F86" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    )}
  </svg>
);

export default SimboloMmais;
