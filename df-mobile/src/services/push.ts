/**
 * Integração com Expo Notifications.
 *
 * - Pede permissão (iOS) e cria channel "default" (Android).
 * - Captura o ExponentPushToken e registra no backend (`/cliente/push/dispositivos`).
 * - O handler de foreground exibe o banner mesmo com o app aberto.
 * - O listener de tap navega para a fatura quando o payload contém `faturaId`.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { Router } from 'expo-router';
import { api, ApiError } from '@/services/http';

let tokenRegistrado: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Cria o canal padrão no Android (necessário para som/vibração). */
async function garantirCanalAndroid() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notificações',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#34d399',
    sound: 'default',
  });
}

/**
 * Pede permissão e retorna o ExponentPushToken. `null` quando rodando em
 * simulador/web ou quando o usuário negou a permissão.
 */
async function obterExpoToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  await garantirCanalAndroid();

  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;
  if (status !== 'granted') {
    const pedido = await Notifications.requestPermissionsAsync();
    status = pedido.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)
      ?.projectId ?? Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return tokenData.data;
}

/** Registra o device no backend. Idempotente — repetir não causa problema. */
export async function registrarPushTokenNoBackend(): Promise<string | null> {
  try {
    const token = await obterExpoToken();
    if (!token) return null;
    if (token === tokenRegistrado) return token;
    await api.post('/cliente/push/dispositivos', {
      token,
      plataforma: Platform.OS,
    });
    tokenRegistrado = token;
    return token;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Sessão expirou — silencioso; o usuário será mandado pro login.
      return null;
    }
    console.warn('[push] Falha ao registrar token', err);
    return null;
  }
}

/** Remove o token do backend (logout). Não falha se token nem existir. */
export async function removerPushTokenDoBackend(): Promise<void> {
  if (!tokenRegistrado) return;
  const token = tokenRegistrado;
  tokenRegistrado = null;
  try {
    await api.delete(`/cliente/push/dispositivos/${encodeURIComponent(token)}`);
  } catch {
    // logout não pode ser bloqueado por falha de remoção remota.
  }
}

/**
 * Encaminha o usuário para a fatura quando ele toca numa notificação que
 * traz `faturaId` no payload. Retorna o `unsubscribe`.
 */
export function instalarHandlerNavegacao(router: Router): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | { faturaId?: string }
        | undefined;
      if (data?.faturaId) {
        router.push(`/(cliente)/faturas/${data.faturaId}`);
      }
    },
  );
  return () => sub.remove();
}
