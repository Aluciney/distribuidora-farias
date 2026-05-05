import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando?: boolean;
  /** "danger" pinta o botão de confirmação em vermelho (uso para ações destrutivas). */
  tom?: 'primary' | 'danger';
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  carregando,
  tom = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onCancelar}
      titulo={titulo}
      tamanho="sm"
      rodape={
        <>
          <Button variant="outline" onClick={onCancelar} disabled={carregando}>
            {textoCancelar}
          </Button>
          <Button
            variant={tom === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirmar}
            loading={carregando}
          >
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            tom === 'danger'
              ? 'flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rose-500/10 text-rose-300'
              : 'flex h-10 w-10 flex-none items-center justify-center rounded-full bg-amber-500/10 text-amber-300'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="text-sm text-slate-300">{mensagem}</div>
      </div>
    </Modal>
  );
}
