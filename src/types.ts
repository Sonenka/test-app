export type Team = {
  id: string;
  name: string;
  city: string;
};

export type Match = {
  id: string;
  startsAt: string | null;
  status: string;
  minute?: number;
  home: Team;
  away: Team;
  score?: { home: number; away: number } | null;
};

export type MatchesResponse = {
  round: number;
  matches: Match[];
};
