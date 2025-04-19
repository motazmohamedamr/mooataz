import { TranslationWidth } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Injectable,
  Output,
  EventEmitter,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbCalendarIslamicCivil,
  NgbCalendarIslamicUmalqura,
  NgbDatepickerI18n,
  NgbModal,
  ModalDismissReasons,
} from '@ng-bootstrap/ng-bootstrap';

const I18N_VALUES = {
  weekdays: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
  months: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
};

@Injectable()
export class IslamicI18n extends NgbDatepickerI18n {
  constructor() {
    super();
  }

  getWeekdayShortName(weekday: number) {
    return I18N_VALUES.weekdays[weekday - 1];
  }

  getMonthShortName(month: number) {
    return I18N_VALUES.months[month - 1];
  }

  getMonthFullName(month: number) {
    return this.getMonthShortName(month);
  }

  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day}-${date.month}-${date.year}`;
  }

  getWeekdayLabel(weekday: number, width?: TranslationWidth): string {
    return this.getWeekdayShortName(weekday);
  }
}

@Component({
  selector: 'app-hijri-date-picker',
  templateUrl: './hijri-date-picker.component.html',
  styleUrl: './hijri-date-picker.component.scss',
  providers: [
    { provide: NgbCalendar, useClass: NgbCalendarIslamicUmalqura },
    { provide: NgbDatepickerI18n, useClass: IslamicI18n },
    { provide: NG_VALUE_ACCESSOR, useExisting: HijriDatePickerComponent, multi: true },
  ],
})
export class HijriDatePickerComponent implements OnInit, ControlValueAccessor {
  private innerValue: string;
  private changed: any[] = [];
  private touched: any[] = [];
  private disabled: boolean;

  @Input() placeholder: string;
  @Input() backgroundColor: string = '#fff';
  @Input() iconColor: string = '#99A1B7';

  @Output()
  dateChangeEv = new EventEmitter<NgbDateStruct>();

  get value(): string {
    return this.innerValue;
  }

  set value(value: string) {
    if (this.innerValue !== value) {
      this.innerValue = value;
      this.changed.forEach((f) => f(value));
    }
  }

  constructor() {}

  ngOnInit() {}

  registerOnChange(fn: any): void {
    this.changed.push(fn);
  }

  registerOnTouched(fn: any): void {
    this.touched.push(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: string): void {
    this.innerValue = obj;
  }

  dateChanged(date: NgbDateStruct) {
    this.dateChangeEv.emit(date);
  }
}
