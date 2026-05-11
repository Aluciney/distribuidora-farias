import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { EsqueciSenhaModal } from '@/features/auth/EsqueciSenhaModal';
import { authService } from '@/features/auth/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import Logo from '@/assets/logo.png'

export default function LoginScreen() {
  const loginUsuarioCliente = useAuthStore((s) => s.loginUsuarioCliente);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('contato@atacadonorte.com.br');
  const [senha, setSenha] = useState('df2026');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [esqueciAberto, setEsqueciAberto] = useState(false);

  async function entrar() {
    setErro(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErro('Informe um email válido.');
      return;
    }
    if (senha.length < 4) {
      setErro('Informe sua senha.');
      return;
    }
    setCarregando(true);
    try {
      const res = await authService.loginCliente({ email, senha });
      loginUsuarioCliente(res.token, res.usuarioCliente);
      toast.sucesso('Bem-vindo!', res.usuarioCliente.nome);
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
            <Image source={Logo} className="w-44 h-28" />
            {/* <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Wallet size={32} color="#34d399" />
            </View>
            <View className="items-center">
              <Text className="text-2xl font-semibold text-slate-100">
                DF Pagamentos
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Distribuidora Farias
              </Text>
            </View> */}
          </View>

          <Card>
            <CardBody className="gap-4">
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <Mail size={16} color="#7dd3fc" />
                  <Text className="text-base font-semibold text-slate-100">
                    Portal do Cliente
                  </Text>
                </View>
                <Text className="text-xs text-slate-400">
                  Use seu email cadastrado para acessar as faturas das suas
                  filiais.
                </Text>
              </View>

              <FormField label="Email" obrigatorio>
                <Input
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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

              <Pressable
                onPress={() => setEsqueciAberto(true)}
                className="self-center py-1"
              >
                <Text className="text-xs text-slate-400 active:text-slate-200">
                  Esqueceu sua senha?
                </Text>
              </Pressable>
            </CardBody>
          </Card>
        </View>
      </ScrollView>

      <EsqueciSenhaModal
        aberto={esqueciAberto}
        onFechar={() => setEsqueciAberto(false)}
        emailInicial={email}
      />
    </KeyboardAvoidingView>
  );
}
