import { useState } from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { CreditCard, ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { usePagarComCartao } from '@/features/faturas/useFaturas';
import {
  apenasDigitos,
  detectarBandeira,
  formatCurrency,
  maskNumeroCartao,
  maskValidade,
} from '@/lib/format';
import type { Fatura } from '@/types';

interface CartaoFormProps {
  fatura: Fatura;
  onPagamentoConfirmado: () => void;
}

interface ErrosCartao {
  numero?: string;
  nomeImpresso?: string;
  validade?: string;
  cvv?: string;
}

export function CartaoForm({ fatura, onPagamentoConfirmado }: CartaoFormProps) {
  const pagar = usePagarComCartao();
  const [numero, setNumero] = useState('');
  const [nomeImpresso, setNomeImpresso] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [erros, setErros] = useState<ErrosCartao>({});

  const bandeira = detectarBandeira(numero);

  function validar(): boolean {
    const e: ErrosCartao = {};
    const digitos = apenasDigitos(numero);
    if (digitos.length < 13 || digitos.length > 19)
      e.numero = 'Número inválido (13–19 dígitos).';
    if (!bandeira) e.numero = 'Bandeira não reconhecida.';
    if (nomeImpresso.trim().length < 2) e.nomeImpresso = 'Informe o nome.';
    if (!/^\d{2}\/\d{2}$/.test(validade))
      e.validade = 'Use o formato MM/AA.';
    if (cvv.length < 3 || cvv.length > 4) e.cvv = 'CVV inválido.';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function pagarAgora() {
    if (!validar()) return;
    await pagar.mutateAsync({
      id: fatura.id,
      payload: {
        numero: apenasDigitos(numero),
        nomeImpresso: nomeImpresso.toUpperCase().trim(),
        validade,
        cvv,
        parcelas,
      },
    });
    onPagamentoConfirmado();
  }

  const valorPorParcela = (n: number) => fatura.valor / n;

  return (
    <View className="gap-4">
      <View className="flex-row items-start gap-2 rounded-lg border border-sky-900/60 bg-sky-950/30 p-3">
        <ShieldCheck size={16} color="#7dd3fc" />
        <Text className="flex-1 text-xs text-sky-200">
          Os dados do cartão são enviados ao gateway de pagamento. Nenhum dado
          sensível é armazenado no servidor.
        </Text>
      </View>

      <FormField label="Número do cartão" obrigatorio erro={erros.numero}>
        <Input
          placeholder="0000 0000 0000 0000"
          value={maskNumeroCartao(numero)}
          onChangeText={(v) => setNumero(maskNumeroCartao(v))}
          keyboardType="numeric"
          autoComplete="cc-number"
          invalido={Boolean(erros.numero)}
          iconeEsquerda={<CreditCard size={16} color="#94a3b8" />}
          iconeDireita={
            bandeira ? (
              <Text className="text-xs font-semibold text-slate-200">
                {bandeira}
              </Text>
            ) : null
          }
        />
      </FormField>

      <FormField
        label="Nome impresso no cartão"
        obrigatorio
        erro={erros.nomeImpresso}
      >
        <Input
          placeholder="MARIA D ALMEIDA"
          value={nomeImpresso}
          onChangeText={setNomeImpresso}
          autoCapitalize="characters"
          autoComplete="cc-name"
          invalido={Boolean(erros.nomeImpresso)}
        />
      </FormField>

      <View className="flex-row gap-3">
        <FormField
          label="Validade (MM/AA)"
          obrigatorio
          erro={erros.validade}
          className="flex-1"
        >
          <Input
            placeholder="12/30"
            value={validade}
            onChangeText={(v) => setValidade(maskValidade(v))}
            keyboardType="numeric"
            autoComplete="cc-exp"
            maxLength={5}
            invalido={Boolean(erros.validade)}
          />
        </FormField>
        <FormField
          label="CVV"
          obrigatorio
          erro={erros.cvv}
          className="w-28"
        >
          <Input
            placeholder="000"
            value={cvv}
            onChangeText={(v) => setCvv(apenasDigitos(v).slice(0, 4))}
            keyboardType="numeric"
            secureTextEntry
            autoComplete="cc-csc"
            maxLength={4}
            invalido={Boolean(erros.cvv)}
          />
        </FormField>
      </View>

      <FormField label="Parcelas" obrigatorio>
        <View className="flex-row flex-wrap gap-2">
          {[1, 2, 3, 6, 12].map((n) => {
            const ativo = parcelas === n;
            return (
              <Pressable
                key={n}
                onPress={() => setParcelas(n)}
                className={`flex-1 min-w-[80px] rounded-lg border px-2 py-2 ${
                  ativo
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    ativo ? 'text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  {n}x
                </Text>
                <Text
                  className={`mt-0.5 text-center text-[10px] ${
                    ativo ? 'text-emerald-300/80' : 'text-slate-500'
                  }`}
                >
                  {formatCurrency(Math.round(valorPorParcela(n)))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <View className="flex-row items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <Text className="text-sm text-slate-400">Total a pagar</Text>
        <Text className="text-base font-semibold text-slate-100">
          {formatCurrency(fatura.valor)}
        </Text>
      </View>

      <Button onPress={pagarAgora} loading={pagar.isPending}>
        Pagar agora
      </Button>
    </View>
  );
}
