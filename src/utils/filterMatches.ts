import type { Match } from '../types';

export type MatchFilter = 'all' | 'upcoming' | 'finished' | 'favorites';

export function filterMatches(
  matches: readonly Match[],
  filter: MatchFilter,
  favorites: readonly string[],
  search = '',
): Match[] {
  const favoriteIds = new Set(favorites);
  const query = search.trim().toLocaleLowerCase('ru-RU');

  return matches.filter(match => {
    if (query && ![match.home.name, match.away.name].some(name => name.toLocaleLowerCase('ru-RU').includes(query))) {
      return false;
    }
    if (filter === 'upcoming') return match.status === 'scheduled' || match.status === 'postponed';
    if (filter === 'finished') return match.status === 'finished';
    if (filter === 'favorites') return favoriteIds.has(match.id);
    return true;
  }).sort((a, b) => Number(favoriteIds.has(b.id)) - Number(favoriteIds.has(a.id)));
}
