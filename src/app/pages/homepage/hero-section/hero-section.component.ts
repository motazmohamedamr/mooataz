import { Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { IdentityManager, User } from '@core/auth';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  @Input()
  translation: Record<string, any>;

  protected readonly translate = inject(TranslateService);
  protected readonly _identityManager = inject(IdentityManager);

  currentIndex = signal(0);

  showLanguageDropdown = false;

  user: User;

  private intervalId: number = null;

  images = [
    { src: './assets/media/homepage/hero-image1.webp', alt: 'Image 1' },
    { src: './assets/media/homepage/hero-image2.webp', alt: 'Image 2' },
    { src: './assets/media/homepage/hero-image3.webp', alt: 'Image 3' },
  ];

  private showNextImage(): void {
    this.currentIndex.set((this.currentIndex() + 1) % this.images.length);
  }

  ngOnInit(): void {
    this.user = this._identityManager.getUser();
    setInterval(() => this.showNextImage(), 7000);
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  switchLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    window.location.reload();
  }
}
