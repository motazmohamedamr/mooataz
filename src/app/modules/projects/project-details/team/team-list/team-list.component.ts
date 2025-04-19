import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccountListVm } from '@core/api';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
})
export class TeamListComponent {
  @Input({ required: true })
  users: AccountListVm[];

  @Output()
  userSearchChange = new EventEmitter<string>();

  userChange(event: Event) {
    const value: string = (event.target as HTMLInputElement).value;
    this.userSearchChange.emit(value);
  }
}

