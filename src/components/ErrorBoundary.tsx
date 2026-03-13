// Error Boundary component for catching React component errors

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simple error detection - check if children throw
  try {
    if (hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Algo deu errado</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Desculpe, ocorreu um erro inesperado na aplicação.
            </p>
            {error && (
              <details className="mb-4 text-xs text-zinc-500">
                <summary className="cursor-pointer font-mono hover:text-zinc-400">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 p-2 bg-zinc-950 rounded overflow-auto max-h-32">
                  {error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                setHasError(false);
                setError(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  } catch (err: any) {
    setHasError(true);
    setError(err);
    return null;
  }
}
