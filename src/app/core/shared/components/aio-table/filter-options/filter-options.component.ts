import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { IAioTableFilter } from '@shared/components/aio-table/filters/aio-table-filter.interface';

@Component({
  selector: 'app-filter-options',
  templateUrl: './filter-options.component.html',
})
export class FilterOptionsComponent implements OnInit {
  @HostBinding('class') class = 'menu menu-sub menu-sub-dropdown w-250px w-md-300px';
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  @Input() filters: IAioTableFilter[];

  @Output() onApply: EventEmitter<any> = new EventEmitter<any>();
  @Output() onReset: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  apply(): void {
    const filters = this.filters.reduce((acc: any, filter) => {
      acc[filter.key] = filter.getValue();
      return acc;
    }, {});

    this.onApply.emit(filters);
  }

  reset(): void {
    this.onReset.emit();
  }
}
