import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import {
  baixaManualSchema,
  type BaixaManualFormValues,
} from '@/features/cobrancas/schemas/cobranca.schema';
import { useBaixarManual } from '@/features/cobrancas/hooks/useCobrancas';
import { MetodoPagamento, type Fatura } from '@/types';
import { formatCurrency } from '@/utils/format';

interface BaixaManualModalProps {
  aberto: boolean;
  onFechar: () => void;
  fatura: Fatura | null;
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BaixaManualModal({
  aberto,
  onFechar,
  fatura,
}: BaixaManualModalProps) {
  const baixar = useBaixarManual();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaixaManualFormValues>({
    resolver: zodResolver(baixaManualSchema),
    defaultValues: {
      dataPagamento: hojeISO(),
      metodoPago: MetodoPagamento.BOLETO,
      observacoes: '',
    },
  });

  useEffect(() => {
    if (aberto) {
      reset({
        dataPagamento: hojeISO(),
        metodoPago: MetodoPagamento.BOLETO,
        observacoes: '',
      });
    }
  }, [aberto, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!fatura) return;
    await baixar.mutateAsync({
      id: fatura.id,
      payload: {
        dataPagamento: new Date(valores.dataPagamento).toISOString(),
        metodoPago: valores.metodoPago,
        observacoes: valores.observacoes || undefined,
      },
    });
    onFechar();
  });

  const carregando = isSubmitting || baixar.isPending;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Dar baixa manual"
      descricao={
        fatura
          ? `${fatura.numero} • ${formatCurrency(fatura.valor)}`
          : undefined
      }
      tamanho="md"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={carregando}>
            Confirmar baixa
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-400">
          Marcar a fatura como paga manualmente. Use esta opção quando o
          recebimento foi confirmado fora do gateway.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Forma de pagamento"
            htmlFor="metodoPago"
            obrigatorio
            erro={errors.metodoPago?.message}
          >
            <Select
              id="metodoPago"
              {...register('metodoPago')}
              invalido={Boolean(errors.metodoPago)}
            >
              <option value={MetodoPagamento.BOLETO}>Boleto</option>
              <option value={MetodoPagamento.PIX}>PIX</option>
              <option value={MetodoPagamento.CARTAO_CREDITO}>
                Cartão de Crédito
              </option>
              <option value={MetodoPagamento.DINHEIRO}>Dinheiro</option>
            </Select>
          </FormField>

          <FormField
            label="Data do pagamento"
            htmlFor="dataPagamento"
            obrigatorio
            erro={errors.dataPagamento?.message}
          >
            <Input
              id="dataPagamento"
              type="date"
              invalido={Boolean(errors.dataPagamento)}
              {...register('dataPagamento')}
            />
          </FormField>
        </div>

        <FormField
          label="Observações"
          htmlFor="observacoes"
          erro={errors.observacoes?.message}
          ajuda="Ex: PIX recebido em conta secundária, comprovante anexado."
        >
          <Textarea
            id="observacoes"
            rows={3}
            placeholder="Detalhes da conciliação"
            {...register('observacoes')}
          />
        </FormField>
      </form>
    </Modal>
  );
}
