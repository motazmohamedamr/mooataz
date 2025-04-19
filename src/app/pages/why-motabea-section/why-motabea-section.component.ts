import { Component, Input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-why-motabea-section',
  templateUrl: './why-motabea-section.component.html',
  styleUrl: './why-motabea-section.component.scss',
})
export class WhyMotabeaSectionComponent implements OnInit {
  @Input()
  translation: Record<string, any>;

  companyLogos = [
    { src: './assets/media/homepage/acme.png', alt: 'Aome Corp' },
    { src: './assets/media/homepage/quantum.png', alt: 'Quantum' },
    { src: './assets/media/homepage/echo.png', alt: 'Echo Valley' },
    { src: './assets/media/homepage/celestia.png', alt: 'Celestial' },
    { src: './assets/media/homepage/pulse.png', alt: 'PULSE' },
    { src: './assets/media/homepage/apex.png', alt: 'APEX' },
  ];

  currentIndex = signal(0);

  ngOnInit(): void {
    this.startCarousel();
  }

  startCarousel(): void {
    setInterval(() => {
      this.currentIndex.set((this.currentIndex() + 1) % this.companyLogos.length);
    }, 5000);
  }

  getOpacity(index: number): { opacity: string } {
    const distance =
      (index - this.currentIndex() + this.companyLogos.length) % this.companyLogos.length;
    if (distance === 0) {
      return { opacity: '1' };
    } else if (distance === 1) {
      return { opacity: '0.5' };
    } else {
      return { opacity: '0.2' };
    }
  }
}

