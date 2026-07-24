import React from "react";

interface LoadingSpinnerProps {
  mensagem?: string;
  fullscreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  mensagem = "A carregar...",
  fullscreen = false,
}) => {
  const containerClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-tinta/20 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-8 w-full min-h-[200px]";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-tinta/15 border-t-cobalto animate-spin" />
        <span className="absolute h-4 w-4 rounded-full bg-raio" />
      </div>
      {mensagem && (
        <p className="mt-3 text-sm font-bold uppercase tracking-wide text-aco animate-pulse">
          {mensagem}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
