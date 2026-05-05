import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import {
  usuarioSchema,
  type UsuarioFormValues,
} from '@/features/usuarios/schemas/usuario.schema';
import {
  useAtualizarUsuario,
  useCriarUsuario,
} from '@/features/usuarios/hooks/useUsuarios';
import { PerfilUsuario, type Usuario } from '@/types';

interface UsuarioFormModalProps {
  aberto: boolean;
  onFechar: () => void;
  usuario?: Usuario;
}

const VALORES_PADRAO: UsuarioFormValues = {
  nome: '',
  email: '',
  perfil: PerfilUsuario.FINANCEIRO,
  ativo: true,
};

export function UsuarioFormModal({
  aberto,
  onFechar,
  usuario,
}: UsuarioFormModalProps) {
  const ehEdicao = Boolean(usuario);
  const criar = useCriarUsuario();
  const atualizar = useAtualizarUsuario();

  const valoresIniciais = useMemo<UsuarioFormValues>(() => {
    if (!usuario) return VALORES_PADRAO;
    return {
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    };
  }, [usuario]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (aberto) reset(valoresIniciais);
  }, [aberto, valoresIniciais, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    if (usuario) {
      await atualizar.mutateAsync({ id: usuario.id, dados: valores });
    } else {
      await criar.mutateAsync(valores);
    }
    onFechar();
  });

  const carregando = isSubmitting || criar.isPending || atualizar.isPending;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={ehEdicao ? 'Editar usuário' : 'Novo usuário'}
      descricao={
        ehEdicao
          ? 'Atualize os dados de acesso ao sistema.'
          : 'O usuário receberá um email de boas-vindas para definir a senha.'
      }
      tamanho="md"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={carregando}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={carregando}>
            {ehEdicao ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Nome completo"
          htmlFor="nome"
          obrigatorio
          erro={errors.nome?.message}
        >
          <Input
            id="nome"
            placeholder="Ex: Marina Costa"
            {...register('nome')}
            invalido={Boolean(errors.nome)}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="email"
          obrigatorio
          erro={errors.email?.message}
          ajuda="Será o login do sistema."
        >
          <Input
            id="email"
            type="email"
            placeholder="usuario@distribuidorafarias.com.br"
            {...register('email')}
            invalido={Boolean(errors.email)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Perfil"
            htmlFor="perfil"
            obrigatorio
            erro={errors.perfil?.message}
            ajuda="Define o nível de acesso."
          >
            <Select
              id="perfil"
              {...register('perfil')}
              invalido={Boolean(errors.perfil)}
            >
              <option value={PerfilUsuario.ADMIN}>Administrador</option>
              <option value={PerfilUsuario.FINANCEIRO}>Financeiro</option>
              <option value={PerfilUsuario.CLIENTE}>Cliente</option>
            </Select>
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
                  label={field.value ? 'Ativo' : 'Inativo'}
                />
              )}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
