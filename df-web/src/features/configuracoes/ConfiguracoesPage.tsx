import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Landmark, QrCode, Save, Settings2, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import {
  BANCOS_SUPORTADOS,
  CONFIG_PADRAO,
  configuracoesProntas,
  type ConfiguracoesCobranca,
} from '@/features/configuracoes/store/configuracoes.store';
import {
  useAtualizarConfiguracoes,
  useConfiguracoes,
} from '@/features/configuracoes/services/configuracoes.service';
import {
  configuracoesSchema,
  type ConfiguracoesFormValues,
} from '@/features/configuracoes/schemas/configuracoes.schema';
import { maskCEP, maskCNPJ } from '@/utils/cnpj';

export function ConfiguracoesPage() {
  const { data: config, isLoading } = useConfiguracoes();
  const atualizar = useAtualizarConfiguracoes();
  const valoresIniciais: ConfiguracoesCobranca = config ?? CONFIG_PADRAO;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfiguracoesFormValues>({
    resolver: zodResolver(configuracoesSchema),
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const tipoChavePix = watch('pix.tipoChave');
  const codigoBancoSelecionado = watch('banco.codigoBanco');
  const configAtual = config ?? CONFIG_PADRAO;

  const onSubmit = handleSubmit(async (valores) => {
    const proximo: ConfiguracoesCobranca = {
      ...configAtual,
      ...valores,
      banco: { ...configAtual.banco, ...valores.banco },
    };
    const salvo = await atualizar.mutateAsync(proximo);
    reset(salvo);
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Configurações de Cobrança
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Defina os dados do beneficiário, banco (Febraban) e chave PIX usados
            na geração dos boletos e cobranças.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => reset(configAtual)}
            disabled={!isDirty || isSubmitting || isLoading}
          >
            Descartar
          </Button>
          <Button
            onClick={onSubmit}
            loading={isSubmitting || atualizar.isPending}
            disabled={!isDirty || isLoading}
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
      </header>

      {!isLoading && !configuracoesProntas(configAtual) && (
        <Card className="border-amber-900/60 bg-amber-950/30">
          <CardBody className="flex items-start gap-3 text-sm text-amber-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Configuração incompleta</p>
              <p className="mt-1 text-amber-200/80">
                Preencha agência, conta, carteira e a chave PIX antes de gerar
                novas cobranças. Sem isso o boleto Febraban e o BR Code do PIX
                ficam inválidos.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Beneficiário */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <CardTitle>Beneficiário</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormField
                label="CNPJ"
                htmlFor="benefCnpj"
                obrigatorio
                erro={errors.beneficiario?.cnpj?.message}
              >
                <Controller
                  control={control}
                  name="beneficiario.cnpj"
                  render={({ field }) => (
                    <Input
                      id="benefCnpj"
                      placeholder="00.000.000/0000-00"
                      value={maskCNPJ(field.value ?? '')}
                      onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                      invalido={Boolean(errors.beneficiario?.cnpj)}
                      inputMode="numeric"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Razão Social"
                htmlFor="razaoSocial"
                obrigatorio
                erro={errors.beneficiario?.razaoSocial?.message}
                className="lg:col-span-2"
              >
                <Input
                  id="razaoSocial"
                  {...register('beneficiario.razaoSocial')}
                  invalido={Boolean(errors.beneficiario?.razaoSocial)}
                />
              </FormField>

              <FormField
                label="Nome Fantasia"
                htmlFor="nomeFantasia"
                erro={errors.beneficiario?.nomeFantasia?.message}
                className="lg:col-span-3"
              >
                <Input
                  id="nomeFantasia"
                  {...register('beneficiario.nomeFantasia')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <FormField
                label="CEP"
                htmlFor="cep"
                obrigatorio
                erro={errors.beneficiario?.endereco?.cep?.message}
                className="lg:col-span-2"
              >
                <Controller
                  control={control}
                  name="beneficiario.endereco.cep"
                  render={({ field }) => (
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={maskCEP(field.value ?? '')}
                      onChange={(e) => field.onChange(maskCEP(e.target.value))}
                      invalido={Boolean(errors.beneficiario?.endereco?.cep)}
                      inputMode="numeric"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Logradouro"
                htmlFor="log"
                obrigatorio
                erro={errors.beneficiario?.endereco?.logradouro?.message}
                className="lg:col-span-3"
              >
                <Input
                  id="log"
                  {...register('beneficiario.endereco.logradouro')}
                  invalido={Boolean(errors.beneficiario?.endereco?.logradouro)}
                />
              </FormField>
              <FormField
                label="Número"
                htmlFor="num"
                obrigatorio
                erro={errors.beneficiario?.endereco?.numero?.message}
              >
                <Input
                  id="num"
                  {...register('beneficiario.endereco.numero')}
                  invalido={Boolean(errors.beneficiario?.endereco?.numero)}
                />
              </FormField>

              <FormField
                label="Complemento"
                htmlFor="comp"
                erro={errors.beneficiario?.endereco?.complemento?.message}
                className="lg:col-span-2"
              >
                <Input
                  id="comp"
                  {...register('beneficiario.endereco.complemento')}
                />
              </FormField>
              <FormField
                label="Bairro"
                htmlFor="bairro"
                obrigatorio
                erro={errors.beneficiario?.endereco?.bairro?.message}
                className="lg:col-span-2"
              >
                <Input
                  id="bairro"
                  {...register('beneficiario.endereco.bairro')}
                  invalido={Boolean(errors.beneficiario?.endereco?.bairro)}
                />
              </FormField>
              <FormField
                label="Cidade"
                htmlFor="cidade"
                obrigatorio
                erro={errors.beneficiario?.endereco?.cidade?.message}
              >
                <Input
                  id="cidade"
                  {...register('beneficiario.endereco.cidade')}
                  invalido={Boolean(errors.beneficiario?.endereco?.cidade)}
                />
              </FormField>
              <FormField
                label="UF"
                htmlFor="uf"
                obrigatorio
                erro={errors.beneficiario?.endereco?.uf?.message}
              >
                <Input
                  id="uf"
                  maxLength={2}
                  {...register('beneficiario.endereco.uf')}
                  invalido={Boolean(errors.beneficiario?.endereco?.uf)}
                  className="uppercase"
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* Banco */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-amber-300" />
              <CardTitle>Dados bancários (Febraban)</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <FormField
                label="Banco"
                htmlFor="banco"
                obrigatorio
                erro={errors.banco?.codigoBanco?.message}
                className="lg:col-span-3"
                ajuda={`Código atual: ${codigoBancoSelecionado || '—'}`}
              >
                <Select
                  id="banco"
                  value={codigoBancoSelecionado}
                  onChange={(e) => {
                    const banco = BANCOS_SUPORTADOS.find(
                      (b) => b.codigo === e.target.value,
                    );
                    if (banco) {
                      setValue('banco.codigoBanco', banco.codigo, {
                        shouldDirty: true,
                      });
                      setValue('banco.nomeBanco', banco.nome, {
                        shouldDirty: true,
                      });
                    }
                  }}
                  invalido={Boolean(errors.banco?.codigoBanco)}
                >
                  {BANCOS_SUPORTADOS.map((b) => (
                    <option key={b.codigo} value={b.codigo}>
                      {b.codigo} - {b.nome}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Carteira"
                htmlFor="carteira"
                obrigatorio
                erro={errors.banco?.carteira?.message}
                ajuda="Ex: 109, 175, 17"
              >
                <Input
                  id="carteira"
                  {...register('banco.carteira')}
                  invalido={Boolean(errors.banco?.carteira)}
                />
              </FormField>

              <FormField
                label="Convênio"
                htmlFor="convenio"
                erro={errors.banco?.convenio?.message}
                ajuda="Quando aplicável"
                className="lg:col-span-2"
              >
                <Input id="convenio" {...register('banco.convenio')} />
              </FormField>

              <FormField
                label="Agência"
                htmlFor="agencia"
                obrigatorio
                erro={errors.banco?.agencia?.message}
              >
                <Input
                  id="agencia"
                  {...register('banco.agencia')}
                  invalido={Boolean(errors.banco?.agencia)}
                  inputMode="numeric"
                />
              </FormField>
              <FormField
                label="Dígito Ag."
                htmlFor="agenciaDigito"
                erro={errors.banco?.agenciaDigito?.message}
              >
                <Input
                  id="agenciaDigito"
                  maxLength={2}
                  {...register('banco.agenciaDigito')}
                />
              </FormField>
              <FormField
                label="Conta"
                htmlFor="conta"
                obrigatorio
                erro={errors.banco?.conta?.message}
                className="lg:col-span-2"
              >
                <Input
                  id="conta"
                  {...register('banco.conta')}
                  invalido={Boolean(errors.banco?.conta)}
                  inputMode="numeric"
                />
              </FormField>
              <FormField
                label="Dígito Conta"
                htmlFor="contaDigito"
                obrigatorio
                erro={errors.banco?.contaDigito?.message}
              >
                <Input
                  id="contaDigito"
                  maxLength={2}
                  {...register('banco.contaDigito')}
                  invalido={Boolean(errors.banco?.contaDigito)}
                />
              </FormField>
              <FormField
                label="Próximo Nosso Número"
                htmlFor="nossoNumero"
                obrigatorio
                erro={errors.banco?.proximoNossoNumero?.message}
                ajuda="Sequencial usado para gerar boletos"
              >
                <Input
                  id="nossoNumero"
                  type="number"
                  step="1"
                  {...register('banco.proximoNossoNumero', {
                    valueAsNumber: true,
                  })}
                  invalido={Boolean(errors.banco?.proximoNossoNumero)}
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* PIX */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-300" />
              <CardTitle>Chave PIX</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="Tipo de chave"
                htmlFor="tipoChave"
                obrigatorio
                erro={errors.pix?.tipoChave?.message}
              >
                <Select
                  id="tipoChave"
                  {...register('pix.tipoChave')}
                  invalido={Boolean(errors.pix?.tipoChave)}
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="EMAIL">Email</option>
                  <option value="TELEFONE">Telefone</option>
                  <option value="ALEATORIA">Aleatória (UUID)</option>
                </Select>
              </FormField>

              <FormField
                label="Chave"
                htmlFor="chave"
                obrigatorio
                erro={errors.pix?.chave?.message}
                className="sm:col-span-2"
                ajuda={
                  tipoChavePix === 'ALEATORIA'
                    ? 'Chave aleatória de 32 caracteres'
                    : tipoChavePix === 'TELEFONE'
                      ? 'Inclua o DDD; aceita +55 prefixado'
                      : undefined
                }
              >
                <Input
                  id="chave"
                  {...register('pix.chave')}
                  invalido={Boolean(errors.pix?.chave)}
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* Encargos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-sky-300" />
              <CardTitle>Encargos e mensagens</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                label="Multa (%)"
                htmlFor="multa"
                erro={errors.encargos?.multaPercentual?.message}
                ajuda="Aplicada após o vencimento"
              >
                <Input
                  id="multa"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('encargos.multaPercentual', {
                    valueAsNumber: true,
                  })}
                  invalido={Boolean(errors.encargos?.multaPercentual)}
                />
              </FormField>
              <FormField
                label="Juros mensais (%)"
                htmlFor="juros"
                erro={errors.encargos?.jurosMensalPercentual?.message}
                ajuda="Pro-rata diário"
              >
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('encargos.jurosMensalPercentual', {
                    valueAsNumber: true,
                  })}
                  invalido={Boolean(errors.encargos?.jurosMensalPercentual)}
                />
              </FormField>
              <FormField
                label="Desc. antec. (dias)"
                htmlFor="descDias"
                erro={errors.encargos?.descontoAntecipadoDias?.message}
              >
                <Input
                  id="descDias"
                  type="number"
                  step="1"
                  min="0"
                  {...register('encargos.descontoAntecipadoDias', {
                    valueAsNumber: true,
                  })}
                  invalido={Boolean(errors.encargos?.descontoAntecipadoDias)}
                />
              </FormField>
              <FormField
                label="Desconto (%)"
                htmlFor="desc"
                erro={errors.encargos?.descontoPercentual?.message}
              >
                <Input
                  id="desc"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('encargos.descontoPercentual', {
                    valueAsNumber: true,
                  })}
                  invalido={Boolean(errors.encargos?.descontoPercentual)}
                />
              </FormField>
            </div>

            <FormField
              label="Mensagem padrão no boleto"
              htmlFor="msg"
              erro={errors.encargos?.mensagemPadrao?.message}
              ajuda="Aparece no campo de instruções dos boletos gerados"
            >
              <Textarea
                id="msg"
                rows={3}
                {...register('encargos.mensagemPadrao')}
              />
            </FormField>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
