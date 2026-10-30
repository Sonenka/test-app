import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  active: boolean;
  onPress: () => void;
};

// Звёздочка «в избранное».
export function FavoriteButton({ active, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? 'Убрать из избранного' : 'Добавить в избранное'}
      style={({ pressed }) => [styles.button, { backgroundColor: active ? colors.favoriteBackground : colors.raised, opacity: pressed ? 0.6 : 1 }]}
    >
      <Text style={[styles.star, { color: active ? colors.favorite : colors.muted }]}>{active ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  star: {
    fontSize: 22,
  },
});
