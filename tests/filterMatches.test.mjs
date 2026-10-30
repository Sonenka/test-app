import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterMatches } from '../src/utils/filterMatches.ts';

const { matches } = JSON.parse(readFileSync(new URL('../data/matches.json', import.meta.url), 'utf8'));
const ids = result => result.map(match => match.id);
const select = (filter, favorites = [], search = '') => ids(filterMatches(matches, filter, favorites, search));

test('all includes every status, including cancelled and unknown', () => {
  const extra = [
    { ...matches[0], id: 'cancelled', status: 'cancelled' },
    { ...matches[0], id: 'unknown', status: 'unknown' },
  ];
  assert.deepEqual(ids(filterMatches([...matches, ...extra], 'all', [])), [
    'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'cancelled', 'unknown',
  ]);
  assert.deepEqual(ids(filterMatches(extra, 'upcoming', [])), []);
  assert.deepEqual(ids(filterMatches(extra, 'finished', [])), []);
});

test('upcoming includes scheduled matches with past dates and postponed matches without a date', () => {
  assert.deepEqual(select('upcoming'), ['m5', 'm6', 'm7', 'm8']);
});

test('finished excludes live and keeps the 0:0 match', () => {
  assert.deepEqual(select('finished'), ['m1', 'm2', 'm3']);
});

test('favorites includes selected matches of any status and ignores stale ids', () => {
  assert.deepEqual(select('favorites', ['m7', 'm4', 'm2', 'missing']), ['m2', 'm4', 'm7']);
  assert.deepEqual(select('favorites'), []);
});

test('favorites come first while preserving server order within both groups', () => {
  assert.deepEqual(select('all', ['m7', 'm3']), ['m3', 'm7', 'm1', 'm2', 'm4', 'm5', 'm6', 'm8']);
  assert.deepEqual(select('finished', ['m3', 'm7']), ['m3', 'm1', 'm2']);
  assert.deepEqual(select('upcoming', ['m7', 'm3']), ['m7', 'm5', 'm6', 'm8']);
});

test('search matches partial home and away names, ignoring case and surrounding spaces', () => {
  assert.deepEqual(select('all', [], '  дИнАмО  '), ['m4', 'm8']);
  assert.deepEqual(select('all', [], 'спарт'), ['m1']);
  assert.deepEqual(select('all', [], '   '), ids(matches));
});

test('search intersects categories and preserves favorite priority', () => {
  assert.deepEqual(select('upcoming', [], 'динамо'), ['m8']);
  assert.deepEqual(select('finished', [], 'динамо'), []);
  assert.deepEqual(select('favorites', ['m4', 'm8'], 'махач'), ['m8']);
  assert.deepEqual(select('all', ['m8'], 'динамо'), ['m8', 'm4']);
  assert.deepEqual(select('all', [], 'несуществующий клуб'), []);
});

test('empty input returns an empty list for every category', () => {
  for (const filter of ['all', 'upcoming', 'finished', 'favorites']) {
    assert.deepEqual(filterMatches([], filter, ['m1']), []);
  }
});

test('filtering and sorting do not mutate input data or favorites', () => {
  const input = Object.freeze([...matches]);
  const favorites = Object.freeze(['m8', 'm3']);
  const before = structuredClone(matches);
  filterMatches(input, 'all', favorites);
  assert.deepEqual(input, before);
  assert.deepEqual(favorites, ['m8', 'm3']);
});
