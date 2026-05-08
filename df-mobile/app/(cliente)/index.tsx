import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Layers,
  LogOut,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { Card, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useDashboardCliente } from '@/features/dashboard/useDashboard';
import { BotaoSeletorFilial } from '@/features/portal/BotaoSeletorFilial';
import { useAuthStore } from '@/store/auth.store';
import { StatusFatura } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuarioCliente);
  const filialSelecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const filialAtiva = filialSelecionadaId
    ? usuario?.filiais.find((f) => f.id === filialSelecionadaId)
    : null;
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, isError, refetch, isRefetching } =
    useDashboardCliente();

  const totalGasto = data?.totalGasto ?? 0;
  const totalEmAberto = data?.totalEmAberto ?? 0;
  const totalVencido = data?.totalVencido ?? 0;
  const qtdAberto = data?.qtdFaturasEmAberto ?? 0;
  const proximas = data?.proximas ?? [];
  const totalFiliais = usuario?.filiais.length ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 24,
        paddingHorizontal: 16,
        gap: 20,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#34d399"
        />
      }
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs uppercase tracking-wider text-slate-500">
            Bem-vindo de volta
          </Text>
          <Text className="mt-1 text-2xl font-semibold text-slate-100">
            {usuario?.nome ?? 'Carregando...'}
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            {filialAtiva ? (
              <>
                <Building2 size={12} color="#7dd3fc" />
                <Text className="text-xs text-slate-400">
                  {filialAtiva.nomeFantasia ?? filialAtiva.razaoSocial}
                </Text>
              </>
            ) : (
              <>
                <Layers size={12} color="#34d399" />
                <Text className="text-xs text-slate-400">
                  Visão consolidada de {totalFiliais} filial(is)
                </Text>
              </>
            )}
          </View>
        </View>
        <Pressable
          onPress={logout}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 active:bg-slate-800"
          accessibilityLabel="Sair"
        >
          <LogOut size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-wider text-slate-500">
          Filtro
        </Text>
        <BotaoSeletorFilial />
      </View>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex-row items-center gap-2">
            <AlertCircle size={16} color="#fda4af" />
            <Text className="text-sm text-rose-200">
              Não foi possível carregar suas faturas.
            </Text>
          </CardBody>
        </Card>
      )}

      <View className="gap-3">
        <Kpi
          titulo="Total gasto"
          valor={formatCurrency(totalGasto)}
          legenda="Faturas pagas"
          icone={<Wallet size={18} color="#34d399" />}
          tom="emerald"
          carregando={isLoading}
        />
        <Kpi
          titulo="Em aberto"
          valor={formatCurrency(totalEmAberto)}
          legenda="Aguardando pagamento"
          icone={<TrendingUp size={18} color="#7dd3fc" />}
          tom="sky"
          carregando={isLoading}
        />
        <Kpi
          titulo="Vencidas"
          valor={formatCurrency(totalVencido)}
          legenda="Regularize quanto antes"
          icone={<AlertCircle size={18} color="#fda4af" />}
          tom="rose"
          carregando={isLoading}
        />
        <Kpi
          titulo="Faturas em aberto"
          valor={String(qtdAberto)}
          legenda="Pendentes + vencidas"
          icone={<CalendarClock size={18} color="#fcd34d" />}
          tom="amber"
          carregando={isLoading}
        />
      </View>

      <Card>
        <CardBody className="gap-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-slate-100">
                Próximos vencimentos
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                Toque numa fatura para pagar agora.
              </Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(cliente)/faturas')}
            >
              Ver todas
            </Button>
          </View>

          {isLoading ? (
            <View className="gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  className="h-14 rounded-lg bg-slate-800/40"
                />
              ))}
            </View>
          ) : proximas.length === 0 ? (
            <View className="items-center gap-2 py-8">
              <CheckCircle2 size={32} color="#34d399" />
              <Text className="text-sm font-medium text-slate-200">
                Nenhuma fatura em aberto
              </Text>
              <Text className="text-xs text-slate-500">
                Você está em dia com a Distribuidora Farias.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {proximas.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => router.push(`/(cliente)/faturas/${f.id}`)}
                  className="flex-row items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 active:bg-slate-800/50"
                >
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-mono text-xs text-slate-500">
                        {f.numero}
                      </Text>
                      <Badge
                        tom={
                          f.status === StatusFatura.VENCIDO ? 'rose' : 'amber'
                        }
                      >
                        {f.status === StatusFatura.VENCIDO
                          ? 'VENCIDA'
                          : 'PENDENTE'}
                      </Badge>
                    </View>
                    {!filialAtiva && (
                      <View className="flex-row items-center gap-1">
                        <Building2 size={10} color="#7dd3fc" />
                        <Text
                          className="text-[11px] text-slate-400"
                          numberOfLines={1}
                        >
                          {f.filial.nomeFantasia ?? f.filial.razaoSocial}
                        </Text>
                      </View>
                    )}
                    <Text className="text-sm text-slate-200">
                      Vence em {formatDate(f.dataVencimento)}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-100">
                    {formatCurrency(f.valor)}
                  </Text>
                  <ArrowRight size={16} color="#64748b" />
                </Pressable>
              ))}
            </View>
          )}
        </CardBody>
      </Card>
    </ScrollView>
  );
}

interface KpiProps {
  titulo: string;
  valor: string;
  legenda?: string;
  icone: React.ReactNode;
  tom: 'emerald' | 'sky' | 'amber' | 'rose';
  carregando?: boolean;
}

const KPI_BG: Record<KpiProps['tom'], string> = {
  emerald: 'bg-emerald-500/10',
  sky: 'bg-sky-500/10',
  amber: 'bg-amber-500/10',
  rose: 'bg-rose-500/10',
};

function Kpi({ titulo, valor, legenda, icone, tom, carregando }: KpiProps) {
  return (
    <Card>
      <CardBody className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {titulo}
          </Text>
          {carregando ? (
            <View className="mt-1 h-7 w-32 rounded bg-slate-800" />
          ) : (
            <Text className="text-2xl font-semibold text-slate-100">
              {valor}
            </Text>
          )}
          {legenda && !carregando && (
            <Text className="text-xs text-slate-500">{legenda}</Text>
          )}
        </View>
        <View
          className={`h-10 w-10 items-center justify-center rounded-lg ${KPI_BG[tom]}`}
        >
          {icone}
        </View>
      </CardBody>
    </Card>
  );
}
