import { useState } from 'react';
import { Banknote, Download, QrCode, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BoletoBarcode } from '@/components/ui/BoletoBarcode';
import { CopyButton } from '@/components/ui/CopyButton';
import { PixQrCode } from '@/components/ui/PixQrCode';
import { useBaixarPdfBoleto } from '@/features/cobrancas/hooks/useCobrancas';
import { useUsuarioLogado } from '@/features/auth/hooks/useUsuarioLogado';
import { MetodoPagamento, PerfilUsuario, StatusFatura, type Fatura } from '@/types';
import { ReenviarBoletoModal } from './ReenviarBoletoModal';
import {
  formatCNPJ,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/format';

interface DetalhesFaturaModalProps {
  aberto: boolean;
  onFechar: () => void;
  fatura: Fatura | null;
  onBaixarManual: () => void;
  onCancelarFatura: () => void;
}

const STATUS_TOM = {
  [StatusFatura.PAGO]: 'emerald',
  [StatusFatura.PENDENTE]: 'amber',
  [StatusFatura.VENCIDO]: 'rose',
  [StatusFatura.CANCELADO]: 'slate',
  [StatusFatura.ESTORNADO]: 'violet',
} as const;

const STATUS_LABEL = {
  [StatusFatura.PAGO]: 'Paga',
  [StatusFatura.PENDENTE]: 'Pendente',
  [StatusFatura.VENCIDO]: 'Vencida',
  [StatusFatura.CANCELADO]: 'Cancelada',
  [StatusFatura.ESTORNADO]: 'Estornada',
} as const;

const METODO_LABEL: Record<MetodoPagamento, string> = {
  [MetodoPagamento.BOLETO]: 'Boleto',
  [MetodoPagamento.PIX]: 'PIX',
  [MetodoPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
  [MetodoPagamento.DINHEIRO]: 'Dinheiro',
};

export function DetalhesFaturaModal({
  aberto,
  onFechar,
  fatura,
  onBaixarManual,
  onCancelarFatura,
}: DetalhesFaturaModalProps) {
  const { data: usuarioLogado } = useUsuarioLogado();
  const baixarPdf = useBaixarPdfBoleto();
  const [reenvioAberto, setReenvioAberto] = useState(false);

  if (!fatura) {
    return (
      <Modal aberto={aberto} onFechar={onFechar} titulo="Fatura">
        <p className="text-sm text-slate-400">Carregando...</p>
      </Modal>
    );
  }

  const podeBaixar =
    fatura.status === StatusFatura.PENDENTE ||
    fatura.status === StatusFatura.VENCIDO;
  const podeCancelar = podeBaixar; // mesma condição: pendentes ou vencidas
  const isAdmin = usuarioLogado?.perfil === PerfilUsuario.ADMIN;
  const podeReenviar = isAdmin && podeBaixar;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={`Fatura ${fatura.numero}`}
      descricao={`Boleto + PIX • ${fatura.cliente?.razaoSocial ?? ''}`}
      tamanho="lg"
      acoesCabecalho={
        <>
          {podeReenviar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReenvioAberto(true)}
            >
              <Send className="h-4 w-4" />
              Reenviar boleto
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={baixarPdf.isPending}
            onClick={() => baixarPdf.mutate(fatura.id)}
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </>
      }
      rodape={
        <>
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          {podeCancelar && (
            <Button variant="danger" onClick={onCancelarFatura}>
              Cancelar fatura
            </Button>
          )}
          {podeBaixar && (
            <Button onClick={onBaixarManual}>Dar baixa manual</Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Cabeçalho com valor + status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Valor
            </p>
            <p className="text-2xl font-semibold text-slate-100">
              {formatCurrency(fatura.valor)}
            </p>
            {fatura.valorPago !== undefined && (
              <p className="text-xs text-emerald-300">
                Pago: {formatCurrency(fatura.valorPago)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tom={STATUS_TOM[fatura.status]}>
              {STATUS_LABEL[fatura.status]}
            </Badge>
            {fatura.pagamento && (
              <span className="text-xs text-slate-400">
                Pago via{' '}
                <strong className="text-slate-200">
                  {METODO_LABEL[fatura.pagamento.metodo]}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Dados do cliente / pedido */}
        <dl className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Cliente
            </dt>
            <dd className="text-sm text-slate-200">
              {fatura.cliente?.razaoSocial}
            </dd>
            <dd className="font-mono text-xs text-slate-500">
              {formatCNPJ(fatura.cliente?.cnpj ?? '')}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Pedido
            </dt>
            <dd className="text-sm text-slate-200">{fatura.pedidoId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Emissão
            </dt>
            <dd className="text-sm text-slate-200">
              {formatDate(fatura.dataEmissao)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Vencimento
            </dt>
            <dd className="text-sm text-slate-200">
              {formatDate(fatura.dataVencimento)}
            </dd>
          </div>
          {fatura.dataPagamento && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                Pago em
              </dt>
              <dd className="text-sm text-emerald-300">
                {formatDateTime(fatura.dataPagamento)}
              </dd>
            </div>
          )}
        </dl>

        {/* Boleto */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Banknote className="h-4 w-4 text-amber-300" />
            Boleto Febraban
          </h3>
          <BoletoBarcode codigo={fatura.boleto.codigoBarras} />
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Linha digitável
            </p>
            <p className="mt-1 break-all font-mono text-sm text-slate-100">
              {fatura.boleto.linhaDigitavel}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CopyButton
                valor={fatura.boleto.linhaDigitavel.replace(/\D/g, '')}
                rotulo="Copiar linha digitável"
              />
              <span className="text-xs text-slate-500">
                Nosso número: {fatura.boleto.nossoNumero}
              </span>
            </div>
          </div>
        </section>

        {/* PIX */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <QrCode className="h-4 w-4 text-emerald-300" />
            PIX estático
          </h3>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <PixQrCode valor={fatura.pix.copiaECola} tamanho={180} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Copia e Cola
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-200">
                  {fatura.pix.copiaECola}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton
                  valor={fatura.pix.copiaECola}
                  rotulo="Copiar Copia e Cola"
                />
                <span className="text-xs text-slate-500">
                  txid: {fatura.pix.txid}
                </span>
              </div>
            </div>
          </div>
        </section>

        {fatura.status === StatusFatura.CANCELADO && fatura.motivoCancelamento && (
          <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-200">
            <p className="font-semibold uppercase tracking-wider">
              Motivo do cancelamento (Febraban)
            </p>
            <p className="mt-1 text-rose-100">{fatura.motivoCancelamento}</p>
          </div>
        )}

        {fatura.observacoes && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
            <p className="font-semibold uppercase tracking-wider text-slate-500">
              Observações
            </p>
            <p className="mt-1">{fatura.observacoes}</p>
          </div>
        )}
      </div>

      {reenvioAberto && (
        <ReenviarBoletoModal
          onFechar={() => setReenvioAberto(false)}
          fatura={fatura}
        />
      )}
    </Modal>
  );
}
