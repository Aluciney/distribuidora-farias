import Barcode from 'react-barcode';

interface BoletoBarcodeProps {
  /** Código de barras Febraban: 44 dígitos numéricos, formato Interleaved 2 of 5. */
  codigo: string;
  altura?: number;
}

/**
 * Renderiza o código de barras Febraban (44 dígitos) em ITF — o formato
 * lido pelos leitores de boleto bancário. O SVG ocupa 100% da largura do
 * container para não exigir scroll horizontal.
 */
export function BoletoBarcode({ codigo, altura = 70 }: BoletoBarcodeProps) {
  // ITF exige número par de dígitos. O Febraban (44) já é par, mas blindamos.
  const valor = codigo.replace(/\D/g, '');
  const valorAjustado = valor.length % 2 === 0 ? valor : `0${valor}`;

  return (
    <div className="rounded-lg border border-slate-700 bg-white p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full">
      <Barcode
        value={valorAjustado}
        format="ITF"
        renderer="svg"
        height={altura}
        width={2}
        displayValue={false}
        margin={0}
        background="#ffffff"
        lineColor="#0f172a"
      />
    </div>
  );
}
