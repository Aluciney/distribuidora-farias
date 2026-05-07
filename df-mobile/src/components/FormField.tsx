import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface FormFieldProps {
  label: string;
  obrigatorio?: boolean;
  erro?: string;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  obrigatorio,
  erro,
  ajuda,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <View className={`gap-1.5 ${className}`}>
      <Text className="text-xs font-medium text-slate-300">
        {label}
        {obrigatorio && <Text className="text-rose-400"> *</Text>}
      </Text>
      {children}
      {erro ? (
        <Text className="text-xs text-rose-400">{erro}</Text>
      ) : ajuda ? (
        <Text className="text-xs text-slate-500">{ajuda}</Text>
      ) : null}
    </View>
  );
}
