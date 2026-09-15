import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { colors } from '@/theme';

type NameVariants = Exclude<SymbolViewProps['name'], string>;
export type IconName = NonNullable<NameVariants['android']>;

/** Material Symbols, one weight throughout. */
export function Icon({ name, size = 24, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <SymbolView name={{ android: name }} size={size} tintColor={color} />;
}
