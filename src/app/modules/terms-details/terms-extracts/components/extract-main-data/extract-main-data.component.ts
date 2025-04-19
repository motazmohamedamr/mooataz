import { Component, inject, Input } from '@angular/core';
import { ExtractRequestDetailsVm } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-extract-main-data',
  templateUrl: './extract-main-data.component.html',
  styleUrl: './extract-main-data.component.scss',
})
export class ExtractMainDataComponent {
  protected readonly translate = inject(TranslateService);

  @Input() translation: any;
  @Input({ required: true }) extract: ExtractRequestDetailsVm;
}

