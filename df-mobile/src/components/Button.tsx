import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { type ReactNode } from 'react';

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  iconeEsquerda?: ReactNode;
  className?: string;
}

const VARIANT = {
  primary: 'bg-emerald-500 active:bg-emerald-600',
  outline: 'border border-slate-700 bg-transparent active:bg-slate-800',
  danger: 'bg-rose-500 active:bg-rose-600',
  ghost: 'bg-transparent active:bg-slate-800',
} as const;

const VARIANT_TEXT = {
  primary: 'text-slate-950',
  outline: 'text-slate-100',
  danger: 'text-white',
  ghost: 'text-slate-100',
} as const;

const SIZE = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-3',
} as const;

const SIZE_TEXT = {
  sm: 'text-sm',
  md: 'text-base',
} as const;

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconeEsquerda,
  className = '',
}: ButtonProps) {
  const inativo = disabled || loading;
  return (
    <Pressable
      onPress={inativo ? undefined : onPress}
      className={`flex-row items-center justify-center gap-2 rounded-lg ${VARIANT[variant]} ${SIZE[size]} ${inativo ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#0f172a' : '#e2e8f0'} />
      ) : (
        <>
          {iconeEsquerda && <View>{iconeEsquerda}</View>}
          <Text className={`font-semibold ${VARIANT_TEXT[variant]} ${SIZE_TEXT[size]}`}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
