import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {
  BusinessType,
  IProjectQuantityVm,
  ProjectQuantityStatus,
  ProjectQuantityVm,
} from '@core/api';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cards-table',
  templateUrl: './cards-table.component.html',
  styleUrls: ['./cards-table.component.scss'],
})
export class CardsTableComponent implements OnInit {
  @Input() quantities: any;
  @Output() selectTermEvent: EventEmitter<any> = new EventEmitter<any>();
  notStartedTasks: ProjectQuantityVm[];
  inProgressTasks: ProjectQuantityVm[];
  completedTasks: ProjectQuantityVm[];
  projectQuantityStatus = ProjectQuantityStatus;
  translation: any;

  protected readonly _translateService = inject(TranslateService);

  async ngOnInit() {
    this.translation = await firstValueFrom(
      this._translateService.get('contract.form.quantities')
    );
    this.notStartedTasks = this.quantities.filter(
      (q: ProjectQuantityVm) => q.status === this.projectQuantityStatus.NotStarted
    );

    this.inProgressTasks = this.quantities.filter(
      (q: ProjectQuantityVm) => q.status === this.projectQuantityStatus.InProgress
    );

    this.completedTasks = this.quantities.filter(
      (q: ProjectQuantityVm) => q.status === this.projectQuantityStatus.Completed
    );
  }

  getBusinessTypeName(businessType: BusinessType) {
    switch (businessType) {
      case BusinessType.Structural:
        return this._translateService.instant(
          'Projects.teams.businessTypes.Structural.title'
        );
      case BusinessType.Architectural:
        return this._translateService.instant(
          'Projects.teams.businessTypes.Architectural.title'
        );
      case BusinessType.Electrical:
        return this._translateService.instant(
          'Projects.teams.businessTypes.Electrical.title'
        );
      case BusinessType.Mechanical:
        return this._translateService.instant(
          'Projects.teams.businessTypes.Mechanical.title'
        );
      case BusinessType.Telecommunications:
        return this._translateService.instant(
          'Projects.teams.businessTypes.Telecommunications.title'
        );
      default:
        return this._translateService.instant('Projects.teams.businessTypes.Other.title');
    }
  }

  select(term: IProjectQuantityVm) {
    this.selectTermEvent.emit(term.id);
  }
}
