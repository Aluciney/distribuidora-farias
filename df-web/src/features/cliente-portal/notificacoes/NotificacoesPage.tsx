import { Link } from 'react-router-dom';
import { Bell, BellOff, Building2, CheckCheck, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useMarcarNotificacaoLida,
  useMarcarTodasComoLidas,
  useNotificacoes,
} from '@/features/cliente-portal/notificacoes/hooks/useNotificacoes';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/cn';

export function NotificacoesPage() {
  const { data: notificacoes, isLoading } = useNotificacoes();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasComoLidas();

  const naoLidas = notificacoes?.filter((n) => n.naoLida).length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Central de Notificações
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Alertas de vencimento, atrasos e atualizações sobre suas faturas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => marcarTodas.mutate()}
          disabled={naoLidas === 0 || marcarTodas.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas como lidas
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-sky-300" />
            <CardTitle>Atualizações recentes</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !notificacoes || notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <BellOff className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-200">
                Nenhuma notificação por enquanto
              </p>
              <p className="text-xs text-slate-500">
                Você está em dia. Avisaremos quando houver novidades.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {notificacoes.map((n) => {
                const conteudo = (
                  <div className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-800/40">
                    <div className="mt-1 flex h-2 w-2 flex-none">
                      {n.naoLida ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" />
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            n.naoLida ? 'text-slate-100' : 'text-slate-300',
                          )}
                        >
                          {n.titulo}
                        </p>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(n.criadoEm)}
                        </span>
                      </div>
                      {n.filial && (
                        <p className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {n.filial.nomeFantasia ?? n.filial.razaoSocial}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {n.mensagem}
                      </p>
                    </div>
                    {n.faturaId && (
                      <ChevronRight className="mt-1 h-4 w-4 flex-none text-slate-500" />
                    )}
                  </div>
                );

                if (n.faturaId) {
                  return (
                    <li key={n.id}>
                      <Link
                        to={`/cliente/faturas/${n.faturaId}`}
                        onClick={() => {
                          if (n.naoLida) marcarLida.mutate(n.id);
                        }}
                      >
                        {conteudo}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        if (n.naoLida) marcarLida.mutate(n.id);
                      }}
                    >
                      {conteudo}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
