import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Building2, ChevronDown, Layers } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth.store';
import { SeletorFilialModal } from './SeletorFilialModal';

/**
 * Botão compacto que abre o `SeletorFilialModal`. Pensado para ser
 * encaixado nos cabeçalhos das telas do portal cliente. Some quando a
 * holding tem só uma filial — não há nada para escolher.
 */
export function BotaoSeletorFilial() {
  const filiais = useAuthStore((s) => s.usuarioCliente?.filiais ?? []);
  const selecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const [aberto, setAberto] = useState(false);

  if (filiais.length <= 1) return null;

  const atual = selecionadaId
    ? filiais.find((f) => f.id === selecionadaId)
    : null;

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        className="flex-row items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 active:bg-slate-800"
      >
        {atual ? (
          <Building2 size={14} color="#7dd3fc" />
        ) : (
          <Layers size={14} color="#34d399" />
        )}
        <View className="max-w-[140px]">
          <Text className="text-xs font-medium text-slate-100" numberOfLines={1}>
            {atual ? atual.nomeFantasia ?? atual.razaoSocial : 'Todas'}
          </Text>
        </View>
        <ChevronDown size={12} color="#64748b" />
      </Pressable>

      <SeletorFilialModal aberto={aberto} onFechar={() => setAberto(false)} />
    </>
  );
}
