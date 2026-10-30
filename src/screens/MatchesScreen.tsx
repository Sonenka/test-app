import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { MATCHES_URL } from '../config';
import type { MatchesResponse } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: MatchesResponse; updatedAt: Date };

type Filter = 'all' | 'upcoming' | 'finished';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
];

export function MatchesScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function loadMatches() {
      setRefreshError(null);
      setState(previous => previous.status === 'success' ? previous : { status: 'loading' });
      try {
        const response = await fetch(MATCHES_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Сервер вернул ошибку ${response.status}.`);
        const data: MatchesResponse = await response.json();
        if (!data || !Array.isArray(data.matches)) {
          throw new Error('Сервер вернул данные в неожиданном формате.');
        }
        if (active) setState({ status: 'success', data, updatedAt: new Date() });
      } catch (error) {
        if (active) {
          const message = controller.signal.aborted
            ? 'Сервер не ответил вовремя. Попробуйте ещё раз.'
            : error instanceof Error ? error.message : 'Проверьте подключение к интернету.';
          setRefreshError(message);
          setState(previous => previous.status === 'success' ? previous : { status: 'error', message });
        }
      } finally {
        clearTimeout(timeout);
        if (active) setRefreshing(false);
      }
    }

    void loadMatches();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function reload() {
    setRefreshing(true);
    setAttempt(value => value + 1);
  }

  const matches = state.status === 'success' ? state.data.matches : [];
  const visibleMatches = matches.filter(match => {
    if (filter === 'upcoming') return match.status === 'scheduled' || match.status === 'postponed';
    if (filter === 'finished') return match.status === 'finished';
    return true;
  });

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
            onPress={reload}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Повторить</Text>
          </Pressable>
        </View>
      )}
      {state.status === 'success' && <>
        <View style={styles.filters}>
          {filters.map(option => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === option.value }}
              onPress={() => setFilter(option.value)}
              style={[styles.filter, filter === option.value && styles.selectedFilter]}
            >
              <Text style={filter === option.value ? styles.selectedFilterText : styles.filterText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.toolbar}>
          <UpdatedAgo since={state.updatedAt} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: refreshing }}
            disabled={refreshing}
            onPress={reload}
            style={({ pressed }) => [styles.button, (pressed || refreshing) && styles.pressed]}
          >
            <Text style={styles.buttonText}>{refreshing ? 'Обновляем…' : 'Обновить'}</Text>
          </Pressable>
        </View>
        {refreshError && <Text style={styles.error} accessibilityRole="alert">Не удалось обновить. Показаны предыдущие данные. {refreshError}</Text>}
        <FlatList
          data={visibleMatches}
          keyExtractor={match => match.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.secondary}>Тур {state.data.round} · Время указано в вашем часовом поясе</Text>
          }
          ListEmptyComponent={
            <View style={styles.message}>
              <Text style={styles.messageTitle}>{matches.length === 0 ? 'Матчей пока нет' : 'В этой категории матчей нет'}</Text>
              <Text style={styles.secondary}>{matches.length === 0 ? 'Расписание этого тура ещё не опубликовано.' : 'Выберите другой фильтр, чтобы увидеть остальные матчи.'}</Text>
            </View>
          }
        />
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111827' },
  list: { gap: 12, paddingBottom: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filter: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  selectedFilter: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { color: '#374151', fontSize: 14 },
  selectedFilterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  message: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  messageTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  secondary: { fontSize: 14, color: '#6b7280' },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  pressed: { opacity: 0.75 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
