import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Layers } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/cn';
import { maskCNPJ } from '@/utils/cnpj';

/**
 * Dropdown no header do portal que permite filtrar todas as telas a uma
 * filial específica ou ver tudo consolidado. O id selecionado vive no
 * `auth.store` (`filialSelecionadaId`) — `null` significa "todas".
 */
export function SeletorFilial() {
  const filiais = useAuthStore((s) => s.filiais);
  const selecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const setSelecionada = useAuthStore((s) => s.setFilialSelecionada);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, [aberto]);

  // Limpa seleção se a filial atual sumir (admin desvinculou).
  useEffect(() => {
    if (selecionadaId && !filiais.find((f) => f.id === selecionadaId)) {
      setSelecionada(null);
    }
  }, [filiais, selecionadaId, setSelecionada]);

  if (filiais.length === 0) return null;
  // Holding com 1 filial só: nada para escolher — apenas mostra o nome.
  if (filiais.length === 1) {
    const unica = filiais[0];
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm">
        <Building2 className="h-4 w-4 text-sky-400" />
        <span className="truncate text-slate-100">
          {unica.nomeFantasia ?? unica.razaoSocial}
        </span>
      </div>
    );
  }

  const atual = selecionadaId ? filiais.find((f) => f.id === selecionadaId) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm transition-colors hover:border-slate-700 hover:bg-slate-900"
      >
        {atual ? (
          <Building2 className="h-4 w-4 text-sky-400" />
        ) : (
          <Layers className="h-4 w-4 text-emerald-400" />
        )}
        <span className="max-w-[180px] truncate text-slate-100">
          {atual ? atual.nomeFantasia ?? atual.razaoSocial : 'Todas as filiais'}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-500 transition-transform',
            aberto && 'rotate-180',
          )}
        />
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setSelecionada(null);
              setAberto(false);
            }}
            className={cn(
              'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-800',
              !atual && 'bg-emerald-500/10 text-emerald-300',
            )}
          >
            <Layers className="h-4 w-4 flex-none text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">Todas as filiais</p>
              <p className="text-xs text-slate-500">
                Consolidar dados de {filiais.length} loja(s)
              </p>
            </div>
            {!atual && <Check className="h-4 w-4 flex-none" />}
          </button>

          <div className="max-h-72 overflow-y-auto border-t border-slate-800">
            {filiais.map((f) => {
              const ativa = f.id === selecionadaId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelecionada(f.id);
                    setAberto(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-800',
                    ativa && 'bg-sky-500/10 text-sky-300',
                  )}
                >
                  <Building2 className="h-4 w-4 flex-none text-sky-400" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      <span className="truncate">
                        {f.nomeFantasia ?? f.razaoSocial}
                      </span>
                      {f.principal && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                          Sede
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {maskCNPJ(f.cnpj)} · {f.status.toLowerCase()}
                    </p>
                  </div>
                  {ativa && <Check className="h-4 w-4 flex-none" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
