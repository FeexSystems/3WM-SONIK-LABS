import { StudioThemeMode } from '../types';
export type { StudioThemeMode };

export interface StudioTheme {
  id: StudioThemeMode;
  mode: StudioThemeMode;
  name: string;
  description: string;
  accentColor: string;
}

export const STUDIO_THEMES: StudioTheme[] = [
  {
    id: 'dark',
    mode: 'dark',
    name: '3WM Dark',
    description: 'Cinematic deep obsidian studio environment.',
    accentColor: '#F5A800',
  },
  {
    id: 'midnight',
    mode: 'midnight',
    name: 'Midnight OLED',
    description: 'True pure black high-contrast OLED studio.',
    accentColor: '#FF3C00',
  },
  {
    id: 'studio-light',
    mode: 'studio-light',
    name: 'Studio Light',
    description: 'Clean architectural daytime high-contrast workspace.',
    accentColor: '#2AFFA3',
  },
  {
    id: 'midnight-light',
    mode: 'midnight-light',
    name: 'Midnight Light',
    description: 'Lighter gradients background with darker gradients typography.',
    accentColor: '#FF3C00',
  },
];

const THEME_STORAGE_KEY = '3wm_sonik_active_theme_mode';

export class ThemeManager {
  private activeMode: StudioThemeMode = 'dark';
  private listeners: Set<(mode: StudioThemeMode) => void> = new Set<
    (mode: StudioThemeMode) => void
  >();

  constructor() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as StudioThemeMode;
      if (saved && (saved === 'dark' || saved === 'midnight' || saved === 'studio-light')) {
        this.activeMode = saved;
      }
    } catch {
      // Fallback
    }
    this.applyDocumentTheme(this.activeMode);
  }

  public getActiveMode(): StudioThemeMode {
    return this.activeMode;
  }

  public getActiveTheme(): StudioTheme {
    return STUDIO_THEMES.find((t) => t.mode === this.activeMode) ?? STUDIO_THEMES[0];
  }

  public setMode(mode: StudioThemeMode) {
    this.activeMode = mode;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
    this.applyDocumentTheme(mode);
    this.listeners.forEach((cb) => cb(mode));
  }

  public setThemeMode(mode: StudioThemeMode) {
    this.setMode(mode);
  }

  private applyDocumentTheme(mode: StudioThemeMode) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
      if (mode === 'studio-light') {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
      } else {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
      }
    }
  }

  public subscribe(cb: (mode: StudioThemeMode) => void): () => void {
    this.listeners.add(cb);
    cb(this.activeMode);
    return () => this.listeners.delete(cb);
  }
}

export const themeManager = new ThemeManager();
