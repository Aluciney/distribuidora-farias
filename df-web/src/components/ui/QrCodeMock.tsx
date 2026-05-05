import { useMemo } from 'react';

interface QrCodeMockProps {
  /** Dado base usado para gerar o padrão visual determinístico. */
  valor: string;
  tamanho?: number;
}

/**
 * Renderização visual mockada de um QR Code.
 * Em produção este componente será substituído pela imagem retornada
 * pela API de PIX (`dados.qrCode`). O padrão aqui é determinístico para
 * que demonstrações visuais sejam estáveis.
 */
export function QrCodeMock({ valor, tamanho = 192 }: QrCodeMockProps) {
  const matriz = useMemo(() => gerarMatriz(valor), [valor]);
  const grade = matriz.length;
  const celula = tamanho / grade;

  return (
    <div
      className="rounded-lg border border-slate-700 bg-white p-3"
      style={{ width: tamanho + 24, height: tamanho + 24 }}
      role="img"
      aria-label="QR Code do PIX"
    >
      <svg
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        width={tamanho}
        height={tamanho}
      >
        <rect x={0} y={0} width={tamanho} height={tamanho} fill="white" />
        {matriz.map((linha, y) =>
          linha.map((preenchido, x) =>
            preenchido ? (
              <rect
                key={`${x}-${y}`}
                x={x * celula}
                y={y * celula}
                width={celula}
                height={celula}
                fill="#0f172a"
              />
            ) : null,
          ),
        )}
        {/* Quinas (finder patterns) - aparência de QR real */}
        {finderPatterns(grade).map(([cx, cy], i) => (
          <g key={i}>
            <rect
              x={cx * celula}
              y={cy * celula}
              width={celula * 7}
              height={celula * 7}
              fill="white"
            />
            <rect
              x={cx * celula}
              y={cy * celula}
              width={celula * 7}
              height={celula * 7}
              fill="none"
              stroke="#0f172a"
              strokeWidth={celula}
            />
            <rect
              x={(cx + 2) * celula}
              y={(cy + 2) * celula}
              width={celula * 3}
              height={celula * 3}
              fill="#0f172a"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function finderPatterns(grade: number): [number, number][] {
  return [
    [0, 0],
    [grade - 7, 0],
    [0, grade - 7],
  ];
}

function gerarMatriz(seed: string): boolean[][] {
  const grade = 25;
  let h = 2_166_136_261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  const matriz: boolean[][] = [];
  for (let y = 0; y < grade; y++) {
    const linha: boolean[] = [];
    for (let x = 0; x < grade; x++) {
      h = Math.imul(h ^ (x * 31 + y * 17), 2_654_435_761) >>> 0;
      linha.push((h & 1) === 1);
    }
    matriz.push(linha);
  }
  return matriz;
}
