import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Bell, FileText, Home, UserCircle } from 'lucide-react-native';
import { useNotificacoes } from '@/features/notificacoes/useNotificacoes';
import { useAuthStore } from '@/store/auth.store';
import { registrarPushTokenNoBackend } from '@/services/push';

export default function ClienteLayout() {
  const token = useAuthStore((s) => s.token);
  const hidratado = useAuthStore((s) => s.hidratado);

  useEffect(() => {
    if (token) {
      void registrarPushTokenNoBackend();
    }
  }, [token]);

  if (!hidratado) return null;
  if (!token) return <Redirect href="/(auth)/login" />;

  return <ClienteTabs />;
}

function ClienteTabs() {
  const { data: notificacoes } = useNotificacoes();
  const naoLidas = notificacoes?.filter((n) => n.naoLida).length ?? 0;

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
