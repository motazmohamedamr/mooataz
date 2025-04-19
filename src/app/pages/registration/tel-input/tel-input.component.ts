import {
  Component,
  ElementRef,
  forwardRef,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import intlTelInput from 'intl-tel-input';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-tel-input',
  templateUrl: './tel-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TelInputComponent),
      multi: true,
    },
  ],
})
export class TelInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('phoneInput', { static: true }) phoneInputRef!: ElementRef;
  @Input()
  translation: Record<string, any>;
  iti: any;

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  ngAfterViewInit() {
    this.iti = intlTelInput(this.phoneInputRef.nativeElement, {
      separateDialCode: true,
      initialCountry: 'eg',
    });

    if (this.value) {
      this.iti.setNumber(this.value);
    }

    this.phoneInputRef.nativeElement.addEventListener('input', () => {
      const number = this.iti?.getNumber() || '';
      this.valueChange.emit(number);
    });
  }

  writeValue(value: string): void {
    if (this.iti && value) {
      this.iti.setNumber(value);
    }
  }

  onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(input.value);
  }

  ngOnDestroy() {
    this.iti?.destroy();
  }
}
