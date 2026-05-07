import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, BellOff, CheckCheck, ChevronRight } from 'lucide-react-native';
import { Card, CardBody } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  useMarcarNotificacaoLida,
  useMarcarTodasComoLidas,
  useNotificacoes,
} from '@/features/notificacoes/useNotificacoes';
import { formatDateTime } from '@/lib/format';

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotificacoes();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasComoLidas();

  const naoLidas = data?.filter((n) => n.naoLida).length ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 24,
        paddingHorizontal: 16,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#34d399"
        />
      }
    >
      <View>
        <Text className="text-2xl font-semibold text-slate-100">
          Central de Notificações
        </Text>
        <Text className="mt-1 text-sm text-slate-400">
          Alertas de vencimento, atrasos e atualizações sobre suas faturas.
        </Text>
      </View>

      <Button
        variant="outline"
        disabled={naoLidas === 0 || marcarTodas.isPending}
        onPress={() => marcarTodas.mutate()}
        iconeEsquerda={<CheckCheck size={16} color="#e2e8f0" />}
      >
        Marcar todas como lidas
      </Button>

      <Card>
        <CardBody className="p-0">
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Bell size={14} color="#7dd3fc" />
            <Text className="text-sm font-medium text-slate-200">
              Atualizações recentes
            </Text>
          </View>

          {isLoading ? (
            <View className="gap-2 px-4 pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  className="h-16 rounded-lg bg-slate-800/40"
                />
              ))}
            </View>
          ) : !data || data.length === 0 ? (
            <View className="items-center gap-2 px-4 py-12">
              <BellOff size={32} color="#475569" />
              <Text className="text-sm font-medium text-slate-200">
                Nenhuma notificação por enquanto
              </Text>
              <Text className="text-xs text-slate-500">
                Você está em dia. Avisaremos quando houver novidades.
              </Text>
            </View>
          ) : (
            <View>
              {data.map((n, idx) => (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    if (n.naoLida) marcarLida.mutate(n.id);
                    if (n.faturaId) {
                      router.push(`/(cliente)/faturas/${n.faturaId}`);
                    }
                  }}
                  className={`flex-row items-start gap-3 px-4 py-4 active:bg-slate-800/40 ${
                    idx > 0 ? 'border-t border-slate-800' : ''
                  }`}
                >
                  <View className="mt-1 h-2 w-2 rounded-full"
                        style={{ backgroundColor: n.naoLida ? '#f43f5e' : '#334155' }}
                  />
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text
                        className={`flex-1 text-sm font-medium ${
                          n.naoLida ? 'text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {n.titulo}
                      </Text>
                      <Text className="text-[10px] text-slate-500">
                        {formatDateTime(n.criadoEm)}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400">{n.mensagem}</Text>
                  </View>
                  {n.faturaId && (
                    <ChevronRight size={14} color="#64748b" />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </CardBody>
      </Card>
    </ScrollView>
  );
}
