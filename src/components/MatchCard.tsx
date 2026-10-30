import { StyleSheet, Text, View } from 'react-native';
import type { Match } from '../types';

const statusLabels: Record<string, string> = {
  scheduled: 'Предстоящий',
  live: 'Идёт матч',
  finished: 'Завершён',
  postponed: 'Перенесён',
  cancelled: 'Отменён',
};

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatStart(startsAt: string | null) {
  if (!startsAt) return 'Дата и время уточняются';
  const date = new Date(startsAt);
  return Number.isNaN(date.getTime())
    ? 'Дата и время уточняются'
    : dateFormatter.format(date);
}

export function MatchCard({ match }: { match: Match }) {
  const status = statusLabels[match.status] ?? 'Статус неизвестен';

  return (
    <View style={styles.card}>
      <Text style={[styles.status, match.status === 'live' && styles.live]}>
        {status}{match.status === 'live' && match.minute != null ? ` · ${match.minute} мин` : ''}
      </Text>
      <View style={styles.teams}>
        <View style={styles.team}>
          <Text style={styles.teamName}>{match.home.name}</Text>
          <Text style={styles.secondary}>{match.home.city} · хозяева</Text>
        </View>
        <Text
          style={styles.score}
          accessibilityLabel={match.score ? `Счёт ${match.score.home}:${match.score.away}` : 'Счёт пока отсутствует'}
        >
          {match.score ? `${match.score.home} : ${match.score.away}` : '—'}
        </Text>
        <View style={[styles.team, styles.away]}>
          <Text style={[styles.teamName, styles.awayText]}>{match.away.name}</Text>
          <Text style={[styles.secondary, styles.awayText]}>{match.away.city} · гости</Text>
        </View>
      </View>
      <Text style={styles.secondary}>{formatStart(match.startsAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, gap: 14 },
  status: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  live: { color: '#b91c1c' },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  team: { flex: 1, gap: 4 },
  away: { alignItems: 'flex-end' },
  awayText: { textAlign: 'right' },
  teamName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  score: { fontSize: 20, fontWeight: '700', color: '#111827' },
  secondary: { fontSize: 13, color: '#6b7280' },
});
