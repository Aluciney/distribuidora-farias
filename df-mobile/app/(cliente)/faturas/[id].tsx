import { useCallback, useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import {
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  Copy,
  CreditCard,
  Download,
  QrCode,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card, CardBody } from '@/components/Card';
import { Badge, type Tom } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CartaoForm } from '@/features/faturas/CartaoForm';
import { faturasService } from '@/features/faturas/faturas.service';
import { useFatura } from '@/features/faturas/useFaturas';
import {
  MetodoPagamento,
  StatusFatura,
  type Fatura,
} from '@/types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/format';
import { toast } from '@/store/toast.store';

type Aba = 'BOLETO' | 'PIX' | 'CARTAO';

const STATUS_TOM: Record<StatusFatura, Tom> = {
  PAGO: 'emerald',
  PENDENTE: 'amber',
  VENCIDO: 'rose',
  CANCELADO: 'slate',
  ESTORNADO: 'violet',
};

const STATUS_LABEL: Record<StatusFatura, string> = {
  PAGO: 'Paga',
  PENDENTE: 'Pendente',
  VENCIDO: 'Vencida',
  CANCELADO: 'Cancelada',
  ESTORNADO: 'Estornada',
};

const METODO_LABEL: Record<MetodoPagamento, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  DINHEIRO: 'Dinheiro',
};

export default function FaturaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: fatura, isLoading, refetch } = useFatura(id);
  const [aba, setAba] = useState<Aba>('BOLETO');

  // Re-busca sempre que o usuário volta pra essa tela (push/pop no stack do
  // expo-router) — sem isso o screen fica vivo na pilha e o React Query
  // devolve o cache antigo (admin pode ter dado baixa enquanto isso).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Idem quando o app volta do background — comum no fluxo "abro o app do
  // banco pra pagar, volto pro nosso app pra ver se já caiu".
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-slate-950"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-sm text-slate-400">Carregando fatura...</Text>
      </View>
    );
  }

  if (!fatura) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 bg-slate-950 px-4"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-base text-slate-200">Fatura não encontrada.</Text>
        <Button variant="outline" onPress={() => router.back()}>
          Voltar
        </Button>
      </View>
    );
  }

  const podePagar =
    fatura.status === StatusFatura.PENDENTE ||
    fatura.status === StatusFatura.VENCIDO;

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        paddingHorizontal: 16,
        gap: 16,
      }}
    >
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => router.back()}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 active:bg-slate-800"
        >
          <ArrowLeft size={18} color="#94a3b8" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xs uppercase tracking-wider text-slate-500">
            Fatura
          </Text>
          <Text className="text-lg font-semibold text-slate-100">
            {fatura.numero}
          </Text>
          {fatura.cliente && (
            <View className="mt-0.5 flex-row items-center gap-1">
              <Building2 size={11} color="#7dd3fc" />
              <Text className="text-xs text-slate-400" numberOfLines={1}>
                {fatura.cliente.nomeFantasia ?? fatura.cliente.razaoSocial}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Card>
        <CardBody className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-wider text-slate-500">
              Valor
            </Text>
            <Text className="mt-1 text-3xl font-semibold text-slate-100">
              {formatCurrency(fatura.valor)}
            </Text>
            <Text className="mt-1 text-xs text-slate-400">
              Vencimento: {formatDate(fatura.dataVencimento)}
            </Text>
          </View>
          <View className="items-end gap-2">
            <Badge tom={STATUS_TOM[fatura.status]}>
              {STATUS_LABEL[fatura.status].toUpperCase()}
            </Badge>
            {fatura.pagamento && (
              <Text className="text-[10px] text-slate-400">
                Pago via{' '}
                <Text className="font-semibold text-slate-200">
                  {METODO_LABEL[fatura.pagamento.metodo]}
                </Text>
              </Text>
            )}
          </View>
        </CardBody>
      </Card>

      {fatura.status === StatusFatura.PAGO && (
        <Card className="border-emerald-900/60 bg-emerald-950/30">
          <CardBody className="gap-1">
            <Text className="text-sm font-semibold text-emerald-200">
              Pagamento confirmado
            </Text>
            {fatura.dataPagamento && (
              <Text className="text-xs text-emerald-200/80">
                em {formatDateTime(fatura.dataPagamento)}
              </Text>
            )}
            {fatura.pagamento?.cartao && (
              <Text className="text-xs text-emerald-200/80">
                Cartão {fatura.pagamento.cartao.bandeira} final{' '}
                {fatura.pagamento.cartao.ultimosDigitos} —{' '}
                {fatura.pagamento.cartao.parcelas}x
              </Text>
            )}
          </CardBody>
        </Card>
      )}

      {fatura.status === StatusFatura.CANCELADO && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody>
            <Text className="text-sm font-semibold text-rose-200">
              Esta fatura foi cancelada.
            </Text>
            {fatura.motivoCancelamento && (
              <Text className="mt-1 text-xs text-rose-200/80">
                {fatura.motivoCancelamento}
              </Text>
            )}
          </CardBody>
        </Card>
      )}

      {podePagar && (
        <>
          <View className="flex-row gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <TabButton
              ativo={aba === 'BOLETO'}
              onPress={() => setAba('BOLETO')}
              icone={
                <Banknote
                  size={14}
                  color={aba === 'BOLETO' ? '#34d399' : '#94a3b8'}
                />
              }
            >
              Boleto
            </TabButton>
            <TabButton
              ativo={aba === 'PIX'}
              onPress={() => setAba('PIX')}
              icone={
                <QrCode
                  size={14}
                  color={aba === 'PIX' ? '#34d399' : '#94a3b8'}
                />
              }
            >
              PIX
            </TabButton>
            <TabButton
              ativo={aba === 'CARTAO'}
              onPress={() => setAba('CARTAO')}
              icone={
                <CreditCard
                  size={14}
                  color={aba === 'CARTAO' ? '#34d399' : '#94a3b8'}
                />
              }
            >
              Cartão
            </TabButton>
          </View>

          {aba === 'BOLETO' && <BoletoView fatura={fatura} />}
          {aba === 'PIX' && <PixView fatura={fatura} />}
          {aba === 'CARTAO' && (
            <CartaoForm
              fatura={fatura}
              onPagamentoConfirmado={() => router.back()}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

function BoletoView({ fatura }: { fatura: Fatura }) {
  const [baixando, setBaixando] = useState(false);

  async function baixarECompartilhar() {
    try {
      setBaixando(true);
      const uri = await faturasService.baixarPdf(
        fatura.id,
        `boleto-${fatura.numero}.pdf`,
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Boleto ${fatura.numero}`,
        });
      } else {
        toast.sucesso('Boleto baixado', `Salvo em ${uri}`);
      }
    } catch (err) {
      toast.erro(
        'Falha ao baixar',
        err instanceof Error ? err.message : 'Erro inesperado.',
      );
    } finally {
      setBaixando(false);
    }
  }

  return (
    <Card>
      <CardBody className="gap-3">
        <Text className="text-[10px] uppercase tracking-wider text-slate-500">
          Linha digitável
        </Text>
        <Text className="font-mono text-sm text-slate-100">
          {fatura.boleto.linhaDigitavel}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-slate-500">
            Nosso número: {fatura.boleto.nossoNumero}
          </Text>
          <CopyButton
            valor={fatura.boleto.linhaDigitavel.replace(/\D/g, '')}
            rotulo="Copiar linha digitável"
          />
        </View>
        <Button
          variant="outline"
          onPress={baixarECompartilhar}
          loading={baixando}
          iconeEsquerda={<Download size={14} color="#94a3b8" />}
        >
          Baixar boleto (PDF)
        </Button>
        <Text className="text-xs text-slate-500">
          Cole a linha digitável no app do seu banco. A confirmação pode levar
          até 2 dias úteis.
        </Text>
      </CardBody>
    </Card>
  );
}

function PixView({ fatura }: { fatura: Fatura }) {
  return (
    <Card>
      <CardBody className="gap-4">
        <View className="items-center rounded-lg bg-white p-4">
          <QRCode value={fatura.pix.copiaECola} size={200} />
        </View>
        <View>
          <Text className="text-[10px] uppercase tracking-wider text-slate-500">
            Copia e Cola
          </Text>
          <Text
            numberOfLines={3}
            className="mt-1 font-mono text-xs text-slate-200"
          >
            {fatura.pix.copiaECola}
          </Text>
        </View>
        <CopyButton valor={fatura.pix.copiaECola} rotulo="Copiar Copia e Cola" />
        <Text className="text-xs text-slate-500">
          Pague via PIX para confirmação instantânea. Use o app do seu banco e
          leia o QR ou cole o código.
        </Text>
      </CardBody>
    </Card>
  );
}

interface CopyButtonProps {
  valor: string;
  rotulo: string;
}

function CopyButton({ valor, rotulo }: CopyButtonProps) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    await Clipboard.setStringAsync(valor);
    setCopiado(true);
    toast.sucesso('Copiado!', 'Texto copiado para a área de transferência.');
    setTimeout(() => setCopiado(false), 1_500);
  }
  return (
    <Pressable
      onPress={copiar}
      className="flex-row items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 active:bg-slate-800"
    >
      {copiado ? (
        <Check size={14} color="#34d399" />
      ) : (
        <Copy size={14} color="#94a3b8" />
      )}
      <Text
        className={`text-xs font-medium ${
          copiado ? 'text-emerald-300' : 'text-slate-200'
        }`}
      >
        {copiado ? 'Copiado' : rotulo}
      </Text>
    </Pressable>
  );
}

interface TabButtonProps {
  ativo: boolean;
  icone: React.ReactNode;
  onPress: () => void;
  children: React.ReactNode;
}

function TabButton({ ativo, icone, onPress, children }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-2 ${
        ativo ? 'bg-emerald-500/10' : ''
      }`}
    >
      {icone}
      <Text
        className={`text-xs font-medium ${
          ativo ? 'text-emerald-300' : 'text-slate-400'
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
