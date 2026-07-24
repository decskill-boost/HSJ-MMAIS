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
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-8 w-full min-h-[200px]";

  return (
    <div className={containerClass}>
      <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
      {mensagem && (
        <p className="mt-3 text-sm font-medium text-slate-500">{mensagem}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
