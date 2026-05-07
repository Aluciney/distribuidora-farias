import { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowRight, FileText } from 'lucide-react-native';
import { Card, CardBody } from '@/components/Card';
import { Badge, type Tom } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useFaturas } from '@/features/faturas/useFaturas';
import { StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

type Aba = 'ABERTOS' | 'PAGOS' | 'VENCIDOS';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'ABERTOS', rotulo: 'Abertos' },
  { valor: 'PAGOS', rotulo: 'Pagos' },
  { valor: 'VENCIDOS', rotulo: 'Vencidos' },
];

const STATUS_TOM: Record<StatusFatura, Tom> = {
  PAGO: 'emerald',
  PENDENTE: 'amber',
  VENCIDO: 'rose',
  CANCELADO: 'slate',
  ESTORNADO: 'violet',
};

function statusFiltro(aba: Aba): StatusFatura {
  if (aba === 'ABERTOS') return StatusFatura.PENDENTE;
  if (aba === 'PAGOS') return StatusFatura.PAGO;
  return StatusFatura.VENCIDO;
}

export default function FaturasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('ABERTOS');
  const [pagina, setPagina] = useState(1);
  const PORPAGINA = 10;

  useEffect(() => {
    setPagina(1);
  }, [aba]);

  const { data, isLoading, isError, refetch, isRefetching } = useFaturas({
    status: statusFiltro(aba),
    pagina,
    porPagina: PORPAGINA,
  });
  const faturas = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PORPAGINA));

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
          Minhas Faturas
        </Text>
        <Text className="mt-1 text-sm text-slate-400">
          Pague com Boleto, PIX ou cartão de crédito.
        </Text>
      </View>

      <View className="flex-row gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
        {ABAS.map((opcao) => {
          const ativo = aba === opcao.valor;
          return (
            <Pressable
              key={opcao.valor}
              onPress={() => setAba(opcao.valor)}
              className={`flex-1 items-center justify-center rounded-md py-2 ${
                ativo ? 'bg-sky-500/10' : ''
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  ativo ? 'text-sky-300' : 'text-slate-400'
                }`}
              >
                {opcao.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex-row items-center justify-between gap-3">
            <View className="flex-row flex-1 items-center gap-2">
              <AlertCircle size={16} color="#fda4af" />
              <Text className="text-sm text-rose-200">
                Não foi possível carregar suas faturas.
              </Text>
            </View>
            <Button variant="outline" size="sm" onPress={refetch}>
              Tentar
            </Button>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <View className="gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} className="h-20 rounded-lg bg-slate-800/40" />
          ))}
        </View>
      ) : faturas.length === 0 ? (
        <View className="items-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-4 py-12">
          <FileText size={36} color="#475569" />
          <Text className="text-sm font-medium text-slate-200">
            {aba === 'ABERTOS' && 'Nenhuma fatura em aberto'}
            {aba === 'PAGOS' && 'Nenhuma fatura paga ainda'}
            {aba === 'VENCIDOS' && 'Sem faturas vencidas — parabéns!'}
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {faturas.map((f: Fatura) => (
            <Pressable
              key={f.id}
              onPress={() => router.push(`/(cliente)/faturas/${f.id}`)}
              className="flex-row items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 active:bg-slate-800/60"
            >
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-mono text-xs text-slate-500">
                    {f.numero}
                  </Text>
                  <Badge tom={STATUS_TOM[f.status]}>{f.status}</Badge>
                </View>
                <Text className="text-sm text-slate-200">
                  {f.status === StatusFatura.PAGO
                    ? `Paga em ${f.dataPagamento ? formatDate(f.dataPagamento) : '—'}`
                    : `Vence em ${formatDate(f.dataVencimento)}`}
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

      {total > PORPAGINA && (
        <View className="flex-row items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1}
            onPress={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Text className="text-xs text-slate-400">
            Página {pagina} de {totalPaginas}
          </Text>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas}
            onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          >
            Próxima
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
