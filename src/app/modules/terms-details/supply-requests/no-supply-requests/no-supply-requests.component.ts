import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role } from '@core/api';
import { User } from '@core/auth';

@Component({
  selector: 'app-no-supply-requests',
  templateUrl: './no-supply-requests.component.html',
  styleUrl: './no-supply-requests.component.scss',
})
export class NoSupplyRequestsComponent {
  @Output() openAddDialog = new EventEmitter<void>();

  @Input() user: User;
  @Input() translation: any;

  openAddRequestDialog() {
    this.openAddDialog.emit();
  }

  get role(): typeof Role {
    return Role;
  }
}
