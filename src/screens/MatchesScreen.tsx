import { useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { LiveDot } from '../components/LiveDot';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { MATCHES_URL } from '../config';
import type { MatchesResponse } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { filterMatches, type MatchFilter } from '../utils/filterMatches';
import { useTheme, type ThemeColors } from '../theme';

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

const webScrollStyle: ViewStyle & { scrollbarGutter?: 'stable' } =
  Platform.OS === 'web' ? { scrollbarGutter: 'stable' } : {};

export function MatchesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  const liveMatches = visibleMatches.filter(match => match.status === 'live');
  const otherMatches = visibleMatches.filter(match => match.status !== 'live');
  const sections = state.status !== 'success' || refreshing ? [] : [
    ...(liveMatches.length ? [{ key: 'live', title: 'Сейчас в игре', data: liveMatches }] : []),
    ...(otherMatches.length ? [{ key: 'other', title: liveMatches.length ? 'Остальные матчи' : 'Матчи', data: otherMatches }] : []),
  ];

  const emptyTitle = query ? 'Матчи не найдены'
    : filter === 'favorites' ? 'Избранных матчей пока нет'
    : matches.length === 0 ? 'Матчей пока нет' : 'В этой категории матчей нет';
  const emptyHint = query ? 'Измените название клуба или выберите другую категорию.'
    : filter === 'favorites' ? 'Нажмите на звёздочку в карточке матча, чтобы добавить его сюда.'
    : matches.length === 0 ? 'Расписание этого тура ещё не опубликовано.'
    : 'Выберите другой фильтр, чтобы увидеть остальные матчи.';

  return (
    <View style={styles.container}>
      <SectionList
        style={[styles.scroll, webScrollStyle]}
        sections={sections}
        keyExtractor={match => match.id}
        extraData={favorites}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <View style={styles.matchRow}><MatchCard match={item} favorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item.id)} /></View>}
        renderSectionHeader={({ section }) => (
          <View style={styles.listHeading}>
            <View style={styles.sectionLabel}>
              {section.key === 'live' && <LiveDot />}
              <Text style={[styles.sectionTitle, section.key === 'live' && { color: colors.live }]}>{section.title.toUpperCase()} · {section.data.length}</Text>
            </View>
            <Text style={styles.localTime}>Время местное</Text>
          </View>
        )}
        ListEmptyComponent={state.status === 'success' && !refreshing ? (
          <View style={styles.message}>
            <Text style={styles.messageTitle}>{emptyTitle}</Text>
            <Text style={styles.secondary}>{emptyHint}</Text>
          </View>
        ) : null}
        ListHeaderComponent={<>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ФУТБОЛ / РАСПИСАНИЕ И РЕЗУЛЬТАТЫ</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Матчи тура<Text style={styles.titleDot}>.</Text></Text>
          {state.status === 'success' && <View style={styles.roundBadge}><Text style={styles.roundText}>ТУР {state.data.round}</Text></View>}
        </View>
        <Text style={styles.subtitle}>Весь тур на одном экране. Ваши команды — в центре.</Text>
      </View>
      {(state.status === 'loading' || (state.status === 'error' && refreshing)) && (
        <View style={styles.message}>
          <ActivityIndicator size="large" color={colors.accent} />
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
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            accessibilityLabel="Поиск по названию клуба"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setSearch('')} style={styles.clearSearch}>
              <Text style={styles.clearIcon}>×</Text>
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
        {refreshing && (
          <View style={styles.message}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.secondary}>Обновляем матчи…</Text>
          </View>
        )}
      </>}
        </>}
      />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  hero: { paddingTop: 24, paddingBottom: 24, gap: 10 },
  eyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.5, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 14, rowGap: 8 },
  titleDot: { color: colors.accent },
  roundBadge: { borderRadius: 7, backgroundColor: colors.raised, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'center' },
  roundText: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, paddingBottom: 14 },
  sectionTitle: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  localTime: { color: colors.muted, fontSize: 10 },
  container: { flex: 1, minHeight: 0, width: '100%' },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: -1.5, lineHeight: 46, includeFontPadding: false, color: colors.text },
  scroll: { flex: 1, minHeight: 0 },
  list: { width: '100%', maxWidth: 860, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  matchRow: { paddingBottom: 12 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInput: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, paddingRight: 56, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  clearSearch: { position: 'absolute', right: 10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised },
  clearIcon: { fontSize: 24, lineHeight: 28, color: colors.muted, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  popup: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: 24, padding: 28, gap: 20, borderWidth: 1, borderColor: colors.border },
  closeButton: { alignItems: 'center', padding: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filter: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: colors.surface },
  selectedFilter: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.muted, fontSize: 14 },
  selectedFilterText: { color: colors.accentText, fontSize: 14, fontWeight: '600' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  message: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  messageTitle: { color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  secondary: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: colors.live, textAlign: 'center' },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
  buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
