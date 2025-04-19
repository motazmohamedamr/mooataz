import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { AccountListVm, BusinessType } from '@core/api';
import { PROJECT_MANAGER_BUSINESSTYPE_VALUE } from '@modules/projects/projects.service';
import { TranslateService } from '@ngx-translate/core';

export type busTypes = {
  label: string;
  value: number;
  description: string;
};

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss',
})
export class DepartmentsComponent implements AfterViewInit {
  @Output()
  refetchUsersEv = new EventEmitter();

  @Input()
  departmentUsersMap: Record<string, AccountListVm[]>;

  private readonly _translateService = inject(TranslateService);

  departments: busTypes[] = Object.entries(BusinessType)
    .map(([label, value]) => ({
      label: this._translateService.instant(
        `Projects.teams.businessTypes.${label}.title`
      ),
      description: this._translateService.instant(
        `Projects.teams.businessTypes.${label}.description`
      ),
      value: +value,
    }))
    .slice(Math.floor(Object.keys(BusinessType).length / 2));

  refetchUsers() {
    this.refetchUsersEv.emit();
  }

  ngAfterViewInit(): void {
    this.departments.unshift({
      label: this._translateService.instant(`Projects.teams.businessTypes.Manager.title`),
      description: this._translateService.instant(
        `Projects.teams.businessTypes.Manager.description`
      ),
      value: PROJECT_MANAGER_BUSINESSTYPE_VALUE,
    });
  }
}
