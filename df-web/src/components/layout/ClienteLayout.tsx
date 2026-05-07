import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Wallet,
  Menu,
  X,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useClienteLogado } from '@/features/cliente-portal/shared/hooks/useClienteLogado';
import { NotificacoesDropdown } from '@/features/cliente-portal/notificacoes/components/NotificacoesDropdown';
import { useAuthStore } from '@/store/auth.store';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/cliente', label: 'Início', icon: LayoutDashboard },
  { to: '/cliente/faturas', label: 'Minhas Faturas', icon: FileText },
  { to: '/cliente/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/cliente/perfil', label: 'Meu perfil', icon: UserCircle },
];

export function ClienteLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { data: cliente } = useClienteLogado();
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    logout();
    navigate('/login?tipo=cliente');
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
            <Wallet className="h-6 w-6 text-sky-400" />
            <span className="font-semibold text-slate-100">Portal Cliente</span>
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
              end={to === '/cliente'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-500/10 text-sky-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
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
              Cliente
            </p>
            <h1 className="truncate text-sm font-semibold text-slate-100">
              {cliente?.nomeFantasia ?? cliente?.razaoSocial ?? 'Carregando...'}
            </h1>
          </div>
          <NotificacoesDropdown />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
