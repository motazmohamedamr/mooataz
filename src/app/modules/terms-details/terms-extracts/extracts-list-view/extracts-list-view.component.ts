import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ExtractRequestDetailsVm, Role } from '@core/api';
import { User } from '@core/auth';

@Component({
  selector: 'app-extracts-list-view',
  templateUrl: './extracts-list-view.component.html',
  styleUrl: './extracts-list-view.component.scss',
})
export class ExtractsListViewComponent {
  @Input({ required: true }) user: User;

  @Input() translation: any;
  @Input({ required: true }) extractList: ExtractRequestDetailsVm[];
  @Output() openAddDialog = new EventEmitter<void>();
  @Output() goToDetailsEmitter = new EventEmitter<ExtractRequestDetailsVm>();

  openAddExtractDialog(): void {
    this.openAddDialog.emit();
  }

  goToDetails(extract: ExtractRequestDetailsVm): void {
    this.goToDetailsEmitter.emit(extract);
  }

  get role(): typeof Role {
    return Role;
  }
}
