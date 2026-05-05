import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import {
  cancelarFaturaSchema,
  type CancelarFaturaFormValues,
} from '@/features/cobrancas/schemas/cobranca.schema';
import { useCancelarFatura } from '@/features/cobrancas/hooks/useCobrancas';
import type { Fatura } from '@/types';
import { formatCurrency } from '@/utils/format';

interface CancelarFaturaModalProps {
  aberto: boolean;
  onFechar: () => void;
  fatura: Fatura | null;
}

/** Códigos comuns Febraban para cancelamento (subset usado para mock). */
const MOTIVOS_FEBRABAN = [
  'Cliente solicitou cancelamento',
  'Pedido cancelado pela distribuidora',
  'Erro no valor faturado',
  'Erro na data de vencimento',
  'Duplicidade de cobrança',
  'Outros (descrever)',
];

export function CancelarFaturaModal({
  aberto,
  onFechar,
  fatura,
}: CancelarFaturaModalProps) {
  const cancelar = useCancelarFatura();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CancelarFaturaFormValues>({
    resolver: zodResolver(cancelarFaturaSchema),
    defaultValues: { motivo: '' },
  });

  useEffect(() => {
    if (aberto) reset({ motivo: '' });
  }, [aberto, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!fatura) return;
    await cancelar.mutateAsync({ id: fatura.id, motivo: valores.motivo });
    onFechar();
  });

  const carregando = isSubmitting || cancelar.isPending;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Cancelar fatura (Boleto + PIX)"
      descricao={
        fatura
          ? `${fatura.numero} • ${formatCurrency(fatura.valor)}`
          : undefined
      }
      tamanho="md"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Voltar
          </Button>
          <Button variant="danger" onClick={onSubmit} loading={carregando}>
            Cancelar fatura
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <p>
            O cancelamento será registrado conforme o padrão Febraban e
            invalidará tanto o boleto quanto o PIX desta fatura. A operação
            não pode ser desfeita.
          </p>
        </div>

        <FormField label="Motivo padrão" htmlFor="motivoPadrao">
          <Select
            id="motivoPadrao"
            onChange={(e) => {
              if (e.target.value) {
                setValue('motivo', e.target.value, { shouldValidate: true });
              }
            }}
            defaultValue=""
          >
            <option value="">Selecione um motivo predefinido</option>
            {MOTIVOS_FEBRABAN.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </FormField>

        <form onSubmit={onSubmit}>
          <FormField
            label="Descrição do motivo"
            htmlFor="motivo"
            obrigatorio
            erro={errors.motivo?.message}
            ajuda="Será arquivado na trilha de auditoria da fatura."
          >
            <Textarea
              id="motivo"
              rows={3}
              placeholder="Descreva o motivo do cancelamento"
              invalido={Boolean(errors.motivo)}
              {...register('motivo')}
            />
          </FormField>
        </form>
      </div>
    </Modal>
  );
}
