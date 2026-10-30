import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function AppHeader() {
  const { colors, dark, toggleTheme } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
            <Text style={[styles.brandLetter, { color: colors.accentText }]}>М</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>МАТЧЦЕНТР</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
          onPress={toggleTheme}
          style={({ pressed }) => [styles.themeButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.themeText, { color: colors.muted }]}>{dark ? '☀  Светлая' : '☾  Тёмная'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexShrink: 0, borderBottomWidth: 1 },
  inner: { width: '100%', maxWidth: 860, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  brandName: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  themeButton: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 },
  themeText: { fontSize: 14 },
});
