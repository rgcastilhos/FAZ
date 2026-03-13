// Update button component to display in the UI

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { motion, AnimatePresence } from 'motion/react';

export function UpdateButton() {
  const { hasUpdate, isChecking, newVersion, performUpdate, dismissUpdate } = useAppUpdate();

  if (!hasUpdate) {
    return null;
  }

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-900/90 border border-emerald-500/30 rounded-2xl p-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                Nova Versão Disponível
              </p>
              {newVersion?.version && (
                <p className="text-[9px] text-emerald-400/70">
                  v{newVersion.version}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={performUpdate}
              disabled={isChecking}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={dismissUpdate}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-colors"
            >
              Depois
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
