import { Construction } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';

interface PlaceholderProps {
  titulo: string;
  descricao?: string;
}

/** Placeholder genérico para módulos ainda não implementados nesta primeira entrega. */
export function Placeholder({ titulo, descricao }: PlaceholderProps) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">{titulo}</h2>
        {descricao && (
          <p className="mt-1 text-sm text-slate-400">{descricao}</p>
        )}
      </header>
      <Card>
        <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Construction className="h-10 w-10 text-amber-400" />
          <p className="text-sm text-slate-400">
            Módulo será entregue na próxima iteração.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
