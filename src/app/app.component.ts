import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeModeService } from '@metronic/partials/layout/theme-mode-switcher/theme-mode.service';
import { LocalizationService } from '@core/services/localization.service';
import { Language } from '@core/api';
import { IdentityManager } from '@core/auth';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RealTimeService } from '@core/services/real-time.service';
import { ToastrService } from 'ngx-toastr';
import { AudioService } from '@core/services/audio.service';
import { NotificationService } from '@core/auth/services/notifications.service';
import { Title } from '@angular/platform-browser';

@Component({
  // tslint:disable-next-line:component-selector
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'body[root]',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  loaded = false;
  direction: string = 'ltr';

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private _identityManager: IdentityManager,
    private _localizationService: LocalizationService,
    private modeService: ThemeModeService,
    private _realTimeService: RealTimeService,
    private _toastr: ToastrService,
    private _notificationService: NotificationService,
    private title: Title,
    private _audioService: AudioService
  ) {
    this._localizationService.localize();
    if (localStorage.getItem('lang') === 'ar') {
      this.title.setTitle('متـــــــــــــابع');
    } else {
      this.title.setTitle('Motabea');
    }
  }

  async ngOnInit(): Promise<void> {
    this.modeService.init();

    this.loadPage();

    const user = this._identityManager.getUser();

    // stop the whole app till you refresh the token
    if (user) {
      await firstValueFrom(
        this._identityManager
          .processLogout(window.location.pathname)
          .pipe(finalize(() => this.load().then()))
      );
    } else {
      this.load().then();
    }

    this._identityManager.initAccount().subscribe((account) => {
      if (account) {
        this._realTimeService.tryConnect().then((connection) => {
          connection.notifications$.subscribe((notification) => {
            this._toastr.info(notification.body, notification.title);
            this._audioService.playNotification();
            this._notificationService.addNotification(notification);
            this.changeDetectorRef.detectChanges();
          });
        });
      }
    });
  }

  loadPage() {
    const currentLang = this._localizationService.getLang();
    const selectedCss =
      currentLang === Language.Ar
        ? './assets/css/style.bundle.rtl.css'
        : './assets/css/style.bundle.css';

    const head = this.document.getElementsByTagName('head')[0];

    let themeLink = this.document.getElementById('client-theme') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = selectedCss;
    } else {
      const style = this.document.createElement('link');
      style.id = 'client-theme';
      style.rel = 'stylesheet';
      style.href = selectedCss;

      head.appendChild(style);
      this.changeDetectorRef.detectChanges();
    }
  }

  async load(): Promise<any> {
    // this.preloaderService.hide();

    // load after 100ms which is used by the preloader service
    setTimeout(() => {
      this.loaded = true;
    }, 100);
    this.changeDetectorRef.detectChanges();
  }
}
