import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '@core/api';
import { MODULES } from '@core/models';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss'],
})
export class HeaderMenuComponent implements OnInit {
  protected readonly translate = inject(TranslateService);
  @ViewChild('settingsElem') settingsElem: ElementRef<HTMLDivElement>;

  @HostListener('document:click', ['$event'])
  docClicked(event: any) {
    if (this.showSettings() && !this.settingsElem.nativeElement.contains(event.target)) {
      this.showSettings.set(false);
    }
  }

  constructor(private router: Router) {}

  ngOnInit(): void {}

  showSettings = signal(false);

  calculateMenuItemCssClass(url: string): string {
    return checkIsActive(this.router.url, url) ? 'active' : '';
  }

  protected readonly Role = Role;
  protected readonly MODULES = MODULES;
}

const getCurrentUrl = (pathname: string): string => {
  return pathname.split(/[?#]/)[0];
};

const checkIsActive = (pathname: string, url: string) => {
  const current = getCurrentUrl(pathname);
  if (!current || !url) {
    return false;
  }

  if (current === url) {
    return true;
  }

  return current.startsWith(url);
};
