import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import {
  clienteSchema,
  type ClienteFormValues,
} from '@/features/clientes/schemas/cliente.schema';
import {
  useCriarCliente,
  useAtualizarCliente,
} from '@/features/clientes/hooks/useClientes';
import { StatusCliente, type Cliente } from '@/types';
import { maskCEP, maskCNPJ, maskTelefone } from '@/utils/cnpj';
import { cn } from '@/lib/cn';

interface ClienteFormModalProps {
  aberto: boolean;
  onFechar: () => void;
  /** Quando informado, o modal entra em modo edição. */
  cliente?: Cliente;
}

const VALORES_PADRAO: ClienteFormValues = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoEstadual: '',
  email: '',
  telefone: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  },
  status: StatusCliente.ATIVO,
  limiteCredito: 0,
  observacoes: '',
};

const STATUS_OPCOES: { valor: StatusCliente; rotulo: string }[] = [
  { valor: StatusCliente.ATIVO, rotulo: 'Ativo' },
  { valor: StatusCliente.INATIVO, rotulo: 'Inativo' },
  { valor: StatusCliente.BLOQUEADO, rotulo: 'Bloqueado' },
];

export function ClienteFormModal({
  aberto,
  onFechar,
  cliente,
}: ClienteFormModalProps) {
  const ehEdicao = Boolean(cliente);
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();

  const valoresIniciais = useMemo<ClienteFormValues>(() => {
    if (!cliente) return VALORES_PADRAO;
    return {
      cnpj: cliente.cnpj,
      razaoSocial: cliente.razaoSocial,
      nomeFantasia: cliente.nomeFantasia ?? '',
      inscricaoEstadual: cliente.inscricaoEstadual ?? '',
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      status: cliente.status,
      limiteCredito: cliente.limiteCredito / 100,
      observacoes: cliente.observacoes ?? '',
    };
  }, [cliente]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (aberto) reset(valoresIniciais);
  }, [aberto, valoresIniciais, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    const dados = {
      ...valores,
      // Limite no schema chega em reais; convertemos para centavos antes de enviar.
      limiteCredito: Math.round(valores.limiteCredito * 100),
    };
    if (cliente) {
      await atualizar.mutateAsync({ id: cliente.id, dados });
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
      titulo={ehEdicao ? 'Editar cliente' : 'Cadastrar cliente'}
      descricao={
        ehEdicao
          ? 'Atualize as informações do cliente.'
          : 'Preencha os dados para cadastrar um novo cliente.'
      }
      tamanho="xl"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={carregando}>
            {ehEdicao ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Identificação
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="CNPJ"
              htmlFor="cnpj"
              obrigatorio
              erro={errors.cnpj?.message}
            >
              <Controller
                control={control}
                name="cnpj"
                render={({ field }) => (
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={maskCNPJ(field.value ?? '')}
                    onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                    invalido={Boolean(errors.cnpj)}
                    disabled={ehEdicao}
                    inputMode="numeric"
                  />
                )}
              />
            </FormField>

            <FormField
              label="Razão Social"
              htmlFor="razaoSocial"
              obrigatorio
              erro={errors.razaoSocial?.message}
              className="sm:col-span-2"
            >
              <Input
                id="razaoSocial"
                placeholder="Empresa LTDA"
                {...register('razaoSocial')}
                invalido={Boolean(errors.razaoSocial)}
              />
            </FormField>

            <FormField
              label="Nome Fantasia"
              htmlFor="nomeFantasia"
              erro={errors.nomeFantasia?.message}
            >
              <Input
                id="nomeFantasia"
                placeholder="Nome fantasia"
                {...register('nomeFantasia')}
              />
            </FormField>

            <FormField
              label="Inscrição Estadual"
              htmlFor="inscricaoEstadual"
              erro={errors.inscricaoEstadual?.message}
            >
              <Input
                id="inscricaoEstadual"
                placeholder="000.000.000.000"
                {...register('inscricaoEstadual')}
              />
            </FormField>

            <FormField
              label="Status"
              htmlFor="status"
              obrigatorio
              erro={errors.status?.message}
            >
              <select
                id="status"
                className={cn(
                  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100',
                  'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                )}
                {...register('status')}
              >
                {STATUS_OPCOES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Contato
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Email"
              htmlFor="email"
              obrigatorio
              erro={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="financeiro@empresa.com.br"
                {...register('email')}
                invalido={Boolean(errors.email)}
              />
            </FormField>

            <FormField
              label="Telefone"
              htmlFor="telefone"
              obrigatorio
              erro={errors.telefone?.message}
            >
              <Controller
                control={control}
                name="telefone"
                render={({ field }) => (
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={maskTelefone(field.value ?? '')}
                    onChange={(e) =>
                      field.onChange(maskTelefone(e.target.value))
                    }
                    invalido={Boolean(errors.telefone)}
                    inputMode="tel"
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Endereço
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <FormField
              label="CEP"
              htmlFor="cep"
              obrigatorio
              erro={errors.endereco?.cep?.message}
              className="lg:col-span-2"
            >
              <Controller
                control={control}
                name="endereco.cep"
                render={({ field }) => (
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={maskCEP(field.value ?? '')}
                    onChange={(e) => field.onChange(maskCEP(e.target.value))}
                    invalido={Boolean(errors.endereco?.cep)}
                    inputMode="numeric"
                  />
                )}
              />
            </FormField>

            <FormField
              label="Logradouro"
              htmlFor="logradouro"
              obrigatorio
              erro={errors.endereco?.logradouro?.message}
              className="lg:col-span-3"
            >
              <Input
                id="logradouro"
                placeholder="Av. Brasil"
                {...register('endereco.logradouro')}
                invalido={Boolean(errors.endereco?.logradouro)}
              />
            </FormField>

            <FormField
              label="Número"
              htmlFor="numero"
              obrigatorio
              erro={errors.endereco?.numero?.message}
            >
              <Input
                id="numero"
                placeholder="123"
                {...register('endereco.numero')}
                invalido={Boolean(errors.endereco?.numero)}
              />
            </FormField>

            <FormField
              label="Complemento"
              htmlFor="complemento"
              erro={errors.endereco?.complemento?.message}
              className="lg:col-span-2"
            >
              <Input
                id="complemento"
                placeholder="Sala / Andar"
                {...register('endereco.complemento')}
              />
            </FormField>

            <FormField
              label="Bairro"
              htmlFor="bairro"
              obrigatorio
              erro={errors.endereco?.bairro?.message}
              className="lg:col-span-2"
            >
              <Input
                id="bairro"
                placeholder="Centro"
                {...register('endereco.bairro')}
                invalido={Boolean(errors.endereco?.bairro)}
              />
            </FormField>

            <FormField
              label="Cidade"
              htmlFor="cidade"
              obrigatorio
              erro={errors.endereco?.cidade?.message}
              className="lg:col-span-2"
            >
              <Input
                id="cidade"
                placeholder="São Paulo"
                {...register('endereco.cidade')}
                invalido={Boolean(errors.endereco?.cidade)}
              />
            </FormField>

            <FormField
              label="UF"
              htmlFor="uf"
              obrigatorio
              erro={errors.endereco?.uf?.message}
            >
              <Input
                id="uf"
                maxLength={2}
                placeholder="SP"
                {...register('endereco.uf')}
                invalido={Boolean(errors.endereco?.uf)}
                className="uppercase"
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Comercial
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Limite de Crédito (R$)"
              htmlFor="limiteCredito"
              erro={errors.limiteCredito?.message}
              ajuda="Valor em reais. Use 0 para sem limite definido."
            >
              <Input
                id="limiteCredito"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('limiteCredito', { valueAsNumber: true })}
                invalido={Boolean(errors.limiteCredito)}
              />
            </FormField>

            <FormField
              label="Observações"
              htmlFor="observacoes"
              erro={errors.observacoes?.message}
            >
              <Input
                id="observacoes"
                placeholder="Notas internas"
                {...register('observacoes')}
              />
            </FormField>
          </div>
        </section>
      </form>
    </Modal>
  );
}
