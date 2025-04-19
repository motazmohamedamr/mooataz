import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function numbersOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    var regex = /^\d+$/;

    return control.value && !regex?.test(control.value) ? { notNumber: true } : null;
  };
}
