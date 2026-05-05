import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building2, LogIn, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import {
  loginClienteSchema,
  type LoginClienteFormValues,
} from '@/features/auth/schemas/auth.schema';
import { useLoginCliente } from '@/features/auth/hooks/useAuth';
import { SENHA_DEMO } from '@/features/auth/services/auth.mock';
import { maskCNPJ } from '@/utils/cnpj';

export function LoginClienteForm() {
  const navigate = useNavigate();
  const login = useLoginCliente();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginClienteFormValues>({
    resolver: zodResolver(loginClienteSchema),
    defaultValues: { cnpj: '', senha: '' },
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErro(null);
    try {
      await login.mutateAsync(valores);
      navigate('/cliente');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar.');
    }
  });

  const preencherDemo = () => {
    // CNPJ válido do "Mercado Central LTDA" (cliente seed ativo).
    setValue('cnpj', maskCNPJ('11444777000161'));
    setValue('senha', SENHA_DEMO);
    setErro(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="CNPJ"
        htmlFor="login-cnpj"
        obrigatorio
        erro={errors.cnpj?.message}
      >
        <Controller
          control={control}
          name="cnpj"
          render={({ field }) => (
            <Input
              id="login-cnpj"
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              autoComplete="username"
              iconeEsquerda={<Building2 className="h-4 w-4" />}
              value={maskCNPJ(field.value ?? '')}
              onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
              invalido={Boolean(errors.cnpj)}
            />
          )}
        />
      </FormField>

      <FormField
        label="Senha"
        htmlFor="login-senha-cliente"
        obrigatorio
        erro={errors.senha?.message}
      >
        <PasswordInput
          id="login-senha-cliente"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          {...register('senha')}
          invalido={Boolean(errors.senha)}
        />
      </FormField>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <p>{erro}</p>
        </div>
      )}

      <Button
        type="submit"
        loading={isSubmitting || login.isPending}
        className="w-full"
      >
        <LogIn className="h-4 w-4" />
        Acessar minhas faturas
      </Button>

      <button
        type="button"
        onClick={preencherDemo}
        className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-slate-500 hover:text-slate-300"
      >
        <Wand2 className="h-3 w-3" />
        Preencher credenciais de demonstração
      </button>
    </form>
  );
}
