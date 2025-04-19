import {
  AfterViewInit,
  Component,
  DestroyRef,
  EventEmitter,
  Inject,
  inject,
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
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-select-with-search',
  templateUrl: './select-with-search.component.html',
  styleUrl: './select-with-search.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: SelectWithSearchComponent, multi: true },
    {
      provide: NG_VALIDATORS,
      useExisting: SelectWithSearchComponent,
      multi: true,
    },
  ],
})
export class SelectWithSearchComponent
  implements AfterViewInit, OnChanges, ControlValueAccessor, Validator
{
  @Input({ required: true })
  placeholder: string = '';

  @Input({ required: true })
  label: string = '';

  @Input()
  selectOptions: any[] = [];

  @Input()
  selectValue: string = 'id';

  @Input()
  selectLabel: string = 'name';

  @Input()
  selectOptionHasLangValues: boolean = false;

  @Output()
  selectChanged = new EventEmitter<any>();

  requiredValidator = Validators.required;

  private readonly _destroyRef = inject(DestroyRef);

  _translateService = inject(TranslateService);

  _control: FormControl;

  public selectSearchFilterCtrl: FormControl<string> = new FormControl<string>('');
  filteredOptions: any[] = [];

  constructor(@Inject(INJECTOR) private injector: Injector) {
    this.selectSearchFilterCtrl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
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

  selectionChange(event: MatSelectChange) {
    if (this.selectChanged.observed) {
      this.selectChanged.emit(event.value);
    }
  }

  private filterOptions() {
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

  validate(control: AbstractControl): ValidationErrors | null {
    return null;
  }
  registerOnValidatorChange?(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}

