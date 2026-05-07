import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Wallet } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { authService, SENHA_DEMO } from '@/features/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import { apenasDigitos, maskCNPJ } from '@/lib/format';

export default function LoginScreen() {
  const loginCliente = useAuthStore((s) => s.loginCliente);
  const insets = useSafeAreaInsets();

  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(null);
    if (apenasDigitos(cnpj).length !== 14) {
      setErro('CNPJ deve ter 14 dígitos.');
      return;
    }
    if (senha.length < 4) {
      setErro('Informe sua senha.');
      return;
    }
    setCarregando(true);
    try {
      const res = await authService.loginCliente({ cnpj, senha });
      loginCliente(res.token, res.cliente);
      toast.sucesso('Bem-vindo!', res.cliente.razaoSocial);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível entrar.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center gap-6">
          <View className="items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Wallet size={32} color="#34d399" />
            </View>
            <View className="items-center">
              <Text className="text-2xl font-semibold text-slate-100">
                DF Pagamentos
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Distribuidora Farias
              </Text>
            </View>
          </View>

          <Card>
            <CardBody className="gap-4">
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <Building2 size={16} color="#7dd3fc" />
                  <Text className="text-base font-semibold text-slate-100">
                    Portal do Cliente
                  </Text>
                </View>
                <Text className="text-xs text-slate-400">
                  Use o CNPJ cadastrado para acessar suas faturas.
                </Text>
              </View>

              <FormField label="CNPJ" obrigatorio>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={maskCNPJ(cnpj)}
                  onChangeText={(v) => setCnpj(maskCNPJ(v))}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </FormField>

              <FormField label="Senha" obrigatorio>
                <Input
                  placeholder="••••••"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </FormField>

              {erro && (
                <View className="rounded-lg border border-rose-900/60 bg-rose-950/40 p-3">
                  <Text className="text-xs text-rose-200">{erro}</Text>
                </View>
              )}

              <Button onPress={entrar} loading={carregando}>
                Entrar
              </Button>

              <View className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <Text className="text-xs font-semibold text-slate-300">
                  Modo demonstração
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  Use{' '}
                  <Text className="font-mono text-emerald-300">
                    {SENHA_DEMO}
                  </Text>{' '}
                  como senha para qualquer cliente cadastrado nos mocks.
                </Text>
              </View>
            </CardBody>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
