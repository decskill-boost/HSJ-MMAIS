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
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-12 w-full min-h-[300px]";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Spinner ring */}
        <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
        {/* Pulsing inner dot */}
        <div className="absolute h-6 w-6 rounded-full bg-indigo-600/10 animate-pulse" />
      </div>
      {mensagem && (
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
          {mensagem}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
