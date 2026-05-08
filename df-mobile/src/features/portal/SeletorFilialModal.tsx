import { Pressable, Text, View } from 'react-native';
import { Building2, Check, Layers, Star } from 'lucide-react-native';
import { Modal } from '@/components/Modal';
import { useAuthStore } from '@/store/auth.store';
import { maskCNPJ } from '@/lib/format';

interface SeletorFilialModalProps {
  aberto: boolean;
  onFechar: () => void;
}

/**
 * Bottom-sheet com a lista de filiais acessíveis pela holding logada.
 * Selecionar `null` mostra dados consolidados de todas as filiais.
 */
export function SeletorFilialModal({
  aberto,
  onFechar,
}: SeletorFilialModalProps) {
  const filiais = useAuthStore((s) => s.usuarioCliente?.filiais ?? []);
  const selecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const setSelecionada = useAuthStore((s) => s.setFilialSelecionada);

  function escolher(id: string | null) {
    setSelecionada(id);
    onFechar();
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Filtrar por filial"
      descricao={
        filiais.length > 1
          ? 'Selecione uma filial específica ou veja todas consolidadas.'
          : 'Sua holding administra apenas uma filial.'
      }
    >
      <View className="gap-1">
        <ItemFilial
          ativo={selecionadaId === null}
          onPress={() => escolher(null)}
          icone={<Layers size={18} color="#34d399" />}
          titulo="Todas as filiais"
          subtitulo={`Consolidar ${filiais.length} loja(s)`}
        />

        {filiais.map((f) => (
          <ItemFilial
            key={f.id}
            ativo={selecionadaId === f.id}
            onPress={() => escolher(f.id)}
            icone={<Building2 size={18} color="#7dd3fc" />}
            titulo={f.nomeFantasia ?? f.razaoSocial}
            subtitulo={`${maskCNPJ(f.cnpj)} · ${f.status.toLowerCase()}`}
            principal={f.principal}
          />
        ))}
      </View>
    </Modal>
  );
}

interface ItemFilialProps {
  ativo: boolean;
  onPress: () => void;
  icone: React.ReactNode;
  titulo: string;
  subtitulo: string;
  principal?: boolean;
}

function ItemFilial({
  ativo,
  onPress,
  icone,
  titulo,
  subtitulo,
  principal,
}: ItemFilialProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-lg border px-3 py-3 active:bg-slate-800 ${
        ativo
          ? 'border-emerald-700/60 bg-emerald-500/10'
          : 'border-slate-800 bg-slate-950/40'
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
        {icone}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className={`text-sm font-semibold ${
              ativo ? 'text-emerald-200' : 'text-slate-100'
            }`}
            numberOfLines={1}
          >
            {titulo}
          </Text>
          {principal && (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5">
              <Star size={10} color="#fcd34d" />
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Sede
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {subtitulo}
        </Text>
      </View>
      {ativo && <Check size={16} color="#34d399" />}
    </Pressable>
  );
}
