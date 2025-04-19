import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IPageInfo } from '@core/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  private readonly _translate = inject(TranslateService);

  @Input({ required: true }) paginationPages: number[] = [];
  @Input({ required: true }) pageInfo: IPageInfo;
  @Input({ required: true }) pageIndex: number;
  @Input({ required: true }) pageSize: number;

  @Output() goToPage = new EventEmitter<number>();

  goToPageHandler(page: number) {
    this.goToPage.emit(page - 1);
  }

  get paginationInfoText(): string {
    const currentPage = (this.pageIndex || 0) + 1;
    const pageSize = 1;
    const total = this.pageInfo.totalCount || 0;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return this._translate
      .instant('general.table.paginationInfo')
      .replace('{{start}}', start.toString())
      .replace('{{end}}', end.toString())
      .replace('{{total}}', total.toString());
  }
}
