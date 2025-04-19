import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { Role } from '@core/api';
import { MODULES } from '@core/models';

@Component({
  selector: 'app-aside-menu',
  templateUrl: './aside-menu.component.html',
  styleUrls: ['./aside-menu.component.scss'],
})
export class AsideMenuComponent implements OnInit {
  appAngularVersion: string = environment.appVersion;

  constructor() {}

  ngOnInit(): void {}

  protected readonly Role = Role;
  protected readonly MODULES = MODULES;
}
