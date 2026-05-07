import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  const hidratado = useAuthStore((s) => s.hidratado);

  if (hidratado && token) return <Redirect href="/(cliente)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
