import { Link } from "react-router-dom";

interface BtnGlobalProps {
  to?: string;
  onClick?: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
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
  // Classes base focadas em feedback tátil rápido
  const baseStyle = `inline-flex min-h-[44px] min-w-[96px] items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-75 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none ${
    className.includes("p-") ? "" : "px-5 py-2.5"
  }`;

  const variants = {
    primary:
      "bg-blue-600 text-white shadow-sm shadow-blue-100 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-100",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/20",
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
