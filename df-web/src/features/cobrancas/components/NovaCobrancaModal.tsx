import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, QrCode, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { usePedidosFaturaveis } from '@/features/cobrancas/hooks/usePedidos';
import { useCriarCobranca } from '@/features/cobrancas/hooks/useCobrancas';
import {
  novaCobrancaSchema,
  type NovaCobrancaFormValues,
} from '@/features/cobrancas/schemas/cobranca.schema';
import {
  configuracoesProntas,
  useConfiguracoesStore,
} from '@/features/configuracoes/store/configuracoes.store';
import { formatCurrency, formatCNPJ } from '@/utils/format';

interface NovaCobrancaModalProps {
  aberto: boolean;
  onFechar: () => void;
}

function dataPadraoVencimento(): string {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + 7);
  return hoje.toISOString().slice(0, 10);
}

export function NovaCobrancaModal({ aberto, onFechar }: NovaCobrancaModalProps) {
  const { data: pedidos, isLoading: pedidosLoading } = usePedidosFaturaveis();
  const criar = useCriarCobranca();
  const config = useConfiguracoesStore((s) => s.config);
  const configOk = configuracoesProntas(config);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NovaCobrancaFormValues>({
    resolver: zodResolver(novaCobrancaSchema),
    defaultValues: {
      pedidoId: '',
      valor: 0,
      dataVencimento: dataPadraoVencimento(),
      observacoes: '',
    },
  });

  const pedidoIdSelecionado = watch('pedidoId');
  const pedidoSelecionado = useMemo(
    () => pedidos?.find((p) => p.id === pedidoIdSelecionado),
    [pedidos, pedidoIdSelecionado],
  );

  useEffect(() => {
    if (pedidoSelecionado) {
      setValue('valor', pedidoSelecionado.valorTotal / 100, {
        shouldValidate: true,
      });
    }
  }, [pedidoSelecionado, setValue]);

  useEffect(() => {
    if (aberto) {
      reset({
        pedidoId: '',
        valor: 0,
        dataVencimento: dataPadraoVencimento(),
        observacoes: '',
      });
    }
  }, [aberto, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!pedidoSelecionado) return;
    await criar.mutateAsync({
      pedidoId: valores.pedidoId,
      clienteId: pedidoSelecionado.clienteId,
      valor: Math.round(valores.valor * 100),
      dataVencimento: new Date(valores.dataVencimento).toISOString(),
      observacoes: valores.observacoes || undefined,
    });
    onFechar();
  });

  const carregando = isSubmitting || criar.isPending;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Nova cobrança"
      descricao="Toda cobrança gera Boleto Febraban e PIX simultaneamente."
      tamanho="lg"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={carregando} disabled={!configOk}>
            Gerar Boleto + PIX
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {!configOk && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <Settings2 className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Preencha os dados bancários e a chave PIX antes de gerar
                cobranças.
              </span>
            </div>
            <Link
              to="/admin/configuracoes"
              onClick={onFechar}
              className="rounded-md border border-amber-700/60 px-2.5 py-1 text-xs hover:bg-amber-500/10"
            >
              Configurar
            </Link>
          </div>
        )}

        <FormField
          label="Pedido"
          htmlFor="pedidoId"
          obrigatorio
          erro={errors.pedidoId?.message}
          ajuda="Apenas pedidos faturáveis (abertos ou faturados) são listados."
        >
          <Select
            id="pedidoId"
            disabled={pedidosLoading}
            invalido={Boolean(errors.pedidoId)}
            {...register('pedidoId')}
          >
            <option value="">
              {pedidosLoading ? 'Carregando pedidos...' : 'Selecione um pedido'}
            </option>
            {pedidos?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero} — {p.cliente?.razaoSocial} (
                {formatCurrency(p.valorTotal)})
              </option>
            ))}
          </Select>
        </FormField>

        {pedidoSelecionado && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
            <p>
              <span className="text-slate-500">Cliente:</span>{' '}
              <span className="text-slate-200">
                {pedidoSelecionado.cliente?.razaoSocial}
              </span>
            </p>
            <p>
              <span className="text-slate-500">CNPJ:</span>{' '}
              <span className="font-mono">
                {formatCNPJ(pedidoSelecionado.cliente?.cnpj ?? '')}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Itens:</span>{' '}
              {pedidoSelecionado.itens.length} —{' '}
              <span className="text-slate-300">
                {formatCurrency(pedidoSelecionado.valorTotal)}
              </span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-amber-200">
            <Banknote className="h-4 w-4" />
            <span>Boleto Febraban (linha digitável)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <QrCode className="h-4 w-4" />
            <span>PIX estático (Copia e Cola + QR)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Valor (R$)"
            htmlFor="valor"
            obrigatorio
            erro={errors.valor?.message}
          >
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              invalido={Boolean(errors.valor)}
              {...register('valor', { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="Data de vencimento"
            htmlFor="dataVencimento"
            obrigatorio
            erro={errors.dataVencimento?.message}
          >
            <Input
              id="dataVencimento"
              type="date"
              invalido={Boolean(errors.dataVencimento)}
              {...register('dataVencimento')}
            />
          </FormField>
        </div>

        <FormField
          label="Observações"
          htmlFor="observacoes"
          erro={errors.observacoes?.message}
          ajuda="Notas internas — não aparecem para o cliente."
        >
          <Textarea
            id="observacoes"
            rows={3}
            placeholder="Ex: prazo estendido conforme alinhamento comercial"
            {...register('observacoes')}
          />
        </FormField>
      </form>
    </Modal>
  );
}
