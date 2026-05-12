import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  /** Renderizado fixo no rodapé (botões). */
  rodape?: ReactNode;
}

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <RNModal
      visible={aberto}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      statusBarTranslucent
    >
      <Pressable
        onPress={onFechar}
        className="flex-1 justify-end bg-black/60"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-2xl border-t border-slate-800 bg-slate-900"
            style={{ paddingBottom: Math.max(16, insets.bottom) }}
          >
            <View className="flex-row items-start justify-between gap-3 border-b border-slate-800 p-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-100">
                  {titulo}
                </Text>
                {descricao && (
                  <Text className="mt-0.5 text-xs text-slate-400">
                    {descricao}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={onFechar}
                className="rounded-md p-1 active:bg-slate-800"
                accessibilityLabel="Fechar"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>
            <ScrollView
              className="max-h-[70vh]"
              contentContainerStyle={{ padding: 16, gap: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {rodape && (
              <View className="flex-row items-center justify-end gap-2 border-t border-slate-800 p-4">
                {rodape}
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}
