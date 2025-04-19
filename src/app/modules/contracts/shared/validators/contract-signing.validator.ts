import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

// يحب ان يكون تاريخ بعد تاريخ اصدار امر التعميد
export function contractSigningDateValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const contractSigningDate = form.get('contractSigningDate')?.value as NgbDate;
    const issuanceDate = form.get('issuanceDate')?.value as NgbDate;
    if (!contractSigningDate || !issuanceDate) return null;

    const issueDate = new Date(
      `${issuanceDate.year}-${issuanceDate.month}-${issuanceDate.day}`
    );
    const signingDate = new Date(
      `${contractSigningDate.year}-${contractSigningDate.month}-${contractSigningDate.day}`
    );
    if (signingDate.getTime() < issueDate.getTime())
      return { contractSigningDate_signingDateLessThanIssuanceDate: true };
    return null;
  };
}
