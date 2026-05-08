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
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Star,
  UserCircle,
} from 'lucide-react-native';
import { Badge, type Tom } from '@/components/Badge';
import { Card, CardBody } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/Input';
import { AlterarSenhaModal } from '@/features/auth/AlterarSenhaModal';
import {
  useAtualizarContatoCliente,
  useClientePerfil,
  type PerfilFilial,
} from '@/features/perfil/perfil.service';
import { useAuthStore } from '@/store/auth.store';
import { StatusCliente } from '@/types';
import { apenasDigitos, maskCNPJ, maskTelefone } from '@/lib/format';

const STATUS_TOM: Record<StatusCliente, Tom> = {
  ATIVO: 'emerald',
  INATIVO: 'slate',
  BLOQUEADO: 'rose',
};

const STATUS_LABEL: Record<StatusCliente, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
  BLOQUEADO: 'Bloqueada',
};

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const { data: perfil, isLoading, refetch, isRefetching } = useClientePerfil();
  const atualizar = useAtualizarContatoCliente();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [alterarSenhaAberto, setAlterarSenhaAberto] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome);
      setTelefone(maskTelefone(perfil.telefone));
    }
  }, [perfil]);

  const nomeDirty = perfil != null && nome.trim() !== perfil.nome.trim();
  const telDirty =
    perfil != null && apenasDigitos(telefone) !== apenasDigitos(perfil.telefone);
  const dirty = nomeDirty || telDirty;

  async function salvar() {
    setErro(null);
    if (telDirty) {
      const digitos = apenasDigitos(telefone);
      if (digitos.length !== 10 && digitos.length !== 11) {
        setErro('Telefone deve ter 10 ou 11 dígitos (com DDD).');
        return;
      }
    }
    if (nomeDirty && nome.trim().length < 2) {
      setErro('Nome muito curto.');
      return;
    }
    await atualizar.mutateAsync({
      nome: nomeDirty ? nome.trim() : undefined,
      telefone: telDirty ? telefone : undefined,
    });
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
              Seus dados de acesso ao portal e as filiais que você administra.
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
                Meus dados
              </Text>
            </View>

            <FormField label="Nome" obrigatorio>
              <Input
                value={nome}
                onChangeText={setNome}
                editable={!isLoading}
                iconeEsquerda={<UserCircle size={16} color="#94a3b8" />}
              />
            </FormField>

            <FormField
              label="Email (login)"
              ajuda="Para alterar o email, entre em contato com a equipe da DF."
            >
              <Input
                value={perfil?.email ?? ''}
                editable={false}
                iconeEsquerda={<Mail size={16} color="#94a3b8" />}
              />
            </FormField>

            <FormField
              label="Telefone (com DDD)"
              obrigatorio
              erro={erro ?? undefined}
              ajuda="Usado nos avisos da régua e no envio do boleto pelo WhatsApp."
            >
              <Input
                value={telefone}
                onChangeText={(v) => setTelefone(maskTelefone(v))}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                invalido={Boolean(erro)}
                editable={!isLoading}
                iconeEsquerda={<Phone size={16} color="#94a3b8" />}
              />
            </FormField>

            <View className="flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setAlterarSenhaAberto(true)}
                iconeEsquerda={<KeyRound size={14} color="#e2e8f0" />}
              >
                Alterar senha
              </Button>
              <View className="flex-row items-center gap-2">
                {dirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      if (perfil) {
                        setNome(perfil.nome);
                        setTelefone(maskTelefone(perfil.telefone));
                      }
                      setErro(null);
                    }}
                    disabled={atualizar.isPending}
                  >
                    Descartar
                  </Button>
                )}
                <Button
                  size="sm"
                  onPress={salvar}
                  loading={atualizar.isPending}
                  disabled={!dirty}
                  iconeEsquerda={<Save size={14} color="#0f172a" />}
                >
                  Salvar
                </Button>
              </View>
            </View>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="gap-3">
            <View className="flex-row items-center gap-2">
              <Building2 size={16} color="#34d399" />
              <Text className="text-base font-semibold text-slate-100">
                Minhas filiais
              </Text>
              {perfil && (
                <View className="rounded-md bg-slate-800 px-1.5 py-0.5">
                  <Text className="text-xs font-medium text-slate-400">
                    {perfil.filiais.length}
                  </Text>
                </View>
              )}
            </View>

            {isLoading ? (
              <View className="gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <View key={i} className="h-24 rounded-lg bg-slate-800/40" />
                ))}
              </View>
            ) : !perfil || perfil.filiais.length === 0 ? (
              <Text className="py-4 text-center text-xs text-slate-500">
                Nenhuma filial vinculada.
              </Text>
            ) : (
              <View className="gap-2">
                {perfil.filiais.map((f) => (
                  <FilialCard key={f.id} filial={f} />
                ))}
              </View>
            )}
          </CardBody>
        </Card>
      </ScrollView>

      <AlterarSenhaModal
        aberto={alterarSenhaAberto}
        onFechar={() => setAlterarSenhaAberto(false)}
      />
    </KeyboardAvoidingView>
  );
}

function FilialCard({ filial }: { filial: PerfilFilial }) {
  const endereco = `${filial.endereco.logradouro}, ${filial.endereco.numero}${filial.endereco.complemento ? ` — ${filial.endereco.complemento}` : ''} · ${filial.endereco.bairro} · ${filial.endereco.cidade}/${filial.endereco.uf}`;
  return (
    <View className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text
          className="text-sm font-semibold text-slate-100"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {filial.nomeFantasia ?? filial.razaoSocial}
        </Text>
        <Badge tom={STATUS_TOM[filial.status]}>
          {STATUS_LABEL[filial.status]}
        </Badge>
        {filial.principal && (
          <View className="flex-row items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5">
            <Star size={10} color="#fcd34d" />
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Sede
            </Text>
          </View>
        )}
      </View>
      {filial.nomeFantasia && (
        <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
          {filial.razaoSocial}
        </Text>
      )}
      <Text className="mt-1 font-mono text-xs text-slate-400">
        {maskCNPJ(filial.cnpj)}
      </Text>
      <View className="mt-2 flex-row items-start gap-1.5">
        <MapPin size={12} color="#64748b" />
        <Text className="flex-1 text-xs text-slate-400">{endereco}</Text>
      </View>
    </View>
  );
}
