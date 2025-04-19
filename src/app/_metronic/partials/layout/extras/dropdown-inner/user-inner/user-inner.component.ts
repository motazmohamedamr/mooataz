import {
  Component,
  ElementRef,
  HostBinding,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { LocalizationService } from '@core/services/localization.service';
import { AccountDetailsVm, Role } from '@core/api';
import { IdentityManager, User } from '@core/auth';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
  styleUrls: ['./user-inner.component.scss'],
})
export class UserInnerComponent implements OnInit {
  protected readonly translate = inject(TranslateService);

  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  @ViewChild('langMenuItemElem') langMenuItemElem: ElementRef<HTMLDivElement>;
  @ViewChild('langListElem') langListElem: ElementRef<HTMLDivElement>;

  language: LanguageFlag;
  user: User;
  userDetails: AccountDetailsVm;
  langs = languages;

  showLangsMenu = signal(false);

  protected readonly Role = Role;

  constructor(
    private _identityManager: IdentityManager,
    private localizationService: LocalizationService
  ) {}

  ngOnInit(): void {
    // this.user = this._identityManager.getUser();
    this._identityManager.account$.asObservable().subscribe((c) => {
      this.userDetails = c;
    });
    // this.user = this.userDetails$.value;
    this.setLanguage(this.localizationService.getCurrentLang());
  }

  logout() {
    this._identityManager.logout().subscribe();
  }

  selectLanguage(lang: string) {
    this.localizationService.setLang(lang);
  }

  setLanguage(lang: string) {
    this.langs.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
  }
}

interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: './assets/media/flags/united-states.svg',
  },
  {
    lang: 'ar',
    name: 'Arabic',
    flag: './assets/media/flags/saudi-arabia.svg',
  },
];
