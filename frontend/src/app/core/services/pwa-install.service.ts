import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  private isIosDevice = false;

  canInstall = signal(false);
  showIosInstructions = signal(false);
  isIosChrome = signal(false);

  constructor() {
    this.checkIosStatus();

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.showIosInstructions.set(false);
    });
  }

  private checkIosStatus(): void {
    const userAgent = window.navigator.userAgent.toLowerCase();

    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isInStandaloneMode =
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isInStandaloneMode) {
      this.isIosDevice = true;
      this.canInstall.set(true);
    }

    this.isIosChrome.set(/crios/.test(userAgent));
  }

  async handleInstallClick(): Promise<void> {
    if (this.isIosDevice) {
      this.showIosInstructions.set(true);
      return;
    }

    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }

    this.deferredPrompt = null;
  }

  closeIosInstructions(): void {
    this.showIosInstructions.set(false);
  }
}