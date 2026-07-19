interface AvatarHeroiProps {
  variante: "clinico" | "crianca";
  className?: string;
}

/**
 * Avatar heróico para perfis sem fotografia. A criança é um herói mascarado
 * (máscara Raio, capa e brilhos); o clínico é um herói de bata (óculos e
 * estetoscópio). Ambos piscam os olhos; a criança balança (classes globais
 * cap-olhos / cap-brilho / animate-balancar, desativadas com reduced-motion).
 */
const AvatarHeroi = ({ variante, className = "h-full w-full" }: AvatarHeroiProps) => {
  if (variante === "crianca") {
    return (
      <span className="animate-balancar h-full w-full">
        <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Avatar de herói em treino">
          <defs>
            <linearGradient id="av-fato" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3D6BFF" />
              <stop offset="1" stopColor="#1D42C8" />
            </linearGradient>
          </defs>
          {/* pontas da capa atrás dos ombros */}
          <path d="M20 118 C12 102 22 92 34 96 L28 118 Z" fill="#FF3D57" stroke="#141F3C" strokeWidth="3" strokeLinejoin="round" />
          <path d="M100 118 C108 102 98 92 86 96 L92 118 Z" fill="#FF3D57" stroke="#141F3C" strokeWidth="3" strokeLinejoin="round" />
          {/* fato */}
          <path d="M22 120 C30 100 48 93 60 93 C72 93 90 100 98 120 Z" fill="url(#av-fato)" stroke="#141F3C" strokeWidth="4" strokeLinejoin="round" />
          {/* emblema + no peito */}
          <g transform="rotate(-8 60 108)">
            <rect x="57" y="101" width="6" height="15" rx="3" fill="#FFCE29" stroke="#141F3C" strokeWidth="1.8" />
            <rect x="52.5" y="105.5" width="15" height="6" rx="3" fill="#FFCE29" stroke="#141F3C" strokeWidth="1.8" />
          </g>
          {/* cabeça */}
          <circle cx="60" cy="60" r="35" fill="#FFFDF4" stroke="#141F3C" strokeWidth="4" />
          <path d="M54 27 C54 15 68 11 73 21 C67 19 62 21 62 28 Z" fill="#141F3C" />
          {/* máscara */}
          <rect x="35" y="46" width="50" height="20" rx="10" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
          <g className="cap-olhos">
            <ellipse cx="49" cy="56" rx="6" ry="6.4" fill="#FFFDF4" />
            <ellipse cx="71" cy="56" rx="6" ry="6.4" fill="#FFFDF4" />
            <circle cx="49.5" cy="56.5" r="2.7" fill="#141F3C" />
            <circle cx="70.5" cy="56.5" r="2.7" fill="#141F3C" />
            <circle cx="50.5" cy="55" r="1" fill="#FFFDF4" />
            <circle cx="71.5" cy="55" r="1" fill="#FFFDF4" />
          </g>
          {/* bochechas e sorriso aberto */}
          <circle cx="38" cy="72" r="4.6" fill="#FF3D57" opacity=".45" />
          <circle cx="82" cy="72" r="4.6" fill="#FF3D57" opacity=".45" />
          <path d="M47 75 Q60 90 73 75 Q60 80 47 75 Z" fill="#141F3C" />
          <rect x="52" y="75.5" width="16" height="4.5" rx="2" fill="#FFFDF4" />
          <ellipse cx="60" cy="83" rx="5.5" ry="3" fill="#FF6F86" />
          {/* brilhos */}
          <path className="cap-brilho" d="M16 20 L17.6 24.4 L22 26 L17.6 27.6 L16 32 L14.4 27.6 L10 26 L14.4 24.4 Z" fill="#FFCE29" stroke="#141F3C" strokeWidth="1.4" />
          <path className="cap-brilho b2" d="M104 14 L105.4 17.6 L109 19 L105.4 20.4 L104 24 L102.6 20.4 L99 19 L102.6 17.6 Z" fill="#17C3B2" stroke="#141F3C" strokeWidth="1.4" />
          <path className="cap-brilho b3" d="M108 76 L109.2 79.2 L112.4 80.4 L109.2 81.6 L108 84.8 L106.8 81.6 L103.6 80.4 L106.8 79.2 Z" fill="#FFFDF4" stroke="#141F3C" strokeWidth="1.2" />
        </svg>
      </span>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Avatar de profissional clínico">
      {/* bata */}
      <path d="M22 120 C30 100 48 93 60 93 C72 93 90 100 98 120 Z" fill="#FFFDF4" stroke="#141F3C" strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 95 L60 107 L68 95" fill="none" stroke="#141F3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* estetoscópio */}
      <path d="M50 97 C46 108 52 115 60 114" fill="none" stroke="#1D42C8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="63" cy="114" r="4.5" fill="#17C3B2" stroke="#141F3C" strokeWidth="2.5" />
      {/* cruz «+» no bolso da bata — herói de bata */}
      <g>
        <rect x="79" y="103" width="5" height="13" rx="2.5" fill="#1D42C8" />
        <rect x="75" y="107" width="13" height="5" rx="2.5" fill="#1D42C8" />
      </g>
      {/* cabeça */}
      <circle cx="60" cy="58" r="35" fill="#FFFDF4" stroke="#141F3C" strokeWidth="4" />
      <path d="M27 54 C27 30 46 17 60 17 C74 17 93 30 93 54 C88 36 74 27 60 27 C46 27 32 36 27 54 Z" fill="#141F3C" />
      {/* óculos redondos */}
      <circle cx="47" cy="57" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3" />
      <circle cx="73" cy="57" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3" />
      <path d="M56.5 57 L63.5 57" stroke="#141F3C" strokeWidth="3" strokeLinecap="round" />
      <g className="cap-olhos">
        <circle cx="47.5" cy="57.5" r="2.7" fill="#141F3C" />
        <circle cx="72.5" cy="57.5" r="2.7" fill="#141F3C" />
        <circle cx="48.5" cy="56" r="1" fill="#FFFDF4" />
        <circle cx="73.5" cy="56" r="1" fill="#FFFDF4" />
      </g>
      {/* sorriso confiante */}
      <path d="M50 78 Q60 86 70 78" fill="none" stroke="#141F3C" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
};

export default AvatarHeroi;
