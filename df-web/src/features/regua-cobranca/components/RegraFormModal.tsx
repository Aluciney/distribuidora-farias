import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import {
  regraSchema,
  type RegraFormValues,
} from '@/features/regua-cobranca/schemas/regua.schema';
import {
  useAtualizarRegra,
  useCriarRegra,
} from '@/features/regua-cobranca/hooks/useRegua';
import { CanalNotificacao, GatilhoRegua, type RegraCobranca } from '@/types';
import { cn } from '@/lib/cn';

interface RegraFormModalProps {
  aberto: boolean;
  onFechar: () => void;
  regra?: RegraCobranca;
}

const PLACEHOLDERS: { token: string; descricao: string }[] = [
  { token: '{{cliente}}', descricao: 'Razão social do cliente' },
  { token: '{{numero}}', descricao: 'Número da fatura' },
  { token: '{{valor}}', descricao: 'Valor formatado em R$' },
  { token: '{{vencimento}}', descricao: 'Data de vencimento (dd/mm/aaaa)' },
  { token: '{{linha}}', descricao: 'Linha digitável do boleto' },
  { token: '{{pix}}', descricao: 'PIX Copia e Cola' },
];

const VALORES_PADRAO: RegraFormValues = {
  nome: '',
  descricao: '',
  ativo: true,
  gatilho: GatilhoRegua.ANTES_VENCIMENTO,
  diasOffset: -3,
  acoes: [
    {
      canal: CanalNotificacao.EMAIL,
      assunto: '',
      mensagem: '',
    },
  ],
};

const CANAL_ICONE = {
  [CanalNotificacao.EMAIL]: Mail,
  [CanalNotificacao.WHATSAPP]: MessageCircle,
} as const;

export function RegraFormModal({
  aberto,
  onFechar,
  regra,
}: RegraFormModalProps) {
  const ehEdicao = Boolean(regra);
  const criar = useCriarRegra();
  const atualizar = useAtualizarRegra();

  const valoresIniciais = useMemo<RegraFormValues>(() => {
    if (!regra) return VALORES_PADRAO;
    return {
      nome: regra.nome,
      descricao: regra.descricao ?? '',
      ativo: regra.ativo,
      gatilho: regra.gatilho,
      diasOffset: regra.diasOffset,
      acoes: regra.acoes.map((a) => ({
        canal: a.canal,
        assunto: a.assunto ?? '',
        mensagem: a.mensagem,
      })),
    };
  }, [regra]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegraFormValues>({
    resolver: zodResolver(regraSchema),
    defaultValues: valoresIniciais,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'acoes',
  });

  const gatilho = watch('gatilho');
  const diasOffset = watch('diasOffset');

  useEffect(() => {
    if (aberto) reset(valoresIniciais);
  }, [aberto, valoresIniciais, reset]);

  // Quando o usuário muda o gatilho, ajusta diasOffset para um valor coerente.
  useEffect(() => {
    if (gatilho === GatilhoRegua.DIA_VENCIMENTO && diasOffset !== 0) {
      setValue('diasOffset', 0);
    }
    if (gatilho === GatilhoRegua.ANTES_VENCIMENTO && diasOffset >= 0) {
      setValue('diasOffset', -3);
    }
    if (gatilho === GatilhoRegua.APOS_VENCIMENTO && diasOffset <= 0) {
      setValue('diasOffset', 3);
    }
  }, [gatilho, diasOffset, setValue]);

  const onSubmit = handleSubmit(async (valores) => {
    const dados = {
      nome: valores.nome,
      descricao: valores.descricao || undefined,
      ativo: valores.ativo,
      gatilho: valores.gatilho,
      diasOffset: valores.diasOffset,
      acoes: valores.acoes.map((a) => ({
        canal: a.canal,
        assunto: a.assunto || undefined,
        mensagem: a.mensagem,
      })),
    };
    if (regra) {
      await atualizar.mutateAsync({ id: regra.id, dados });
    } else {
      await criar.mutateAsync(dados);
    }
    onFechar();
  });

  const carregando = isSubmitting || criar.isPending || atualizar.isPending;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={ehEdicao ? 'Editar regra' : 'Nova regra'}
      descricao={
        ehEdicao
          ? 'Ajuste a regra de notificação automática.'
          : 'Defina quando e como o cliente será notificado.'
      }
      tamanho="xl"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={carregando}>
            {ehEdicao ? 'Salvar alterações' : 'Criar regra'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <FormField
              label="Nome"
              htmlFor="nome"
              obrigatorio
              erro={errors.nome?.message}
              className="lg:col-span-2"
            >
              <Input
                id="nome"
                placeholder="Ex: Lembrete prévio (3 dias antes)"
                {...register('nome')}
                invalido={Boolean(errors.nome)}
              />
            </FormField>

            <FormField label="Status" htmlFor="ativo">
              <Controller
                control={control}
                name="ativo"
                render={({ field }) => (
                  <Switch
                    id="ativo"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    label={field.value ? 'Ativa' : 'Desativada'}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Descrição"
            htmlFor="descricao"
            erro={errors.descricao?.message}
          >
            <Input
              id="descricao"
              placeholder="Resumo do propósito desta regra"
              {...register('descricao')}
            />
          </FormField>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Gatilho temporal
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              label="Quando disparar"
              htmlFor="gatilho"
              obrigatorio
              erro={errors.gatilho?.message}
            >
              <Select
                id="gatilho"
                {...register('gatilho')}
                invalido={Boolean(errors.gatilho)}
              >
                <option value={GatilhoRegua.ANTES_VENCIMENTO}>
                  Antes do vencimento
                </option>
                <option value={GatilhoRegua.DIA_VENCIMENTO}>
                  No dia do vencimento
                </option>
                <option value={GatilhoRegua.APOS_VENCIMENTO}>
                  Após o vencimento
                </option>
              </Select>
            </FormField>

            <FormField
              label="Dias relativos"
              htmlFor="diasOffset"
              obrigatorio
              erro={errors.diasOffset?.message}
              ajuda={
                gatilho === GatilhoRegua.DIA_VENCIMENTO
                  ? 'Sempre 0 — disparado no próprio dia.'
                  : gatilho === GatilhoRegua.ANTES_VENCIMENTO
                    ? 'Use número negativo. Ex: -3 = 3 dias antes.'
                    : 'Use número positivo. Ex: 3 = 3 dias após.'
              }
            >
              <Input
                id="diasOffset"
                type="number"
                step="1"
                {...register('diasOffset', { valueAsNumber: true })}
                invalido={Boolean(errors.diasOffset)}
                disabled={gatilho === GatilhoRegua.DIA_VENCIMENTO}
              />
            </FormField>

            <div className="flex items-end">
              <p className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                {resumirGatilho(gatilho, diasOffset)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Ações disparadas
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  canal: CanalNotificacao.EMAIL,
                  assunto: '',
                  mensagem: '',
                })
              }
              disabled={fields.length >= 5}
            >
              <Plus className="h-3 w-3" />
              Adicionar ação
            </Button>
          </div>
          {errors.acoes?.message && (
            <p className="text-xs text-rose-400">{errors.acoes.message}</p>
          )}

          <ul className="space-y-3">
            {fields.map((field, index) => {
              const canalAtual = watch(`acoes.${index}.canal`);
              const Icone = CANAL_ICONE[canalAtual] ?? Mail;
              return (
                <li
                  key={field.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Icone className="h-4 w-4 text-slate-400" />
                      Ação {index + 1}
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-md p-1.5 text-rose-300 hover:bg-rose-500/10"
                        aria-label="Remover ação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      label="Canal"
                      htmlFor={`canal-${index}`}
                      obrigatorio
                      erro={errors.acoes?.[index]?.canal?.message}
                    >
                      <Select
                        id={`canal-${index}`}
                        {...register(`acoes.${index}.canal`)}
                        invalido={Boolean(errors.acoes?.[index]?.canal)}
                      >
                        <option value={CanalNotificacao.EMAIL}>Email</option>
                        <option value={CanalNotificacao.WHATSAPP}>
                          WhatsApp
                        </option>
                      </Select>
                    </FormField>

                    {canalAtual === CanalNotificacao.EMAIL && (
                      <FormField
                        label="Assunto"
                        htmlFor={`assunto-${index}`}
                        obrigatorio
                        erro={errors.acoes?.[index]?.assunto?.message}
                      >
                        <Input
                          id={`assunto-${index}`}
                          placeholder="Sua fatura {{numero}} vence em..."
                          {...register(`acoes.${index}.assunto`)}
                          invalido={Boolean(errors.acoes?.[index]?.assunto)}
                        />
                      </FormField>
                    )}
                  </div>

                  <FormField
                    label="Mensagem"
                    htmlFor={`mensagem-${index}`}
                    obrigatorio
                    erro={errors.acoes?.[index]?.mensagem?.message}
                    className="mt-3"
                  >
                    <Textarea
                      id={`mensagem-${index}`}
                      rows={4}
                      placeholder="Olá {{cliente}}, sua fatura {{numero}}..."
                      {...register(`acoes.${index}.mensagem`)}
                      invalido={Boolean(errors.acoes?.[index]?.mensagem)}
                    />
                  </FormField>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Variáveis disponíveis
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Os placeholders abaixo são substituídos automaticamente no momento
            do disparo:
          </p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <span
                key={p.token}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs',
                )}
                title={p.descricao}
              >
                <code className="font-mono text-emerald-300">{p.token}</code>
                <span className="text-slate-500">{p.descricao}</span>
              </span>
            ))}
          </div>
        </section>
      </form>
    </Modal>
  );
}

function resumirGatilho(gatilho: GatilhoRegua, dias: number): string {
  if (gatilho === GatilhoRegua.DIA_VENCIMENTO) {
    return 'Disparado no dia exato do vencimento.';
  }
  const valor = Math.abs(dias);
  if (gatilho === GatilhoRegua.ANTES_VENCIMENTO) {
    return `Disparado ${valor} dia${valor === 1 ? '' : 's'} antes do vencimento.`;
  }
  return `Disparado ${valor} dia${valor === 1 ? '' : 's'} após o vencimento.`;
}
