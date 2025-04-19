import { Component, inject, Input } from '@angular/core';
import { CovenantRequestDetailsVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-convenant-requests-list',
  templateUrl: './convenant-requests-list.component.html',
  styleUrl: './convenant-requests-list.component.scss',
})
export class ConvenantRequestsListComponent {
  protected readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input() covenantRequest: CovenantRequestDetailsVm;

  get locale(): string {
    return this.translate.currentLang === 'ar' ? 'ar' : 'en-US';
  }
}

