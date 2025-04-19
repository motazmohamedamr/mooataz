import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DoCheck,
  EventEmitter,
  HostBinding,
  inject,
  Inject,
  Injector,
  INJECTOR,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { NgbDatepickerConfig, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-custom-input',
  templateUrl: './custom-input.component.html',
  styleUrl: './custom-input.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CustomInputComponent, multi: true },
    {
      provide: NG_VALIDATORS,
      useExisting: CustomInputComponent,
      multi: true,
    },
  ],
})
export class CustomInputComponent
  implements ControlValueAccessor, Validator, AfterViewInit, OnChanges
{
  @Input({ required: true })
  type: 'select' | 'text' | 'number' | 'date' | 'dateHijri' | 'textarea' = 'text';

  @Input({ required: true })
  placeholder: string = '';

  @Input({ required: true })
  label: string = '';

  @Input()
  maxLengthNumChars: number = 3;

  @Input()
  selectOptions: any[] = [];

  @Input()
  selectValue: string = 'id';

  @Input()
  inputIcon: string;

  @Input()
  minDate: NgbDateStruct;
  @Input()
  maxDate: NgbDateStruct;

  @Input()
  selectLabel: string = 'name';

  @Input()
  selectOptionHasLangValues: boolean = false;

  @Input()
  inputMode: string = 'text';

  @Input()
  gridClass: string = '';

  @Output()
  dateChangeEv = new EventEmitter<NgbDateStruct>();

  @Output()
  dropdownChanged = new EventEmitter<string | number>();

  @Output()
  selectSearchChanged = new EventEmitter<string>();

  @HostBinding('class')
  get classname(): string {
    return this.gridClass;
  }

  private readonly _destroyRef = inject(DestroyRef);

  _translateService = inject(TranslateService);

  _control: FormControl;
  requiredValidator = Validators.required;

  public selectSearchFilterCtrl: FormControl<string> = new FormControl<string>('');
  filteredOptions: any[] = [];

  constructor(
    @Inject(INJECTOR) private injector: Injector,
    protected config: NgbDatepickerConfig
  ) {
    this.selectSearchFilterCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(() => {
        this.filterOptions();
      });
  }

  ngAfterViewInit(): void {
    const ngControl: NgControl = this.injector.get(NgControl, null);
    if (ngControl) {
      setTimeout(() => {
        this._control = ngControl.control as FormControl;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.selectOptions && changes.selectOptions.currentValue) {
      this.filteredOptions = this.selectOptions.slice();
    }
  }

  protected compareOptions(a: any, b: any) {
    if (!a || !b) return;
    if (this.selectOptionHasLangValues) {
      return (
        a[this.selectLabel][this._translateService.currentLang] ===
        b[this.selectLabel][this._translateService.currentLang]
      );
    } else {
      return a[this.selectLabel] === b[this.selectLabel];
    }
  }

  selectDropdownChanged(event: MatSelectChange) {
    this.dropdownChanged.emit(event.value);
  }

  private filterOptions() {
    if (this.selectSearchChanged.observed) {
      this.selectSearchChanged.emit(this.selectSearchFilterCtrl.value);
      return;
    }
    if (!this.selectOptions) {
      return;
    }
    // get the search keyword
    let search = this.selectSearchFilterCtrl.value;
    if (!search) {
      this.filteredOptions = this.selectOptions.slice();
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredOptions = this.selectOptions.filter((option) => {
      return this.selectOptionHasLangValues
        ? option[this.selectLabel][this._translateService.currentLang]
            .toLowerCase()
            .indexOf(search) > -1
        : option[this.selectLabel].toLowerCase().indexOf(search) > -1;
    });
  }

  onChange = (val: unknown) => {};
  onTouched = (val: unknown) => {};
  onValidatorChange = () => {};
  disabled: boolean = false;

  currentVal: unknown = null;

  set value(val: unknown) {
    this.currentVal = val;
    this.onChange(val);
    this.onTouched(val);
    this.onValidatorChange();
  }

  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  changeValueOnInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.onChange(inputValue);
  }

  changeValueOnBlur(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.onTouched(inputValue);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return null;
  }
  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  dateChanged(date: NgbDateStruct) {
    this.dateChangeEv.emit(date);
  }
}
