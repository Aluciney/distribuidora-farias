import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  LogOut,
  Mail,
  Phone,
  Save,
  UserCircle,
} from 'lucide-react-native';
import { Card, CardBody } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import {
  useAtualizarTelefoneCliente,
  useClientePerfil,
} from '@/features/perfil/perfil.service';
import { useAuthStore } from '@/store/auth.store';
import { apenasDigitos, maskCNPJ, maskTelefone } from '@/lib/format';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const { data: perfil, isLoading, refetch, isRefetching } = useClientePerfil();
  const atualizar = useAtualizarTelefoneCliente();

  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) setTelefone(maskTelefone(perfil.telefone));
  }, [perfil]);

  const dirty =
    perfil != null && apenasDigitos(telefone) !== apenasDigitos(perfil.telefone);

  async function salvar() {
    setErro(null);
    const digitos = apenasDigitos(telefone);
    if (digitos.length !== 10 && digitos.length !== 11) {
      setErro('Telefone deve ter 10 ou 11 dígitos (com DDD).');
      return;
    }
    await atualizar.mutateAsync(digitos);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 32,
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
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-slate-100">
              Meu perfil
            </Text>
            <Text className="mt-1 text-sm text-slate-400">
              Dados de contato cadastrados na DF Distribuidora.
            </Text>
          </View>
          <Pressable
            onPress={logout}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 active:bg-slate-800"
            accessibilityLabel="Sair"
          >
            <LogOut size={18} color="#94a3b8" />
          </Pressable>
        </View>

        <Card>
          <CardBody className="gap-4">
            <View className="flex-row items-center gap-2">
              <UserCircle size={16} color="#7dd3fc" />
              <Text className="text-base font-semibold text-slate-100">
                Identificação
              </Text>
            </View>

            <FormField label="Razão Social">
              <Input
                value={perfil?.razaoSocial ?? ''}
                editable={false}
                iconeEsquerda={<Building2 size={16} color="#94a3b8" />}
              />
            </FormField>

            <FormField label="CNPJ">
              <Input
                value={perfil ? maskCNPJ(perfil.cnpj) : ''}
                editable={false}
              />
            </FormField>

            <FormField
              label="Email"
              ajuda="Para alterar o email, entre em contato com a equipe da DF."
            >
              <Input
                value={perfil?.email ?? ''}
                editable={false}
                iconeEsquerda={<Mail size={16} color="#94a3b8" />}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="gap-4">
            <View className="flex-row items-center gap-2">
              <Phone size={16} color="#34d399" />
              <Text className="text-base font-semibold text-slate-100">
                Contato
              </Text>
            </View>

            <FormField
              label="Telefone (com DDD)"
              obrigatorio
              erro={erro ?? undefined}
              ajuda="Usado nos avisos da régua de cobrança e no envio do boleto pelo WhatsApp."
            >
              <Input
                value={telefone}
                onChangeText={(v) => setTelefone(maskTelefone(v))}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                invalido={Boolean(erro)}
                editable={!isLoading}
              />
            </FormField>

            <View className="flex-row items-center justify-end gap-2">
              {dirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    if (perfil) setTelefone(maskTelefone(perfil.telefone));
                    setErro(null);
                  }}
                  disabled={atualizar.isPending}
                >
                  Descartar
                </Button>
              )}
              <Button
                onPress={salvar}
                loading={atualizar.isPending}
                disabled={!dirty}
                iconeEsquerda={<Save size={16} color="#0f172a" />}
              >
                Salvar telefone
              </Button>
            </View>
          </CardBody>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
