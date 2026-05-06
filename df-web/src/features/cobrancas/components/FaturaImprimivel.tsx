import { forwardRef } from 'react';
import { BoletoBarcode } from '@/components/ui/BoletoBarcode';
import { PixQrCode } from '@/components/ui/PixQrCode';
import { type Fatura, StatusFatura } from '@/types';
import { formatCNPJ, formatCurrency, formatDate } from '@/utils/format';

interface FaturaImprimivelProps {
  fatura: Fatura;
}

const STATUS_LABEL: Record<StatusFatura, string> = {
  [StatusFatura.PAGO]: 'PAGA',
  [StatusFatura.PENDENTE]: 'PENDENTE',
  [StatusFatura.VENCIDO]: 'VENCIDA',
  [StatusFatura.CANCELADO]: 'CANCELADA',
  [StatusFatura.ESTORNADO]: 'ESTORNADA',
};

/**
 * Layout A4 da fatura para impressão / "Salvar como PDF" do navegador.
 * Renderizado off-screen e referenciado pelo `react-to-print`.
 */
export const FaturaImprimivel = forwardRef<HTMLDivElement, FaturaImprimivelProps>(
  function FaturaImprimivel({ fatura }, ref) {
    const cliente = fatura.cliente;
    return (
      <div
        ref={ref}
        className="fatura-imprimivel"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '18mm 16mm',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif',
          fontSize: 11,
          lineHeight: 1.4,
          boxSizing: 'border-box',
        }}
      >
        <style>{`
          @page { size: A4; margin: 0; }
          @media print {
            html, body { background: #fff !important; }
            .fatura-imprimivel { box-shadow: none !important; }
          }
          .fi-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
          .fi-section { margin-top: 16px; }
          .fi-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
          .fi-value { font-size: 12px; color: #0f172a; }
          .fi-value-strong { font-size: 13px; font-weight: 600; color: #0f172a; }
          .fi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
          .fi-mono { font-family: ui-monospace, "Courier New", monospace; word-break: break-all; }
          .fi-divider { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
          .fi-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .fi-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .fi-status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .fi-status-PAGO    { background: #dcfce7; color: #166534; }
          .fi-status-PENDENTE { background: #fef3c7; color: #92400e; }
          .fi-status-VENCIDO  { background: #fee2e2; color: #991b1b; }
          .fi-status-CANCELADO,
          .fi-status-ESTORNADO { background: #e2e8f0; color: #475569; }
        `}</style>

        {/* Header */}
        <div className="fi-row">
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              DF Distribuidora
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Fatura de cobrança
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="fi-label">Fatura</div>
            <div className="fi-value-strong" style={{ fontSize: 16 }}>
              {fatura.numero}
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`fi-status-badge fi-status-${fatura.status}`}>
                {STATUS_LABEL[fatura.status]}
              </span>
            </div>
          </div>
        </div>

        <hr className="fi-divider" />

        {/* Cliente */}
        <div className="fi-section">
          <div className="fi-label">Sacado / Cliente</div>
          <div className="fi-value-strong" style={{ marginTop: 4 }}>
            {cliente?.razaoSocial ?? '—'}
          </div>
          {cliente?.nomeFantasia && (
            <div className="fi-value" style={{ color: '#64748b' }}>
              {cliente.nomeFantasia}
            </div>
          )}
          <div className="fi-grid-2" style={{ marginTop: 8 }}>
            <div>
              <div className="fi-label">CNPJ</div>
              <div className="fi-mono fi-value">
                {cliente?.cnpj ? formatCNPJ(cliente.cnpj) : '—'}
              </div>
            </div>
            <div>
              <div className="fi-label">Contato</div>
              <div className="fi-value">{cliente?.email ?? '—'}</div>
              <div className="fi-value">{cliente?.telefone ?? ''}</div>
            </div>
          </div>
        </div>

        <hr className="fi-divider" />

        {/* Resumo financeiro */}
        <div className="fi-grid-4 fi-section">
          <div>
            <div className="fi-label">Emissão</div>
            <div className="fi-value">{formatDate(fatura.dataEmissao)}</div>
          </div>
          <div>
            <div className="fi-label">Vencimento</div>
            <div className="fi-value-strong">{formatDate(fatura.dataVencimento)}</div>
          </div>
          <div>
            <div className="fi-label">Valor</div>
            <div className="fi-value-strong" style={{ fontSize: 14 }}>
              {formatCurrency(fatura.valor)}
            </div>
          </div>
          <div>
            <div className="fi-label">Pedido</div>
            <div className="fi-mono fi-value" style={{ fontSize: 9 }}>
              {fatura.pedidoId.slice(0, 8)}…
            </div>
          </div>
        </div>

        <hr className="fi-divider" />

        {/* Boleto */}
        <div className="fi-section">
          <div className="fi-label">Boleto bancário</div>
          <div style={{ marginTop: 8 }}>
            <BoletoBarcode codigo={fatura.boleto.codigoBarras} altura={56} />
          </div>
          <div className="fi-card" style={{ marginTop: 8 }}>
            <div className="fi-label">Linha digitável</div>
            <div className="fi-mono fi-value" style={{ marginTop: 3 }}>
              {fatura.boleto.linhaDigitavel}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', marginTop: 6 }}>
              Nosso número: {fatura.boleto.nossoNumero}
            </div>
          </div>
        </div>

        {/* PIX */}
        <div className="fi-section">
          <div className="fi-label">Pagamento via PIX</div>
          <div className="fi-row" style={{ marginTop: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto' }}>
              <PixQrCode valor={fatura.pix.copiaECola} tamanho={140} />
            </div>
            <div className="fi-card" style={{ flex: 1 }}>
              <div className="fi-label">PIX Copia e Cola</div>
              <div className="fi-mono" style={{ fontSize: 8, marginTop: 3 }}>
                {fatura.pix.copiaECola}
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 6 }}>
                txid: {fatura.pix.txid}
              </div>
            </div>
          </div>
        </div>

        {fatura.observacoes && (
          <>
            <hr className="fi-divider" />
            <div>
              <div className="fi-label">Observações</div>
              <div className="fi-value" style={{ marginTop: 4 }}>
                {fatura.observacoes}
              </div>
            </div>
          </>
        )}

        {fatura.motivoCancelamento && (
          <>
            <hr className="fi-divider" />
            <div>
              <div className="fi-label">Motivo do cancelamento</div>
              <div className="fi-value" style={{ marginTop: 4, color: '#991b1b' }}>
                {fatura.motivoCancelamento}
              </div>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 24,
            fontSize: 9,
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          Documento gerado em {formatDate(new Date().toISOString())}
        </div>
      </div>
    );
  },
);
