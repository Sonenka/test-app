import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { MATCHES_URL } from '../config';
import type { MatchesResponse } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: MatchesResponse };

export function MatchesScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadMatches() {
      setState({ status: 'loading' });
      try {
        const response = await fetch(MATCHES_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Сервер вернул ошибку ${response.status}.`);
        const data: MatchesResponse = await response.json();
        if (!data || !Array.isArray(data.matches)) {
          throw new Error('Сервер вернул данные в неожиданном формате.');
        }
        if (active) setState({ status: 'success', data });
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: controller.signal.aborted
              ? 'Сервер не ответил вовремя. Попробуйте ещё раз.'
              : error instanceof Error ? error.message : 'Проверьте подключение к интернету.',
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    void loadMatches();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      {state.status === 'loading' && (
        <View style={styles.message}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.secondary}>Загружаем матчи…</Text>
        </View>
      )}
      {state.status === 'error' && (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>Не удалось загрузить матчи</Text>
          <Text style={styles.error} accessibilityRole="alert">{state.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAttempt(value => value + 1)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Повторить</Text>
          </Pressable>
        </View>
      )}
      {state.status === 'success' && (
        <FlatList
          data={state.data.matches}
          keyExtractor={match => match.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.secondary}>Тур {state.data.round} · Время указано в вашем часовом поясе</Text>
          }
          ListEmptyComponent={
            <View style={styles.message}>
              <Text style={styles.messageTitle}>Матчей пока нет</Text>
              <Text style={styles.secondary}>Расписание этого тура ещё не опубликовано.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111827' },
  list: { gap: 12, paddingBottom: 24 },
  message: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  messageTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  secondary: { fontSize: 14, color: '#6b7280' },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  pressed: { opacity: 0.75 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
