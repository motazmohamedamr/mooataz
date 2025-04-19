import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import {
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
  inject,
  Inject,
} from '@angular/core';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  animations: [
    //        ..........
    trigger('fadeOnScroll', [
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      state('hidden', style({ opacity: 0, transform: 'translateY(300px)' })),
      transition('hidden => visible', animate('1000ms ease-out')),
    ]),
  ],
})
export class HomepageComponent implements OnInit, AfterViewInit {
  constructor(private meta: Meta, @Inject(DOCUMENT) private document: Document) {}
  protected readonly translate = inject(TranslateService);
  translation: Record<
    'hero' | 'whymotabea' | 'features' | 'pricing' | 'contact' | 'footer',
    unknown
  >;
  //     .......
  sectionStates = {
    hero: 'visible',
    whymotabea: 'hidden',
    features: 'hidden',
    pricing: 'hidden',
    contact: 'hidden',
    footer: 'hidden',
  };
   
  sectionElements = {};

  async ngOnInit(): Promise<void> {
    this.setMetaTags();
    this.addStructuredData();
    this.setCanonicalLink();
    this.translation = await firstValueFrom(this.translate.get('homepage'));
  }

  // تهدف إلى تحديث وسوم الميتا (Meta Tags) الخاصة بـ SEO ووسائل التواصل
  private setMetaTags() {
    //                 ....................
    const lang = this.translate.currentLang;

    const title = lang === 'ar' ? 'متابع' : 'Motabea';

    const description =
      lang === 'ar'
        ? 'نظام متابعة لإدارة العقود والمشتريات بكفاءة عالية وتتبع سلسلة التوريد بشكل متكامل'
        : 'SCMS provides efficient contract and procurement management with integrated supply chain tracking';

        const keywords =
        lang === 'ar'
          ? 'متابع, إدارة العقود, نظام مشتريات, تتبع سلسلة التوريد'
          : 'Motabea, contract management, procurement system, supply chain tracking';
    
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ name: 'keywords', content: keywords });
      this.meta.updateTag({ name: 'author', content: 'YourCompany' });
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      this.meta.updateTag({ property: 'og:url', content: 'https://yourdomain.com' });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.meta.updateTag({ httpEquiv: 'content-language', content: lang });
  }

  // هنا في بعض data بس مش بتظهر html
  private addStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SCMS',
      url: 'https://yourdomain.com',
      logo: 'https://yourdomain.com/assets/images/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-234-567-8901',
        contactType: 'customer service',
      },
      sameAs: [
        'https://www.facebook.com/yourcompany',
        'https://www.twitter.com/yourcompany',
        'https://www.linkedin.com/company/yourcompany',
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  private setCanonicalLink() {
    const canURL = this.document.URL;
    const link: HTMLLinkElement = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canURL);
    this.document.head.appendChild(link);
  }

  ngAfterViewInit() {
    this.sectionElements = {
      whymotabea: document.querySelector('app-why-motabea-section'),
      features: document.querySelector('app-features-section'),
      pricing: document.querySelector('app-pricing-section'),
      contact: document.querySelector('app-contact-section'),
      footer: document.querySelector('app-footer-section'),
    };

    this.checkSectionsVisibility();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.checkSectionsVisibility();
  }

  //         تحقق ان الاقسام متساويه
  checkSectionsVisibility() {
    const windowHeight = window.innerHeight;

    Object.entries(this.sectionElements).forEach(([sectionId, element]) => {
      if (!element) return;

      const rect = (element as HTMLElement).getBoundingClientRect();
      const isVisible = rect.top < windowHeight * 0.8;

      if (
        isVisible &&
        this.sectionStates[sectionId as keyof typeof this.sectionStates] === 'hidden'
      ) {
        this.sectionStates[sectionId as keyof typeof this.sectionStates] = 'visible';
      }
    });
  }
}
