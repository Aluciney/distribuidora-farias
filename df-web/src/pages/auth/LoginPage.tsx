import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { LoginAdminForm } from '@/features/auth/components/LoginAdminForm';
import { LoginClienteForm } from '@/features/auth/components/LoginClienteForm';
import { EsqueciSenhaModal } from '@/features/auth/components/EsqueciSenhaModal';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/cn';
import Logo from '@/assets/logo.png'

type Aba = 'ADMIN' | 'CLIENTE';

export function LoginPage() {
  const location = useLocation();
  const tipoSessao = useAuthStore((s) => s.tipo);

  // Se a rota foi `/login?tipo=cliente`, abre direto a aba do cliente.
  const inicial: Aba =
    new URLSearchParams(location.search).get('tipo') === 'admin'
      ? 'ADMIN'
      : 'CLIENTE';
  const [aba, setAba] = useState<Aba>(inicial);
  const [esqueciAberto, setEsqueciAberto] = useState(false);

  // Já logado? Redireciona para a área correspondente.
  if (tipoSessao === 'ADMIN') return <Navigate to="/admin" replace />;
  if (tipoSessao === 'USUARIO_CLIENTE') return <Navigate to="/cliente" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-200">
      <div className="grid w-full max-w-4xl items-center gap-8 lg:grid-cols-2">
        {/* Branding lateral (visível em telas grandes) */}
        <aside className="hidden flex-col gap-6 lg:flex">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Distribuidora Farias" />
          </div>
          <p className="text-base leading-relaxed text-slate-300">
            Centralize a gestão financeira da distribuidora com Boletos, PIX e
            cartão em um único lugar — para sua equipe e seus clientes.
          </p>
          <ul className="space-y-3 text-sm text-slate-400">
            <Feature texto="Boleto Febraban e PIX gerados juntos em toda cobrança" />
            <Feature texto="Régua de cobrança automatizada por email e WhatsApp" />
            <Feature texto="Portal do cliente com pagamento por cartão de crédito" />
            <Feature texto="Acompanhamento de inadimplência e fluxo de caixa em tempo real" />
          </ul>
        </aside>

        {/* Card de login */}
        <main className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <img src={Logo} alt="Distribuidora Farias" width={200} height="auto" />
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <TabButton
              ativo={aba === 'CLIENTE'}
              onClick={() => setAba('CLIENTE')}
              icone={<Building2 className="h-3.5 w-3.5" />}
              tom="sky"
            >
              Sou cliente
            </TabButton>
            <TabButton
              ativo={aba === 'ADMIN'}
              onClick={() => setAba('ADMIN')}
              icone={<ShieldCheck className="h-3.5 w-3.5" />}
              tom="emerald"
            >
              Sou da equipe
            </TabButton>
          </div>

          <header className="mb-5">
            <h2 className="text-lg font-semibold text-slate-100">
              {aba === 'ADMIN' ? 'Acesso interno' : 'Portal do Cliente'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {aba === 'ADMIN'
                ? 'Use o email corporativo cadastrado no sistema.'
                : 'Use seu email cadastrado para acessar as faturas das suas filiais.'}
            </p>
          </header>

          {aba === 'ADMIN' ? <LoginAdminForm /> : <LoginClienteForm />}

          <div className="mt-5 flex items-center justify-between text-xs">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200"
              onClick={() => setEsqueciAberto(true)}
            >
              Esqueceu sua senha?
            </button>
            <span className="text-slate-600">v1.0 mock</span>
          </div>
        </main>
      </div>

      <EsqueciSenhaModal
        aberto={esqueciAberto}
        onFechar={() => setEsqueciAberto(false)}
        tipoInicial={aba === 'CLIENTE' ? 'USUARIO_CLIENTE' : 'ADMIN'}
      />
    </div>
  );
}

interface TabButtonProps {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  tom: 'emerald' | 'sky';
  children: React.ReactNode;
}

function TabButton({ ativo, onClick, icone, tom, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        ativo
          ? tom === 'emerald'
            ? 'bg-emerald-500/10 text-emerald-300'
            : 'bg-sky-500/10 text-sky-300'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
      )}
    >
      {icone}
      {children}
    </button>
  );
}

function Feature({ texto }: { texto: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
      <span>{texto}</span>
    </li>
  );
}
