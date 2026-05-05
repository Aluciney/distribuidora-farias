import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalido?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ invalido, ...rest }, ref) {
    const [visivel, setVisivel] = useState(false);
    return (
      <Input
        {...rest}
        ref={ref}
        type={visivel ? 'text' : 'password'}
        invalido={invalido}
        iconeEsquerda={<Lock className="h-4 w-4" />}
        iconeDireita={
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            className="pointer-events-auto rounded p-0.5 text-slate-500 hover:text-slate-200"
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    );
  },
);
