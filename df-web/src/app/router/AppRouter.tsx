import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequireAuth } from '@/app/router/RequireAuth';
import { FluxoCaixaPage } from '@/features/fluxo-caixa/FluxoCaixaPage';
import { ClientesPage } from '@/features/clientes/ClientesPage';
import { CobrancasPage } from '@/features/cobrancas/CobrancasPage';
import { InadimplenciaPage } from '@/features/inadimplencia/InadimplenciaPage';
import { ConfiguracoesPage } from '@/features/configuracoes/ConfiguracoesPage';
import { ReguaPage } from '@/features/regua-cobranca/ReguaPage';
import { UsuariosPage } from '@/features/usuarios/UsuariosPage';
import { UsuariosClientePage } from '@/features/usuarios-cliente/UsuariosClientePage';
import { ProdutosPage } from '@/features/produtos/ProdutosPage';
import { WhatsappPage } from '@/features/whatsapp/WhatsappPage';
import { DashboardClientePage } from '@/features/cliente-portal/dashboard/DashboardClientePage';
import { FaturasClientePage } from '@/features/cliente-portal/faturas/FaturasClientePage';
import { NotificacoesPage } from '@/features/cliente-portal/notificacoes/NotificacoesPage';
import { PerfilClientePage } from '@/features/cliente-portal/perfil/PerfilClientePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Portal Administrativo */}
        <Route
          path="/admin"
          element={
            <RequireAuth tipo="ADMIN">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<FluxoCaixaPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="cobrancas" element={<CobrancasPage />} />
          <Route path="inadimplencia" element={<InadimplenciaPage />} />
          <Route path="regua-cobranca" element={<ReguaPage />} />
          <Route path="whatsapp" element={<WhatsappPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="usuarios-cliente" element={<UsuariosClientePage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        {/* Portal do Cliente */}
        <Route
          path="/cliente"
          element={
            <RequireAuth tipo="USUARIO_CLIENTE">
              <ClienteLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardClientePage />} />
          <Route path="faturas" element={<FaturasClientePage />} />
          <Route path="faturas/:id" element={<FaturasClientePage />} />
          <Route path="notificacoes" element={<NotificacoesPage />} />
          <Route path="perfil" element={<PerfilClientePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
