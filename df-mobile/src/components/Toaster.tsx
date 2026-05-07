import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, type ToastTom } from '@/store/toast.store';

const TOM_BORDER: Record<ToastTom, string> = {
  success: 'border-emerald-500/60',
  error: 'border-rose-500/60',
  info: 'border-sky-500/60',
};

const TOM_BG: Record<ToastTom, string> = {
  success: 'bg-emerald-950/80',
  error: 'bg-rose-950/80',
  info: 'bg-sky-950/80',
};

const TOM_TEXT: Record<ToastTom, string> = {
  success: 'text-emerald-200',
  error: 'text-rose-200',
  info: 'text-sky-200',
};

export function Toaster() {
  const itens = useToastStore((s) => s.itens);
  const remover = useToastStore((s) => s.remover);
  const insets = useSafeAreaInsets();

  if (itens.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}
      className="items-center gap-2 px-4"
    >
      {itens.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => remover(t.id)}
          className={`w-full max-w-md rounded-lg border px-3 py-2 ${TOM_BORDER[t.tom]} ${TOM_BG[t.tom]}`}
        >
          <Text className={`text-sm font-semibold ${TOM_TEXT[t.tom]}`}>
            {t.titulo}
          </Text>
          {t.mensagem && (
            <Text className={`mt-0.5 text-xs ${TOM_TEXT[t.tom]} opacity-80`}>
              {t.mensagem}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
