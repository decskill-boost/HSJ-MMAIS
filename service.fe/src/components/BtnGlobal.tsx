import { Link } from "react-router-dom";

type Variante = "primary" | "secondary" | "danger" | "raio";
type Tamanho = "sm" | "md" | "lg";

interface BtnGlobalProps {
  to?: string;
  onClick?: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  /** Só para posicionamento (margens, largura) — o espaçamento vem de `size`. */
  className?: string;
  variant?: Variante;
  size?: Tamanho;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  isLoading?: boolean;
}

// Alvo tátil mínimo de 48px em todos os tamanhos (brandbook, cap. 08).
const tamanhos: Record<Tamanho, string> = {
  sm: "min-h-12 px-4 py-2",
  md: "min-h-12 px-5 py-2.5",
  lg: "min-h-14 px-8 py-3.5",
};

// Variantes da marca: Cobalto para o QG clínico, Raio para a Academia.
const variantes: Record<Variante, string> = {
  primary: "bg-cobalto text-papel hover:bg-cobalto-vivo",
  secondary: "bg-papel-claro text-tinta hover:bg-raio/25",
  danger: "bg-capa-escura text-papel hover:bg-[#a01330]",
  raio: "bg-linear-to-b from-raio to-raio-fundo text-tinta hover:brightness-105",
};

/**
 * Botão único da plataforma. Ao ser premido encosta à própria sombra de
 * vinheta, como um carimbo — o feedback tátil que o brandbook pede.
 */
const BtnGlobal = ({
  to,
  onClick,
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  isLoading = false,
}: BtnGlobalProps) => {
  const texto =
    variant === "raio"
      ? `font-display tracking-wide ${size === "lg" ? "text-xl" : "text-lg"}`
      : `font-bold ${size === "lg" ? "text-base" : "text-sm"}`;

  const estilo = [
    "inline-flex min-w-24 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-(--radius-vinheta) border-[3px] border-tinta shadow-vinheta",
    "transition-all duration-75 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-50",
    tamanhos[size],
    variantes[variant],
    texto,
    className,
  ].join(" ");

  const conteudo = (
    <>
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </>
  );

  if (to && !disabled && !isLoading) {
    return (
      <Link to={to} className={estilo}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={estilo}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {conteudo}
    </button>
  );
};

export default BtnGlobal;
