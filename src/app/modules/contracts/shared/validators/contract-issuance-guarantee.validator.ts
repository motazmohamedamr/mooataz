import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

// يجب ان يكون تاريخ اصدار العقد بعد او يساوي تاريخ اصدار الضمان البنكي
export function contractIssuanceDateGuaranteeValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const guaranteeFromDate = form.get('bankGuaranteeValidityFrom')?.value as NgbDate;
    const issuanceDate = form.get('issuanceDate')?.value as NgbDate;
    if (!guaranteeFromDate || !issuanceDate) return null;

    const issueDate = new Date(
      `${issuanceDate.year}-${issuanceDate.month}-${issuanceDate.day}`
    );
    const GuaranteeFromDate = new Date(
      `${guaranteeFromDate.year}-${guaranteeFromDate.month}-${guaranteeFromDate.day}`
    );
    if (GuaranteeFromDate.getTime() > issueDate.getTime())
      return { issuanceDate_issuanceDateLessThanGuaranteeDate: true };
    return null;
  };
}
