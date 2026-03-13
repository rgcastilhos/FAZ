import React, { useState, useEffect } from 'react';
import { Ruler, Calculator, LayoutGrid, Info, Plus, Trash2, Calendar, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { db, Piquete, RegistroManejo } from '../services/db';
import type { User } from '../types';
import { formatNumber, toDisplayDate } from '../utils/formatters';

interface ManejoPastoProps {
  user: User;
}

const FORRAGEIRAS_REF: Record<string, { entrada: number, saida: number, descanso: number, info: string }> = {
  'Brachiaria Marandu': { entrada: 30, saida: 15, descanso: 30, info: 'Boa resistência à seca e cigarrinha. Exige fertilidade média.' },
  'Brachiaria Decumbens': { entrada: 25, saida: 10, descanso: 28, info: 'Excelente para solos pobres e ácidos.' },
  'Panicum Mombaça': { entrada: 90, saida: 50, descanso: 35, info: 'Alta produtividade. Exige alta fertilidade e manejo rigoroso.' },
  'Panicum Tanzânia': { entrada: 70, saida: 35, descanso: 30, info: 'Ótima qualidade nutricional. Exige solo fértil.' },
  'Cynodon (Tifton 85)': { entrada: 25, saida: 10, descanso: 21, info: 'Altíssima qualidade. Exige muita adubação e irrigação se possível.' }
};

export function ManejoPastoView({ user }: ManejoPastoProps) {
  const [activeSubTab, setActiveSubTab] = useState<'regua' | 'lotacao' | 'dashboard' | 'catalogo'>('dashboard');
  const [piquetes, setPiquetes] = useState<Piquete[]>([]);
  const [selectedPiqueteId, setSelectedPiqueteId] = useState<number | null>(null);
  
  // Dashboard / List logic
  useEffect(() => {
    loadPiquetes();
  }, [user.username]);

  const loadPiquetes = async () => {
    const list = await db.piquetes.where('username').equals(user.username || '').toArray();
    setPiquetes(list);
  };

  const handleAddPiquete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const novo: Piquete = {
      nome: formData.get('nome') as string,
      especieCapim: formData.get('especie') as string,
      areaHa: Number(formData.get('area')),
      status: 'descanso',
      username: user.username
    };
    await db.piquetes.add(novo);
    loadPiquetes();
    e.currentTarget.reset();
  };

  const handleDeletePiquete = async (id: number) => {
    if (confirm('Deseja excluir este piquete?')) {
      await db.piquetes.delete(id);
      loadPiquetes();
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveSubTab('dashboard')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSubTab === 'dashboard' ? 'bg-[#5a5a40] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase">Piquetes</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('regua')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSubTab === 'regua' ? 'bg-[#5a5a40] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Ruler className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase">Régua</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('lotacao')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSubTab === 'lotacao' ? 'bg-[#5a5a40] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calculator className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase">Lotação</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('catalogo')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSubTab === 'catalogo' ? 'bg-[#5a5a40] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Info className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase">Guia</span>
        </button>
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="space-y-4">
          <form onSubmit={handleAddPiquete} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d2b48c]">Novo Piquete</h3>
            <div className="grid grid-cols-2 gap-2">
              <input name="nome" placeholder="Nome do Piquete" required className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5a5a40]" />
              <input name="area" type="number" step="0.1" placeholder="Área (ha)" required className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5a5a40]" />
            </div>
            <select name="especie" required className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#5a5a40]">
              <option value="">Selecione o Capim</option>
              {Object.keys(FORRAGEIRAS_REF).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="bg-[#5a5a40] text-white font-bold py-2 rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </form>

          <div className="grid gap-3">
            {piquetes.map(p => (
              <div key={p.id} className="bg-black/40 border border-white/10 rounded-3xl p-4 flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-[#f5f2ed]">{p.nome}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{p.especieCapim} • {formatNumber(p.areaHa)} ha</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                      p.status === 'pronto' ? 'bg-green-500/20 text-green-400' : 
                      p.status === 'ocupado' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => p.id && handleDeletePiquete(p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'regua' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#d2b48c]">
            <Ruler className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs">Régua de Manejo</h3>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Piquete</label>
            <select 
              value={selectedPiqueteId || ''} 
              onChange={(e) => setSelectedPiqueteId(Number(e.target.value))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none"
            >
              <option value="">Selecione o piquete...</option>
              {piquetes.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especieCapim})</option>)}
            </select>

            {selectedPiqueteId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="bg-[#5a5a40]/20 p-4 rounded-2xl border border-[#5a5a40]/30">
                  <p className="text-xs text-[#d2b48c] font-bold uppercase mb-2">Metas Embrapa (cm):</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Entrada</p>
                      <p className="text-xl font-bold text-green-400">
                        {FORRAGEIRAS_REF[piquetes.find(p => p.id === selectedPiqueteId)?.especieCapim || '']?.entrada}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Saída</p>
                      <p className="text-xl font-bold text-red-400">
                        {FORRAGEIRAS_REF[piquetes.find(p => p.id === selectedPiqueteId)?.especieCapim || '']?.saida}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Altura Medida (cm)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Ex: 25" 
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold"
                    />
                    <button className="bg-[#5a5a40] text-white px-4 rounded-xl font-bold text-xs uppercase tracking-widest">
                      Calcular
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'lotacao' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#d2b48c]">
            <Calculator className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs">Calculadora de Lotação</h3>
          </div>
          
          <div className="grid gap-4">
             <div className="space-y-1">
               <label className="text-[9px] text-zinc-500 uppercase font-black">Nº de Cabeças</label>
               <input type="number" placeholder="Ex: 100" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#5a5a40]" />
             </div>
             <div className="space-y-1">
               <label className="text-[9px] text-zinc-500 uppercase font-black">Peso Médio (kg)</label>
               <input type="number" placeholder="Ex: 400" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#5a5a40]" />
             </div>
             <div className="space-y-1">
               <label className="text-[9px] text-zinc-500 uppercase font-black">Tamanho da Área (ha)</label>
               <input type="number" step="0.1" placeholder="Ex: 10.5" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#5a5a40]" />
             </div>
             <button className="w-full bg-[#5a5a40] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:brightness-110 transition-all">
               Calcular UA/ha
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'catalogo' && (
        <div className="space-y-3">
          {Object.entries(FORRAGEIRAS_REF).map(([nome, ref]) => (
            <div key={nome} className="bg-black/40 border border-white/10 rounded-3xl p-5">
              <h4 className="font-bold text-[#f5f2ed] mb-1">{nome}</h4>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{ref.info}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Entrada</p>
                  <p className="text-sm font-bold text-green-400">{ref.entrada}cm</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Saída</p>
                  <p className="text-sm font-bold text-red-400">{ref.saida}cm</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Repouso</p>
                  <p className="text-sm font-bold text-[#d2b48c]">{ref.descanso}d</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
