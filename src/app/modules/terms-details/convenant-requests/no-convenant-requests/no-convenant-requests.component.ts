import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role } from '@core/api';
import { User } from '@core/auth';

@Component({
  selector: 'app-no-convenant-requests',
  templateUrl: './no-convenant-requests.component.html',
  styleUrl: './no-convenant-requests.component.scss',
})
export class NoConvenantRequestsComponent {
  @Output() openAddDialog = new EventEmitter<void>();

  @Input() translation: any;
  @Input() user: User;

  openAddRequestDialog() {
    this.openAddDialog.emit();
  }

  get role(): typeof Role {
    return Role;
  }
}
