import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { MATCHES_URL } from '../config';
import type { MatchesResponse } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { filterMatches, type MatchFilter } from '../utils/filterMatches';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: MatchesResponse; updatedAt: Date };

const filters: { value: MatchFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
  { value: 'favorites', label: 'Избранные' },
];

export function MatchesScreen() {
  const { favorites, isFavorite, toggle } = useFavorites();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [errorPopupVisible, setErrorPopupVisible] = useState(false);

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
          setErrorPopupVisible(true);
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
    if (refreshing) return;
    setErrorPopupVisible(false);
    setRefreshError(null);
    setRefreshing(true);
    setAttempt(value => value + 1);
  }

  const matches = state.status === 'success' ? state.data.matches : [];
  const query = search.trim().toLocaleLowerCase('ru-RU');
  const visibleMatches = filterMatches(matches, filter, favorites, search);

  const emptyTitle = query ? 'Матчи не найдены'
    : filter === 'favorites' ? 'Избранных матчей пока нет'
    : matches.length === 0 ? 'Матчей пока нет' : 'В этой категории матчей нет';
  const emptyHint = query ? 'Измените название клуба или выберите другую категорию.'
    : filter === 'favorites' ? 'Нажмите на звёздочку в карточке матча, чтобы добавить его сюда.'
    : matches.length === 0 ? 'Расписание этого тура ещё не опубликовано.'
    : 'Выберите другой фильтр, чтобы увидеть остальные матчи.';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      {(state.status === 'loading' || (state.status === 'error' && refreshing)) && (
        <View style={styles.message}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.secondary}>Загружаем матчи…</Text>
        </View>
      )}
      {state.status === 'error' && !refreshing && (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>Не удалось загрузить матчи</Text>
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
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по названию клуба"
            accessibilityLabel="Поиск по названию клуба"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setSearch('')} style={styles.clearSearch}>
              <Text style={styles.filterText}>Очистить</Text>
            </Pressable>
          )}
        </View>
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
            <Text style={styles.buttonText}>Обновить</Text>
          </Pressable>
        </View>
        {refreshing ? (
          <View style={styles.message}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.secondary}>Обновляем матчи…</Text>
          </View>
        ) : <FlatList
          data={visibleMatches}
          keyExtractor={match => match.id}
          extraData={favorites}
          renderItem={({ item }) => (
            <MatchCard match={item} favorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item.id)} />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.secondary}>Тур {state.data.round} · Время указано в вашем часовом поясе</Text>
          }
          ListEmptyComponent={
            <View style={styles.message}>
              <Text style={styles.messageTitle}>{emptyTitle}</Text>
              <Text style={styles.secondary}>{emptyHint}</Text>
            </View>
          }
        />}
      </>}
      <Modal
        transparent
        animationType="fade"
        visible={errorPopupVisible}
        onRequestClose={() => setErrorPopupVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.popup} accessibilityViewIsModal>
            <Text style={styles.messageTitle}>Не удалось загрузить матчи</Text>
            <Text style={styles.error} accessibilityRole="alert">{refreshError}</Text>
            {state.status === 'success' && <Text style={styles.secondary}>Сохранены данные предыдущей загрузки.</Text>}
            <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Повторить</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setErrorPopupVisible(false)} style={styles.closeButton}>
              <Text style={styles.filterText}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111827' },
  list: { gap: 12, paddingBottom: 24 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
  clearSearch: { paddingVertical: 12, paddingHorizontal: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  popup: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 16 },
  closeButton: { alignItems: 'center', padding: 12 },
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
  button: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
