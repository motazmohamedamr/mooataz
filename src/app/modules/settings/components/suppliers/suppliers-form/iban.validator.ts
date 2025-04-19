import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function supplierIBANValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const controlValue = control.value as string;
    if (!control.value) return null;
    const has24Chars = controlValue.length === 24;
    const startWithSA = controlValue.startsWith('SA');
    return has24Chars && startWithSA ? null : { ibanErr: true };
  };
}
