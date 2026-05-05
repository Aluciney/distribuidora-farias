import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import {
  cartaoSchema,
  type CartaoFormValues,
} from '@/features/cliente-portal/faturas/schemas/cartao.schema';
import {
  detectarBandeira,
  maskNumeroCartao,
  maskValidade,
} from '@/utils/cartao';
import { usePagarComCartao } from '@/features/cobrancas/hooks/useCobrancas';
import type { Fatura } from '@/types';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/cn';

interface CartaoFormProps {
  fatura: Fatura;
  onPagamentoConfirmado: () => void;
}

const VALORES_PADRAO: CartaoFormValues = {
  numero: '',
  nomeImpresso: '',
  validade: '',
  cvv: '',
  parcelas: 1,
};

export function CartaoForm({ fatura, onPagamentoConfirmado }: CartaoFormProps) {
  const pagar = usePagarComCartao();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CartaoFormValues>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: VALORES_PADRAO,
  });

  const numeroAtual = watch('numero');
  const bandeira = detectarBandeira(numeroAtual ?? '');

  const onSubmit = handleSubmit(async (valores) => {
    if (!bandeira) return;
    await pagar.mutateAsync({
      id: fatura.id,
      payload: {
        numero: valores.numero,
        bandeira,
        parcelas: valores.parcelas,
      },
    });
    onPagamentoConfirmado();
  });

  const carregando = isSubmitting || pagar.isPending;
  const valorPorParcela = (parcelas: number) => fatura.valor / parcelas;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-sky-900/60 bg-sky-950/30 p-3 text-sm text-sky-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <p>
          Os dados do cartão são enviados criptografados ao gateway de
          pagamento. Nenhum dado sensível é armazenado nos servidores da
          Distribuidora Farias.
        </p>
      </div>

      <FormField
        label="Número do cartão"
        htmlFor="numero"
        obrigatorio
        erro={errors.numero?.message}
      >
        <Controller
          control={control}
          name="numero"
          render={({ field }) => (
            <Input
              id="numero"
              placeholder="0000 0000 0000 0000"
              value={maskNumeroCartao(field.value ?? '')}
              onChange={(e) => field.onChange(maskNumeroCartao(e.target.value))}
              invalido={Boolean(errors.numero)}
              inputMode="numeric"
              autoComplete="cc-number"
              iconeEsquerda={<CreditCard className="h-4 w-4" />}
              iconeDireita={
                bandeira && (
                  <span className="text-xs font-medium text-slate-200">
                    {bandeira}
                  </span>
                )
              }
            />
          )}
        />
      </FormField>

      <FormField
        label="Nome impresso no cartão"
        htmlFor="nomeImpresso"
        obrigatorio
        erro={errors.nomeImpresso?.message}
      >
        <Input
          id="nomeImpresso"
          placeholder="MARIA D ALMEIDA"
          {...register('nomeImpresso')}
          invalido={Boolean(errors.nomeImpresso)}
          autoComplete="cc-name"
          className="uppercase"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="Validade (MM/AA)"
          htmlFor="validade"
          obrigatorio
          erro={errors.validade?.message}
        >
          <Controller
            control={control}
            name="validade"
            render={({ field }) => (
              <Input
                id="validade"
                placeholder="12/30"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(maskValidade(e.target.value))}
                invalido={Boolean(errors.validade)}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
            )}
          />
        </FormField>

        <FormField
          label="CVV"
          htmlFor="cvv"
          obrigatorio
          erro={errors.cvv?.message}
        >
          <Input
            id="cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="000"
            maxLength={4}
            {...register('cvv')}
            invalido={Boolean(errors.cvv)}
          />
        </FormField>

        <FormField
          label="Parcelas"
          htmlFor="parcelas"
          obrigatorio
          erro={errors.parcelas?.message}
        >
          <Select
            id="parcelas"
            invalido={Boolean(errors.parcelas)}
            {...register('parcelas', { valueAsNumber: true })}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const n = i + 1;
              return (
                <option key={n} value={n}>
                  {n}x de {formatCurrency(Math.round(valorPorParcela(n)))} sem
                  juros
                </option>
              );
            })}
          </Select>
        </FormField>
      </div>

      <div
        className={cn(
          'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm',
        )}
      >
        <span className="text-slate-400">Total a pagar</span>
        <strong className="text-base text-slate-100">
          {formatCurrency(fatura.valor)}
        </strong>
      </div>

      <Button onClick={onSubmit} loading={carregando} className="w-full">
        Pagar agora
      </Button>
    </form>
  );
}
