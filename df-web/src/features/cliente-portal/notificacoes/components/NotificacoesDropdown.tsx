import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import {
  useMarcarNotificacaoLida,
  useMarcarTodasComoLidas,
  useNotificacoes,
} from '@/features/cliente-portal/notificacoes/hooks/useNotificacoes';
import { cn } from '@/lib/cn';

export function NotificacoesDropdown() {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notificacoes } = useNotificacoes();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasComoLidas();

  const naoLidas = notificacoes?.filter((n) => n.naoLida).length ?? 0;

  useEffect(() => {
    if (!aberto) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [aberto]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        aria-expanded={aberto}
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-semibold text-slate-100">Notificações</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100 disabled:opacity-50"
              disabled={naoLidas === 0 || marcarTodas.isPending}
              onClick={() => marcarTodas.mutate()}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes && notificacoes.length > 0 ? (
              <ul className="divide-y divide-slate-800">
                {notificacoes.slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <Link
                      to={
                        n.faturaId
                          ? `/cliente/faturas/${n.faturaId}`
                          : '/cliente/notificacoes'
                      }
                      onClick={() => {
                        if (n.naoLida) marcarLida.mutate(n.id);
                        setAberto(false);
                      }}
                      className={cn(
                        'flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-slate-800/40',
                        n.naoLida && 'bg-slate-800/30',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-100">
                          {n.titulo}
                        </p>
                        {n.naoLida && (
                          <span className="mt-1 h-2 w-2 flex-none rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-400">
                        {n.mensagem}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <BellOff className="h-6 w-6 text-slate-600" />
                <p className="text-xs text-slate-500">
                  Nenhuma notificação no momento.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 px-4 py-2 text-center">
            <Link
              to="/cliente/notificacoes"
              onClick={() => setAberto(false)}
              className="text-xs font-medium text-sky-300 hover:text-sky-200"
            >
              Ver todas as notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
