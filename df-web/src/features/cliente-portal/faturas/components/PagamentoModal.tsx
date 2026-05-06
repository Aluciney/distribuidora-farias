import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Banknote, CreditCard, Download, QrCode } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BoletoBarcode } from '@/components/ui/BoletoBarcode';
import { CopyButton } from '@/components/ui/CopyButton';
import { PixQrCode } from '@/components/ui/PixQrCode';
import { CartaoForm } from '@/features/cliente-portal/faturas/components/CartaoForm';
import { FaturaImprimivel } from '@/features/cobrancas/components/FaturaImprimivel';
import { MetodoPagamento, StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/cn';

interface PagamentoModalProps {
  aberto: boolean;
  onFechar: () => void;
  fatura: Fatura | null;
}

type Aba = 'BOLETO' | 'PIX' | 'CARTAO';

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

export function PagamentoModal({
  aberto,
  onFechar,
  fatura,
}: PagamentoModalProps) {
  const [aba, setAba] = useState<Aba>('BOLETO');
  const printRef = useRef<HTMLDivElement>(null);
  const imprimir = useReactToPrint({
    contentRef: printRef,
    documentTitle: fatura ? `Fatura-${fatura.numero}` : 'Fatura',
  });

  useEffect(() => {
    if (aberto) setAba('BOLETO');
  }, [aberto]);

  if (!fatura) {
    return (
      <Modal aberto={aberto} onFechar={onFechar} titulo="Fatura">
        <p className="text-sm text-slate-400">Carregando...</p>
      </Modal>
    );
  }

  const podePagar =
    fatura.status === StatusFatura.PENDENTE ||
    fatura.status === StatusFatura.VENCIDO;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={`Fatura ${fatura.numero}`}
      descricao={
        podePagar
          ? 'Escolha a forma de pagamento de sua preferência.'
          : `Status atual: ${STATUS_LABEL[fatura.status]}`
      }
      tamanho="lg"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          <Button variant="outline" onClick={() => imprimir()}>
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Resumo */}
        <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Valor
            </p>
            <p className="text-2xl font-semibold text-slate-100">
              {formatCurrency(fatura.valor)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Vencimento: {formatDate(fatura.dataVencimento)}
            </p>
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

        {/* Confirmação visual quando paga */}
        {fatura.status === StatusFatura.PAGO && (
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            <p className="font-semibold">Pagamento confirmado</p>
            {fatura.dataPagamento && (
              <p className="text-xs text-emerald-200/80">
                em {formatDateTime(fatura.dataPagamento)}
              </p>
            )}
            {fatura.pagamento?.cartao && (
              <p className="mt-1 text-xs">
                Cartão {fatura.pagamento.cartao.bandeira} final{' '}
                {fatura.pagamento.cartao.ultimosDigitos} —{' '}
                {fatura.pagamento.cartao.parcelas}x
              </p>
            )}
          </div>
        )}

        {/* Cancelada */}
        {fatura.status === StatusFatura.CANCELADO && (
          <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 p-4 text-sm text-rose-200">
            <p className="font-semibold">Esta fatura foi cancelada.</p>
            {fatura.motivoCancelamento && (
              <p className="mt-1 text-xs">{fatura.motivoCancelamento}</p>
            )}
          </div>
        )}

        {/* Tabs de pagamento — só quando há algo a pagar */}
        {podePagar && (
          <>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
              <TabButton
                ativo={aba === 'BOLETO'}
                icone={<Banknote className="h-3.5 w-3.5" />}
                onClick={() => setAba('BOLETO')}
              >
                Boleto
              </TabButton>
              <TabButton
                ativo={aba === 'PIX'}
                icone={<QrCode className="h-3.5 w-3.5" />}
                onClick={() => setAba('PIX')}
              >
                PIX
              </TabButton>
              <TabButton
                ativo={aba === 'CARTAO'}
                icone={<CreditCard className="h-3.5 w-3.5" />}
                onClick={() => setAba('CARTAO')}
              >
                Cartão
              </TabButton>
            </div>

            {aba === 'BOLETO' && (
              <section className="space-y-3">
                <BoletoBarcode codigo={fatura.boleto.codigoBarras} />
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Linha digitável
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-100">
                    {fatura.boleto.linhaDigitavel}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <CopyButton
                      valor={fatura.boleto.linhaDigitavel.replace(/\D/g, '')}
                      rotulo="Copiar linha digitável"
                    />
                    <span className="text-xs text-slate-500">
                      Nosso número: {fatura.boleto.nossoNumero}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Cole a linha digitável ou escaneie o código de barras no app
                  do seu banco. A confirmação pode levar até 2 dias úteis.
                </p>
              </section>
            )}

            {aba === 'PIX' && (
              <section className="flex flex-col items-start gap-4 sm:flex-row">
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
                  <CopyButton
                    valor={fatura.pix.copiaECola}
                    rotulo="Copiar Copia e Cola"
                  />
                  <p className="text-xs text-slate-500">
                    Pague via PIX para confirmação instantânea. Use o app do seu
                    banco e leia o QR ou cole o código.
                  </p>
                </div>
              </section>
            )}

            {aba === 'CARTAO' && (
              <CartaoForm fatura={fatura} onPagamentoConfirmado={onFechar} />
            )}
          </>
        )}
      </div>

      {/* Versão imprimível: off-screen no fluxo normal, ativada pelo react-to-print. */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }} aria-hidden>
        <FaturaImprimivel ref={printRef} fatura={fatura} />
      </div>
    </Modal>
  );
}

interface TabButtonProps {
  ativo: boolean;
  icone: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}

function TabButton({ ativo, icone, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        ativo
          ? 'bg-emerald-500/10 text-emerald-300'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
      )}
    >
      {icone}
      {children}
    </button>
  );
}
