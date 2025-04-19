import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

export function GuaranteeAwardDateOrderValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const awardOrderIssuanceDate = form.get('awardOrderIssuanceDate')?.value as NgbDate;
    const bankGuaranteeValidityFrom = form.get('bankGuaranteeValidityFrom')
      ?.value as NgbDate;

    if (!awardOrderIssuanceDate || !bankGuaranteeValidityFrom) return null;

    const guaranteeValidityFrom = new Date(
      `${bankGuaranteeValidityFrom.year}-${bankGuaranteeValidityFrom.month}-${bankGuaranteeValidityFrom.day}`
    );
    const awardIssuanceDate = new Date(
      `${awardOrderIssuanceDate.year}-${awardOrderIssuanceDate.month}-${awardOrderIssuanceDate.day}`
    );
    if (guaranteeValidityFrom.getTime() <= awardIssuanceDate.getTime()) {
      return { guaranteeDate_LessThanAwardDate: true };
    }
    return null;
  };
}
