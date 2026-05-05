import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200">
      <Frown className="h-12 w-12 text-slate-500" />
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-slate-400">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        to="/admin"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
