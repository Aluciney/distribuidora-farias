/**
 * Entrypoint: redireciona para `(cliente)` se houver token persistido,
 * ou para `(auth)/login` caso contrário. Usar `<Redirect>` em vez de
 * `router.replace()` evita o erro "Attempted to navigate before mounting
 * the Root Layout" — o redirect só dispara quando a tela já montou.
 */
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

export default function IndexRoute() {
  const token = useAuthStore((s) => s.token);
  const hidratado = useAuthStore((s) => s.hidratado);

  if (!hidratado) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    );
  }

  return token ? (
    <Redirect href="/(cliente)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
