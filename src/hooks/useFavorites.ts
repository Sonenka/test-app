import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'matches:favorites:v1';
let pendingWrite = Promise.resolve();

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

// Избранное хранится на устройстве; быстрые нажатия до чтения хранилища не теряются.
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const pendingToggles = useRef<string[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        await pendingWrite;
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw === null ? [] : JSON.parse(raw);
        const stored = Array.isArray(parsed)
          ? [...new Set(parsed.filter((id): id is string => typeof id === 'string'))]
          : [];
        if (!active) return;
        setFavorites(pendingToggles.current.reduce(toggleId, stored));
        pendingToggles.current = [];
        hydrated.current = true;
        setLoaded(true);
      } catch (error) {
        // При недоступном хранилище избранное продолжает работать в памяти.
        // Не перезаписываем данные, которые не удалось прочитать.
        if (active) {
          hydrated.current = true;
          pendingToggles.current = [];
          console.warn('Не удалось прочитать избранное.', error);
        }
      }
    }

    void restore();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const value = JSON.stringify(favorites);
    // Последовательная запись не позволяет старому запросу затереть новый выбор.
    pendingWrite = pendingWrite
      .then(() => AsyncStorage.setItem(STORAGE_KEY, value))
      .catch(error => { console.warn('Не удалось сохранить избранное.', error); });
  }, [favorites, loaded]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggle = (id: string) => {
    if (!hydrated.current) pendingToggles.current.push(id);
    setFavorites(previous => toggleId(previous, id));
  };

  return { favorites, isFavorite, toggle };
}
