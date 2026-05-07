import { forwardRef, type ReactNode } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  invalido?: boolean;
  iconeEsquerda?: ReactNode;
  iconeDireita?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { invalido, iconeEsquerda, iconeDireita, className = '', style, ...rest },
  ref,
) {
  return (
    <View
      className={`flex-row items-center gap-2 rounded-lg border bg-slate-900 px-3 ${
        invalido ? 'border-rose-500' : 'border-slate-700'
      } ${className}`}
    >
      {iconeEsquerda && <View>{iconeEsquerda}</View>}
      <TextInput
        ref={ref}
        placeholderTextColor="#64748b"
        className="flex-1 py-3 text-base text-slate-100"
        style={style}
        {...rest}
      />
      {iconeDireita && <View>{iconeDireita}</View>}
    </View>
  );
});
