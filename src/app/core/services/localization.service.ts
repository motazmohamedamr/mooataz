import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language } from '@core/api';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  supportedLangs = [
    {
      name: 'en',
      lang: Language.En,
      title: 'English',
      isRtl: false,
    },
    {
      name: 'ar',
      lang: Language.Ar,
      title: 'العربية',
      isRtl: true,
    },
  ];

  defaultLang: any;
  selectedLang: any;

  constructor(private translateService: TranslateService) {
    this.translateService.addLangs(this.supportedLangs.map((c) => c.name));

    this.defaultLang = this.getDefaultLang();

    const lang = this.supportedLangs.find((c) => c.name !== this.defaultLang.name).name;

    this.translateService.setDefaultLang(lang);
  }

  localize(): void {
    this.setLang(localStorage.getItem('lang'), false);
  }

  getLang(): Language {
    const lang = localStorage.getItem('lang');

    const output = lang
      ? this.supportedLangs.find((c) => c.name === lang)
      : this.getDefaultLang();

    return output.lang;
  }

  getCurrentLang(): string {
    const lang = localStorage.getItem('lang');

    const output = lang
      ? this.supportedLangs.find((c) => c.name === lang)
      : this.getDefaultLang();

    return output.name;
  }

  changeLang(): void {
    const currentLang = this.getLang();
    const lang = this.supportedLangs.find((c) => c.lang != currentLang);

    this.setLang(lang.name, true);
  }

  setLang(name: string, refresh = true): void {
    // Use the stored lang, or the default one if it doesn't exist
    const lang = this.supportedLangs.find((c) => c.name === name) || this.defaultLang;

    localStorage.setItem('lang', lang.name);

    if (refresh) {
      window.location.reload();
    } else {
      this.selectedLang = lang;
      // Settings.defaultLocale = lang.name;
      const dir = lang.isRtl ? 'rtl' : 'ltr';

      document.documentElement.dir = dir;
      document.documentElement.lang = lang.name;

      document.body.dir = dir;
      document.body.lang = lang.name;

      this.translateService.use(lang.name);
    }
  }

  resetLang(): void {
    this.setLang(this.defaultLang);
  }

  private getDefaultLang(): any {
    return this.supportedLangs.find((c) => c.name === 'ar');
  }
}
