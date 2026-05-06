import Barcode from 'react-barcode';

interface BoletoBarcodeProps {
  /** Código de barras Febraban: 44 dígitos numéricos, formato Interleaved 2 of 5. */
  codigo: string;
  altura?: number;
  /** Largura de cada barra (em px). Padrão 1.6 cabe bem em modais. */
  larguraBarra?: number;
}

/**
 * Renderiza o código de barras Febraban (44 dígitos) em ITF — o formato
 * lido pelos leitores de boleto bancário.
 */
export function BoletoBarcode({ codigo, altura = 70, larguraBarra = 1.6 }: BoletoBarcodeProps) {
  // ITF exige número par de dígitos. O Febraban (44) já é par, mas blindamos.
  const valor = codigo.replace(/\D/g, '')
  const valorAjustado = valor.length % 2 === 0 ? valor : `0${valor}`

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-white p-3">
      <Barcode
        value={valorAjustado}
        format="ITF"
        height={altura}
        width={larguraBarra}
        displayValue={false}
        margin={0}
        background="#ffffff"
        lineColor="#0f172a"
      />
    </div>
  );
}
