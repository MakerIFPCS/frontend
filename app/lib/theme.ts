export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_PREFIX = 'labmaker-theme-';

export function isThemePreference(value: string): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getUserThemePreference(userId: string): ThemePreference {
  if (!userId) {
    return 'light';
  }

  const storedTheme = localStorage.getItem(`${THEME_STORAGE_PREFIX}${userId}`);
  return storedTheme && isThemePreference(storedTheme) ? storedTheme : 'light';
}

export function setUserThemePreference(userId: string, theme: ThemePreference) {
  if (!userId) {
    throw new Error('Não foi possível salvar o tema sem identificar o usuário.');
  }

  localStorage.setItem(`${THEME_STORAGE_PREFIX}${userId}`, theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event('theme-changed'));
}

export function subscribeToTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('theme-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('theme-changed', callback);
  };
}
