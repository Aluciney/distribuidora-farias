import { QRCodeSVG } from 'qrcode.react';

interface PixQrCodeProps {
  /** Conteúdo a ser codificado — para PIX, use o BR Code "Copia e Cola". */
  valor: string;
  tamanho?: number;
}

/**
 * QR Code real (escaneável) usado para PIX. Encoda o BR Code direto;
 * o nível de correção `M` é o recomendado pelo BCB para QR estático/dinâmico.
 */
export function PixQrCode({ valor, tamanho = 192 }: PixQrCodeProps) {
  return (
    <div
      className="rounded-lg border border-slate-700 bg-white p-3"
      style={{ width: tamanho + 24 }}
      role="img"
      aria-label="QR Code do PIX"
    >
      <QRCodeSVG
        value={valor}
        size={tamanho}
        level="M"
        marginSize={0}
        bgColor="#ffffff"
        fgColor="#0f172a"
      />
    </div>
  );
}
