import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Role } from '@core/api';

@Component({
  selector: 'app-roles-selector',
  templateUrl: './roles-selector.component.html',
})
export class RolesSelectorComponent {
  @Input() control: FormControl;
  @Input() roles: { value: Role; label: string; description: string }[];
  @Input() disabled = false;

  select(role: Role): void {
    this.control.setValue(role);
  }
}
