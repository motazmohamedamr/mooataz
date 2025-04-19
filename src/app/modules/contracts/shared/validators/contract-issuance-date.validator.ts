import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

// يحب ان يكون تاريخ بعد تاريخ اصدار امر التعميد
export function contractIssuanceDateValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const awardIssuanceDate = form.get('awardOrderIssuanceDate')?.value as NgbDate;
    const issuanceDate = form.get('issuanceDate')?.value as NgbDate;
    if (!awardIssuanceDate || !issuanceDate) return null;

    const issueDate = new Date(
      `${issuanceDate.year}-${issuanceDate.month}-${issuanceDate.day}`
    );
    const awardissueDate = new Date(
      `${awardIssuanceDate.year}-${awardIssuanceDate.month}-${awardIssuanceDate.day}`
    );
    if (awardissueDate.getTime() >= issueDate.getTime())
      return { issuanceDate_issuanceDateLessThanAwardDate: true };
    return null;
  };
}
