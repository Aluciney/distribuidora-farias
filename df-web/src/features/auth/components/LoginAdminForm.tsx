import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { loginAdminSchema, type LoginAdminFormValues } from '@/features/auth/schemas/auth.schema';
import { useLoginAdmin } from '@/features/auth/hooks/useAuth';

export function LoginAdminForm() {
  const navigate = useNavigate();
  const login = useLoginAdmin();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginAdminFormValues>({
    resolver: zodResolver(loginAdminSchema),
    defaultValues: { email: 'aluciney@df.com', senha: 'df2026' },
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErro(null);
    try {
      await login.mutateAsync(valores);
      navigate('/admin');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar.');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Email corporativo"
        htmlFor="login-email"
        obrigatorio
        erro={errors.email?.message}
      >
        <Input
          id="login-email"
          type="email"
          placeholder="usuario@distribuidorafarias.com.br"
          autoComplete="username"
          iconeEsquerda={<Mail className="h-4 w-4" />}
          {...register('email')}
          invalido={Boolean(errors.email)}
        />
      </FormField>

      <FormField
        label="Senha"
        htmlFor="login-senha"
        obrigatorio
        erro={errors.senha?.message}
      >
        <PasswordInput
          id="login-senha"
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
        <ShieldCheck className="h-4 w-4" />
        Entrar como Admin
      </Button>
    </form>
  );
}
