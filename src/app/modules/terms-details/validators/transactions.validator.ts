import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function transactionRemainingValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const remain = form.get('remain')?.value;
    if (remain < 0) return { lessthanzero: true };
    return null;
  };
}
