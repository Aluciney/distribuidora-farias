import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FileText, CreditCard, Bell } from 'lucide-react';
import { LoginClienteForm } from '@/features/auth/components/LoginClienteForm';
import { EsqueciSenhaModal } from '@/features/auth/components/EsqueciSenhaModal';
import { useAuthStore } from '@/store/auth.store';
import Logo from '@/assets/logo.png';

export function LoginPage() {
  const tipoSessao = useAuthStore((s) => s.tipo);
  const [esqueciAberto, setEsqueciAberto] = useState(false);

  if (tipoSessao === 'ADMIN') return <Navigate to="/admin" replace />;
  if (tipoSessao === 'USUARIO_CLIENTE') return <Navigate to="/cliente" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-200">
      <div className="absolute top-0 right-0 w-125 h-125 bg-[#571bc1] opacity-10 blur-[120px] rounded-full hidden sm:block"></div>
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-[#4d8eff] opacity-10 blur-[120px] rounded-full hidden sm:block"></div>
      <div className="grid w-full max-w-4xl items-center gap-8 lg:grid-cols-2">
        <aside className="hidden flex-col gap-6 lg:flex">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Distribuidora Farias" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Portal do Cliente
            </h1>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Acompanhe as faturas das suas filiais, baixe boletos e quite seus
              títulos com a Distribuidora Farias de forma rápida e segura.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-400">
            <Feature
              icone={<FileText className="h-4 w-4 text-emerald-400" />}
              texto="Consulta de faturas em aberto, pagas e vencidas"
            />
            <Feature
              icone={<CreditCard className="h-4 w-4 text-emerald-400" />}
              texto="Pagamento via Boleto, PIX ou cartão de crédito"
            />
            <Feature
              icone={<Bell className="h-4 w-4 text-emerald-400" />}
              texto="Notificações de vencimento direto no seu painel"
            />
          </ul>
        </aside>

        <main className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <img src={Logo} alt="Distribuidora Farias" width={200} height="auto" />
          </div>

          <header className="mb-5">
            <h2 className="text-lg font-semibold text-slate-100">
              Acesse sua conta
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Use o email cadastrado para acessar as faturas das suas filiais.
            </p>
          </header>

          <LoginClienteForm />

          <div className="mt-5 flex items-center justify-between text-xs">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200"
              onClick={() => setEsqueciAberto(true)}
            >
              Esqueceu sua senha?
            </button>
            <span className="text-slate-600">v1.0</span>
          </div>
        </main>
      </div>

      <EsqueciSenhaModal
        aberto={esqueciAberto}
        onFechar={() => setEsqueciAberto(false)}
        tipoInicial="USUARIO_CLIENTE"
      />
    </div>
  );
}

interface FeatureProps {
  icone: React.ReactNode;
  texto: string;
}

function Feature({ icone, texto }: FeatureProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex-none">{icone}</span>
      <span>{texto}</span>
    </li>
  );
}
