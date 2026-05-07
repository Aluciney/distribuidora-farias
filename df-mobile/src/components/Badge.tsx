import { Text, View } from 'react-native';

export type Tom = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'violet';

const TOM_BG: Record<Tom, string> = {
  emerald: 'bg-emerald-500/10',
  amber: 'bg-amber-500/10',
  rose: 'bg-rose-500/10',
  sky: 'bg-sky-500/10',
  slate: 'bg-slate-700/30',
  violet: 'bg-violet-500/10',
};

const TOM_TEXT: Record<Tom, string> = {
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  sky: 'text-sky-300',
  slate: 'text-slate-300',
  violet: 'text-violet-300',
};

interface BadgeProps {
  tom: Tom;
  children: string;
}

export function Badge({ tom, children }: BadgeProps) {
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${TOM_BG[tom]}`}>
      <Text className={`text-[10px] font-semibold uppercase tracking-wider ${TOM_TEXT[tom]}`}>
        {children}
      </Text>
    </View>
  );
}
