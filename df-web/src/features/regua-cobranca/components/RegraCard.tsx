import {
  CalendarClock,
  Clock,
  Mail,
  MessageCircle,
  Pencil,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { CanalNotificacao, GatilhoRegua, type RegraCobranca } from '@/types';
import { cn } from '@/lib/cn';

interface RegraCardProps {
  regra: RegraCobranca;
  /** Quando true, mostra ring destacado (selecionada na timeline). */
  destaque?: boolean;
  onEditar: () => void;
  onAlternarAtivo: () => void;
  onExcluir: () => void;
  carregandoToggle?: boolean;
}

const CANAL_ICONE = {
  [CanalNotificacao.EMAIL]: Mail,
  [CanalNotificacao.WHATSAPP]: MessageCircle,
  [CanalNotificacao.SMS]: Smartphone,
} as const;

const CANAL_LABEL = {
  [CanalNotificacao.EMAIL]: 'Email',
  [CanalNotificacao.WHATSAPP]: 'WhatsApp',
  [CanalNotificacao.SMS]: 'SMS',
} as const;

const GATILHO_TOM: Record<GatilhoRegua, 'sky' | 'emerald' | 'rose'> = {
  [GatilhoRegua.ANTES_VENCIMENTO]: 'sky',
  [GatilhoRegua.DIA_VENCIMENTO]: 'emerald',
  [GatilhoRegua.APOS_VENCIMENTO]: 'rose',
};

function descreverGatilho(regra: RegraCobranca): string {
  const dias = Math.abs(regra.diasOffset);
  if (regra.gatilho === GatilhoRegua.DIA_VENCIMENTO) {
    return 'No dia do vencimento';
  }
  if (regra.gatilho === GatilhoRegua.ANTES_VENCIMENTO) {
    return `${dias} dia${dias === 1 ? '' : 's'} antes do vencimento`;
  }
  return `${dias} dia${dias === 1 ? '' : 's'} após o vencimento`;
}

export function RegraCard({
  regra,
  destaque,
  onEditar,
  onAlternarAtivo,
  onExcluir,
  carregandoToggle,
}: RegraCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors',
        destaque && 'ring-2 ring-emerald-500/50',
        !regra.ativo && 'opacity-70',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{regra.nome}</h3>
            <Badge tom={GATILHO_TOM[regra.gatilho]}>
              <Clock className="mr-1 inline-block h-3 w-3" />
              {descreverGatilho(regra)}
            </Badge>
            {!regra.ativo && <Badge tom="slate">Inativa</Badge>}
          </div>
          {regra.descricao && (
            <p className="mt-1 text-xs text-slate-400">{regra.descricao}</p>
          )}
        </div>
        <div className="flex flex-none items-center gap-1">
          <Switch
            checked={regra.ativo}
            disabled={carregandoToggle}
            onChange={onAlternarAtivo}
            aria-label={regra.ativo ? 'Desativar regra' : 'Ativar regra'}
          />
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={onEditar}
            aria-label="Editar regra"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-rose-300 hover:bg-rose-500/10"
            onClick={onExcluir}
            aria-label="Excluir regra"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mt-4 space-y-2">
        {regra.acoes.map((acao, idx) => {
          const Icone = CANAL_ICONE[acao.canal];
          return (
            <div
              key={idx}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
            >
              <div className="mb-1 flex items-center gap-2 text-xs">
                <Icone className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-300">
                  {CANAL_LABEL[acao.canal]}
                </span>
                {acao.assunto && (
                  <span className="truncate text-slate-500">
                    • {acao.assunto}
                  </span>
                )}
              </div>
              <p className="line-clamp-3 text-xs text-slate-400">
                {acao.mensagem}
              </p>
            </div>
          );
        })}
      </div>

      <footer className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <CalendarClock className="h-3 w-3" />
        Atualizada em{' '}
        {new Date(regra.atualizadoEm).toLocaleDateString('pt-BR')}
      </footer>
    </article>
  );
}
