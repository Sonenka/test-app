import { StyleSheet, Text, View } from 'react-native';
import type { Match, Team } from '../types';
import { useTheme } from '../theme';
import { FavoriteButton } from './FavoriteButton';
import { LiveDot } from './LiveDot';

const statusLabels: Record<string, string> = {
  scheduled: 'Предстоящий', live: 'Идёт матч', finished: 'Завершён',
  postponed: 'Перенесён', cancelled: 'Отменён',
};
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', year: 'numeric',
});
function formatStart(startsAt: string | null) {
  if (!startsAt) return 'Дата и время уточняются';
  const date = new Date(startsAt);
  return Number.isNaN(date.getTime()) ? 'Дата и время уточняются' : dateFormatter.format(date);
}
function TeamBadge({ team, away = false }: { team: Team; away?: boolean }) {
  const { colors } = useTheme();
  const initials = team.name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return (
    <View style={styles.team}>
      <View style={[styles.badge, { backgroundColor: away ? colors.raised : colors.accent, borderColor: colors.border }]}>
        <Text style={[styles.initials, { color: away ? colors.text : colors.accentText }]}>{initials}</Text>
      </View>
      <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
      <Text style={[styles.city, { color: colors.muted }]}>{team.city}</Text>
    </View>
  );
}
type Props = { match: Match; favorite: boolean; onToggleFavorite: () => void };
export function MatchCard({ match, favorite, onToggleFavorite }: Props) {
  const { colors } = useTheme();
  const live = match.status === 'live';
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: live ? colors.live : colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: live ? colors.liveBackground : colors.raised }]}>
          {live && <LiveDot />}
          <Text style={[styles.status, { color: live ? colors.live : colors.muted }]}>
            {statusLabels[match.status] ?? 'Статус неизвестен'}{live && match.minute != null ? ` · ${match.minute}′` : ''}
          </Text>
        </View>
        <FavoriteButton active={favorite} onPress={onToggleFavorite} />
      </View>
      <View style={styles.teams}>
        <TeamBadge team={match.home} />
        <View style={styles.scoreBlock}>
          <Text style={[styles.score, { color: live ? colors.live : colors.text }]} accessibilityLabel={match.score ? `Счёт ${match.score.home}:${match.score.away}` : 'Счёт пока отсутствует'}>
            {match.score ? `${match.score.home} : ${match.score.away}` : '— : —'}
          </Text>
          <Text style={[styles.scoreHint, { color: colors.muted }]}>{match.score ? 'СЧЁТ МАТЧА' : match.status === 'scheduled' ? 'СКОРО НА ПОЛЕ' : 'СЧЁТА НЕТ'}</Text>
        </View>
        <TeamBadge team={match.away} away />
      </View>
      <View style={[styles.footer, { borderColor: colors.border }]}>
        <Text style={[styles.date, { color: colors.muted }]}>{formatStart(match.startsAt)}</Text>
        <Text style={[styles.venue, { color: colors.muted }]}>Хозяева / гости</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 18, borderWidth: 1, borderRadius: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  status: { fontSize: 12, fontWeight: '600' },
  teams: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  team: { flex: 1, alignItems: 'center', gap: 6 },
  badge: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  initials: { fontSize: 19, fontWeight: '800' },
  teamName: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  city: { fontSize: 11, textAlign: 'center' },
  scoreBlock: { alignSelf: 'center', alignItems: 'center', gap: 8, maxWidth: '35%' },
  score: { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  scoreHint: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, borderTopWidth: 1, paddingTop: 14 },
  date: { fontSize: 11 }, venue: { fontSize: 10 },
});
