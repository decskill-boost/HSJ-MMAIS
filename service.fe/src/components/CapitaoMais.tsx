interface CapitaoMaisProps {
  className?: string;
  title?: string;
}

/** Capitão Mais (versão plana) — a mascote MMAIS para logótipo e apontamentos pequenos. */
const CapitaoMais = ({
  className = "h-16 w-auto",
  title = "Capitão Mais",
}: CapitaoMaisProps) => (
  <svg viewBox="0 0 140 150" className={className} role="img" aria-label={title}>
    <defs>
      <linearGradient id="cap-corpo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3D6BFF" />
        <stop offset="1" stopColor="#1D42C8" />
      </linearGradient>
      <linearGradient id="cap-capa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF3D57" />
        <stop offset="1" stopColor="#C2183B" />
      </linearGradient>
    </defs>
    <g className="cap-capa-flap">
      <path
        d="M46 54 C20 74 6 102 14 140 C22 135 28 140 34 131 C41 137 50 128 60 110 L60 78 Z"
        fill="url(#cap-capa)" stroke="#141F3C" strokeWidth="4" strokeLinejoin="round"
      />
      {/* emblema «+» na capa — o nosso «S» de super-herói */}
      <g transform="rotate(-16 33 97)">
        <rect x="29.5" y="87" width="7.5" height="20" rx="3.75" fill="#FFCE29" stroke="#141F3C" strokeWidth="2.2" />
        <rect x="23.25" y="93.25" width="20" height="7.5" rx="3.75" fill="#FFCE29" stroke="#141F3C" strokeWidth="2.2" />
      </g>
    </g>
    <path d="M62 16 C62 4 76 0 81 10 C75 8 70 10 70 17 Z" fill="#141F3C" />
    <rect x="52" y="14" width="36" height="100" rx="15" fill="url(#cap-corpo)" stroke="#141F3C" strokeWidth="4" />
    <rect x="21" y="45" width="98" height="36" rx="15" fill="url(#cap-corpo)" stroke="#141F3C" strokeWidth="4" />
    <circle cx="23" cy="55" r="3.6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.5" />
    <circle cx="18" cy="63" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3.5" />
    <g className="cap-luva-dir">
      <circle cx="117" cy="55" r="3.6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.5" />
      <circle cx="122" cy="63" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3.5" />
    </g>
    <rect x="53" y="110" width="15" height="16" rx="6" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
    <rect x="72" y="110" width="15" height="16" rx="6" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
    <rect x="48" y="28" width="44" height="19" rx="9.5" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
    <g className="cap-olhos">
      <ellipse cx="61" cy="37.5" rx="5.8" ry="6.2" fill="#FFFDF4" />
      <ellipse cx="79" cy="37.5" rx="5.8" ry="6.2" fill="#FFFDF4" />
      <circle cx="61.5" cy="38" r="2.6" fill="#141F3C" />
      <circle cx="78.5" cy="38" r="2.6" fill="#141F3C" />
      <circle cx="62.4" cy="36.6" r="1" fill="#FFFDF4" />
      <circle cx="79.4" cy="36.6" r="1" fill="#FFFDF4" />
    </g>
    <circle cx="50" cy="56" r="4.5" fill="#FF3D57" opacity=".45" />
    <circle cx="90" cy="56" r="4.5" fill="#FF3D57" opacity=".45" />
    <path d="M57 57 Q70 76 83 57 Q70 62 57 57 Z" fill="#141F3C" />
    <rect x="62" y="57.5" width="16" height="4.5" rx="2" fill="#FFFDF4" />
    <ellipse cx="70" cy="66" rx="5.5" ry="3.2" fill="#FF6F86" />
  </svg>
);

export default CapitaoMais;
