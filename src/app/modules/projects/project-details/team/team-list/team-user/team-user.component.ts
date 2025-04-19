import { Component, HostBinding, Input } from '@angular/core';
import { AccountListVm } from '@core/api';

@Component({
  selector: 'app-team-user',
  templateUrl: './team-user.component.html',
  styleUrl: './team-user.component.scss',
})
export class TeamUserComponent {
  @Input({ required: true })
  user: AccountListVm;

  @HostBinding('class')
  get hostClasses(): string {
    return 'col-md-6 col-xxl-4';
  }
}

