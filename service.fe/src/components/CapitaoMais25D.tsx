import { useRef, useState } from "react";

/**
 * Capitão Mais em 2.5D — cinco camadas vetoriais com profundidade real
 * (capa → corpo → rosto → luvas → brilhos). Roda em idle e dá uma pirueta
 * ao toque. Só para momentos-estrela (brandbook Heróis, cap. 05); a rotação
 * fica limitada a ±13° para a paralaxe não «descolar» as camadas.
 */
const CapitaoMais25D = () => {
  const [aRodar, setARodar] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const pirueta = () => {
    if (aRodar) return;
    setARodar(true);
    timer.current = setTimeout(() => setARodar(false), 1200);
  };

  return (
    <div>
      <div
        className="cap3d-stage"
        role="button"
        tabIndex={0}
        aria-label="Capitão Mais — toca para ele dar uma pirueta"
        onClick={pirueta}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pirueta();
          }
        }}
      >
        <div className={`cap3d-rig${aRodar ? " pirueta" : ""}`}>
          {/* 1 · Capa */}
          <div className="cap3d-l cap3d-l1">
            <svg viewBox="0 0 140 160" aria-hidden="true">
              <defs>
                <linearGradient id="c3d-capa" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF5A71" />
                  <stop offset="1" stopColor="#B0142F" />
                </linearGradient>
              </defs>
              <g className="cap-capa-flap">
                <path
                  d="M46 54 C20 74 6 102 14 140 C22 135 28 140 34 131 C41 137 50 128 60 110 L60 78 Z"
                  fill="url(#c3d-capa)" stroke="#141F3C" strokeWidth="4" strokeLinejoin="round"
                />
                <path d="M42 66 C32 80 26 96 26 116" stroke="#8F1229" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
                {/* emblema «+» na capa — o nosso «S» de super-herói */}
                <g transform="rotate(-16 34 100)">
                  <rect x="30.5" y="90" width="7.5" height="20" rx="3.75" fill="#FFCE29" stroke="#141F3C" strokeWidth="2.2" />
                  <rect x="24.25" y="96.25" width="20" height="7.5" rx="3.75" fill="#FFCE29" stroke="#141F3C" strokeWidth="2.2" />
                </g>
              </g>
            </svg>
          </div>
          {/* 2 · Corpo (+ com extrusão, botas, poupa) */}
          <div className="cap3d-l cap3d-l2">
            <svg viewBox="0 0 140 160" aria-hidden="true">
              <defs>
                <linearGradient id="c3d-corpo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4A79FF" />
                  <stop offset="1" stopColor="#1E3FA8" />
                </linearGradient>
              </defs>
              <path d="M62 16 C62 4 76 0 81 10 C75 8 70 10 70 17 Z" fill="#141F3C" />
              <rect x="55.5" y="18.5" width="36" height="100" rx="15" fill="#14309A" stroke="#141F3C" strokeWidth="4" />
              <rect x="24.5" y="49.5" width="98" height="36" rx="15" fill="#14309A" stroke="#141F3C" strokeWidth="4" />
              <rect x="52" y="14" width="36" height="100" rx="15" fill="url(#c3d-corpo)" stroke="#141F3C" strokeWidth="4" />
              <rect x="21" y="45" width="98" height="36" rx="15" fill="url(#c3d-corpo)" stroke="#141F3C" strokeWidth="4" />
              <path d="M58 20 q10 -4 20 0" stroke="#9CB4FF" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />
              <rect x="56.5" y="113.5" width="15" height="16" rx="6" fill="#C98A00" stroke="#141F3C" strokeWidth="3" />
              <rect x="75.5" y="113.5" width="15" height="16" rx="6" fill="#C98A00" stroke="#141F3C" strokeWidth="3" />
              <rect x="53" y="110" width="15" height="16" rx="6" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
              <rect x="72" y="110" width="15" height="16" rx="6" fill="#FFCE29" stroke="#141F3C" strokeWidth="3" />
            </svg>
          </div>
          {/* 3 · Rosto (máscara, olhos, sorriso) */}
          <div className="cap3d-l cap3d-l3">
            <svg viewBox="0 0 140 160" aria-hidden="true">
              <defs>
                <linearGradient id="c3d-mask" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFE066" />
                  <stop offset="1" stopColor="#FFB800" />
                </linearGradient>
              </defs>
              <rect x="48" y="28" width="44" height="19" rx="9.5" fill="url(#c3d-mask)" stroke="#141F3C" strokeWidth="3" />
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
          </div>
          {/* 4 · Luvas (à frente — punhos para o ecrã) */}
          <div className="cap3d-l cap3d-l4">
            <svg viewBox="0 0 140 160" aria-hidden="true">
              <circle cx="23" cy="55" r="3.6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.5" />
              <circle cx="18" cy="63" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3.5" />
              <g className="cap-luva-dir">
                <circle cx="117" cy="55" r="3.6" fill="#FFFDF4" stroke="#141F3C" strokeWidth="2.5" />
                <circle cx="122" cy="63" r="9.5" fill="#FFFDF4" stroke="#141F3C" strokeWidth="3.5" />
              </g>
            </svg>
          </div>
          {/* 5 · Brilhos */}
          <div className="cap3d-l cap3d-l5">
            <svg viewBox="0 0 140 160" aria-hidden="true">
              <path className="cap-brilho" d="M22 11 L23.8 16.2 L29 18 L23.8 19.8 L22 25 L20.2 19.8 L15 18 L20.2 16.2 Z" fill="#FFCE29" stroke="#141F3C" strokeWidth="1.6" />
              <path className="cap-brilho b2" d="M120 28.4 L121.4 32.6 L125.6 34 L121.4 35.4 L120 39.6 L118.6 35.4 L114.4 34 L118.6 32.6 Z" fill="#17C3B2" stroke="#141F3C" strokeWidth="1.6" />
              <path className="cap-brilho b3" d="M115 111 L116 114 L119 115 L116 116 L115 119 L114 116 L111 115 L114 114 Z" fill="#FAF4E4" stroke="#141F3C" strokeWidth="1.4" />
            </svg>
          </div>
        </div>
      </div>
      <div className="cap3d-sombra" aria-hidden="true" />
    </div>
  );
};

export default CapitaoMais25D;
