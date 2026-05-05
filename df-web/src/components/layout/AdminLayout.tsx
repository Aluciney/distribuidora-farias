import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  AlertTriangle,
  Wallet,
  Workflow,
  ShieldCheck,
  Boxes,
  Settings2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUsuarioLogado } from '@/features/auth/hooks/useUsuarioLogado';
import { useAuthStore } from '@/store/auth.store';
import { PerfilUsuario } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Fluxo de Caixa', icon: LayoutDashboard },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/cobrancas', label: 'Cobranças', icon: Receipt },
  { to: '/admin/inadimplencia', label: 'Inadimplência', icon: AlertTriangle },
  { to: '/admin/regua-cobranca', label: 'Régua de Cobrança', icon: Workflow },
  { to: '/admin/usuarios', label: 'Usuários', icon: ShieldCheck },
  { to: '/admin/produtos', label: 'Produtos', icon: Boxes },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings2 },
];

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.ADMIN]: 'Administrador',
  [PerfilUsuario.FINANCEIRO]: 'Financeiro',
  [PerfilUsuario.CLIENTE]: 'Cliente',
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { data: usuario } = useUsuarioLogado();
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    logout();
    navigate('/login?tipo=admin');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {sidebarOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-400" />
            <span className="font-semibold text-slate-100">DF Pagamentos</span>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-800 p-3">
          {usuario && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-950/40 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-300">
                {iniciais(usuario.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-100">
                  {usuario.nome}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                  {PERFIL_LABEL[usuario.perfil]}
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 truncate">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Portal Administrativo
            </p>
            <h1 className="truncate text-sm font-semibold text-slate-100">
              {usuario ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Distribuidora Farias'}
            </h1>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-300">
            {usuario ? iniciais(usuario.nome) : 'DF'}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
