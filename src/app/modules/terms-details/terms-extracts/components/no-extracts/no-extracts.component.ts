import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Role } from '@core/api';
import { User } from '@core/auth';

@Component({
  selector: 'app-no-extracts',
  templateUrl: './no-extracts.component.html',
  styleUrl: './no-extracts.component.scss',
})
export class NoExtractsComponent {
  @Output() openAddDialog = new EventEmitter<void>();
  @Input({ required: true }) user: User;
  @Input() translation: any;

  openAddRequestDialog() {
    this.openAddDialog.emit();
  }

  get role(): typeof Role {
    return Role;
  }
}

