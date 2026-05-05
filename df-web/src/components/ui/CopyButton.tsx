import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toast.store';

interface CopyButtonProps {
  /** Texto que será copiado para a área de transferência. */
  valor: string;
  rotulo?: string;
  className?: string;
  /** Mensagem opcional do toast no sucesso. Por padrão usa o rótulo. */
  mensagemSucesso?: string;
}

export function CopyButton({
  valor,
  rotulo = 'Copiar',
  className,
  mensagemSucesso,
}: CopyButtonProps) {
  const [copiado, setCopiado] = useState(false);

  const onCopiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      toast.sucesso(mensagemSucesso ?? `${rotulo} copiado`);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast.erro('Não foi possível copiar', 'Permissão negada pelo navegador.');
    }
  };

  return (
    <button
      type="button"
      onClick={onCopiar}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
        copiado
          ? 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300'
          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800',
        className,
      )}
    >
      {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copiado ? 'Copiado' : rotulo}
    </button>
  );
}
