import React from "react";

interface LoadingSpinnerProps {
  mensagem?: string;
  fullscreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  mensagem = "A carregar dados...",
  fullscreen = false,
}) => {
  const containerClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-tinta/30 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-12 w-full min-h-[300px]";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Anel do spinner — Cobalto da marca */}
        <div className="h-14 w-14 rounded-full border-4 border-tinta/15 border-t-cobalto animate-spin" />
        {/* Ponto interior a pulsar */}
        <div className="absolute h-6 w-6 rounded-full bg-cobalto/10 animate-pulse" />
      </div>
      {mensagem && (
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-aco animate-pulse">
          {mensagem}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
