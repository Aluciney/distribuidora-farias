import { type ReactNode } from 'react';
import { View } from 'react-native';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}
    >
      {children}
    </View>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return <View className={`p-4 ${className}`}>{children}</View>;
}
