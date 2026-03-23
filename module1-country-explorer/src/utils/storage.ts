// =============================================================================
// UTILIDADES DE ALMACENAMIENTO LOCAL - Country Explorer
// =============================================================================

const FAVORITES_KEY = 'country-explorer-favorites';

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      return new Set(parsed as string[]);
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

export function isFavorite(cca3: string): boolean {
  return getFavorites().has(cca3);
}

export function toggleFavorite(cca3: string): boolean {
  const favs = getFavorites();
  if (favs.has(cca3)) {
    favs.delete(cca3);
    saveFavorites(favs);
    return false;
  } else {
    favs.add(cca3);
    saveFavorites(favs);
    return true;
  }
}

export function clearFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY);
}
