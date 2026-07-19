import { Link } from "react-router-dom";

interface BtnGlobalProps {
  to?: string;
  onClick?: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "raio";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  isLoading?: boolean;
}

const BtnGlobal = ({
  to,
  onClick,
  children,
  className = "",
  variant = "primary",
  type = "button",
  disabled,
  isLoading = false,
}: BtnGlobalProps) => {
  // Classes base focadas em feedback tátil rápido; alvo tátil mínimo de 48px (brandbook, cap. 08)
  const baseStyle = `inline-flex min-h-12 min-w-[96px] items-center justify-center whitespace-nowrap rounded-(--radius-vinheta) border-[3px] border-tinta text-sm font-bold shadow-vinheta transition-all duration-75 active:scale-95 active:shadow-none disabled:opacity-50 disabled:pointer-events-none select-none ${
    className.includes("p-") ? "" : "px-5 py-2.5"
  }`;

  // Variantes da marca: Cobalto para o QG clínico, Raio para a Academia das crianças
  const variants = {
    primary:
      "bg-cobalto text-papel hover:bg-cobalto-vivo focus:ring-2 focus:ring-cobalto/30",
    secondary:
      "bg-transparent text-tinta hover:bg-tinta/5 focus:ring-2 focus:ring-tinta/20",
    danger:
      "bg-capa-escura text-papel hover:bg-[#a01330] focus:ring-2 focus:ring-capa/30",
    raio:
      "bg-linear-to-b from-raio to-raio-fundo font-display text-lg tracking-wide text-tinta hover:brightness-105 focus:ring-2 focus:ring-raio/40",
  };

  const combinedStyle = `${baseStyle} ${variants[variant]} ${className}`;

  const renderContent = () => (
    <>
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
          viewBox="0 0 24 24"
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
      <Link to={to} className={combinedStyle}>
        {renderContent()}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={combinedStyle}
      type={type}
      disabled={disabled || isLoading}
    >
      {renderContent()}
    </button>
  );
};

export default BtnGlobal;
