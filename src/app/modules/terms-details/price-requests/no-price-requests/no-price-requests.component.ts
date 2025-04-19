import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role } from '@core/api';

@Component({
  selector: 'app-no-price-requests',
  templateUrl: './no-price-requests.component.html',
  styleUrl: './no-price-requests.component.scss',
})
export class NoPriceRequestsComponent {
  @Output() openAddDialog = new EventEmitter<void>();

  @Input() userRoles: Role[];
  @Input() translation: any;

  openAddRequestDialog() {
    this.openAddDialog.emit();
  }

  get role(): typeof Role {
    return Role;
  }
}

