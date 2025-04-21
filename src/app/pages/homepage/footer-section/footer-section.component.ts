import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

interface FooterLink {
  text: string;
  url?: string;
  href?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer-section',
  templateUrl: './footer-section.component.html',
  styleUrl: './footer-section.component.scss',
})
export class FooterSectionComponent implements OnInit, OnChanges {
  @Input()
  translation: Record<string, any>;
  currentYear = new Date().getFullYear();

  footerSections: FooterSection[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    const translations = changes?.translation?.currentValue;
    if (translations) {
      this.footerSections = [
        {
          title: translations.quickLinks,
          links: [
            { text: translations.home, href: 'main' },
            { text: translations.features, href: 'features' },
            { text: translations.ourStory, href: 'solutions' },
            { text: translations.blogAndNews, url: '/blog' },
          ],
        },
        {
          title: translations.customerSupport,
          links: [
            { text: translations.faqs, url: '/faqs' },
            { text: translations.supportCenter, url: '/support' },
            { text: translations.contactUs, url: '/contact' },
          ],
        },
        {
          title: translations.legalAndPolicies,
          links: [
            { text: translations.termsAndConditions, url: '/terms' },
            { text: translations.privacyPolicy, url: '/privacy' },
            { text: translations.userManual, url: '/manual' },
          ],
        },
      ];
    }
  }

  ngOnInit(): void {}

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
