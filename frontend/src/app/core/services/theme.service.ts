import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = signal<Theme>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('pet-id-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        this.theme.set(saved);
      }

      effect(() => {
        const current = this.theme();
        document.documentElement.setAttribute('data-theme', current);
        localStorage.setItem('pet-id-theme', current);
      });
    }
  }

  toggleTheme(): void {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }
}
