import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Bell, FileText, Home, UserCircle } from 'lucide-react-native';
import { useNotificacoes } from '@/features/notificacoes/useNotificacoes';
import { authService } from '@/features/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { registrarPushTokenNoBackend } from '@/services/push';

export default function ClienteLayout() {
  const token = useAuthStore((s) => s.token);
  const hidratado = useAuthStore((s) => s.hidratado);
  const setUsuarioCliente = useAuthStore((s) => s.setUsuarioCliente);

  useEffect(() => {
    if (!token) return;
    void registrarPushTokenNoBackend();
    // Re-sincroniza filiais com o backend toda vez que o app recarrega.
    // Admin pode ter vinculado/desvinculado filiais desde o último login.
    void authService
      .eu()
      .then((u) => {
        if (u) setUsuarioCliente(u);
      })
      .catch(() => undefined);
  }, [token, setUsuarioCliente]);

  if (!hidratado) return null;
  if (!token) return <Redirect href="/(auth)/login" />;

  return <ClienteTabs />;
}

function ClienteTabs() {
  const { data } = useNotificacoes({ porPagina: 10 });
  const naoLidas = data?.totalNaoLidas ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1e293b',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="faturas/index"
        options={{
          title: 'Faturas',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarBadge: naoLidas > 0 ? naoLidas : undefined,
          tabBarBadgeStyle: { backgroundColor: '#f43f5e', color: '#fff' },
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="faturas/[id]"
        options={{ href: null, title: 'Fatura' }}
      />
    </Tabs>
  );
}
