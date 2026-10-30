import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { AppHeader } from './src/components/AppHeader';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent() {
  const { colors, dark } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <MatchesScreen />
      <StatusBar style={dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, paddingTop: Platform.OS === 'web' ? 0 : 48 },
});
