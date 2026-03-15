import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-red-500/20 rounded-3xl p-8 max-w-md shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Opa! Algo deu errado</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                O aplicativo encontrou um erro inesperado. Tente reiniciar ou limpar o cache se o problema persistir.
              </p>
              {this.state.error && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl w-full">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Erro Detectado:</p>
                  <p className="text-xs text-red-200 font-mono break-all">{this.state.error.message || String(this.state.error)}</p>
                </div>
              )}
            </div>
            
            {this.state.error && (
              <div className="mb-6 text-left">
                <details className="group">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors list-none flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center bg-zinc-800 rounded group-open:rotate-90 transition-transform">▶</span>
                    Detalhes técnicos
                  </summary>
                  <div className="mt-3 p-4 bg-black/50 rounded-2xl border border-white/5 font-mono text-[10px] text-red-400/80 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                    {this.state.error.stack || this.state.error.toString()}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar App
              </button>
              
              <button
                onClick={() => {
                  if (confirm("Isso irá deslogar você e limpar as configurações locais. Deseja continuar?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-[10px] py-3 rounded-2xl transition-all"
              >
                Limpar dados e sair
              </button>
            </div>
          </div>
          <p className="mt-8 text-zinc-600 text-[10px] font-medium uppercase tracking-[0.2em]">
            FazendaOn - v1.0.1
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
