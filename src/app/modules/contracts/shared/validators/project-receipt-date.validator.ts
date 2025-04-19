import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

export function ProjectReceiptDateValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const contractPrimaryReceiptDate = form.get('sitePrimaryReceiptDate')
      ?.value as NgbDate;
    const contractFinalReceiptDate = form.get('siteFinalReceiptDate')?.value as NgbDate;
    if (!contractPrimaryReceiptDate || !contractFinalReceiptDate) return null;

    const finalReceiptDate = new Date(
      `${contractFinalReceiptDate.year}-${contractFinalReceiptDate.month}-${contractFinalReceiptDate.day}`
    );
    const primaryReceiptDate = new Date(
      `${contractPrimaryReceiptDate.year}-${contractPrimaryReceiptDate.month}-${contractPrimaryReceiptDate.day}`
    );
    if (finalReceiptDate.getTime() < primaryReceiptDate.getTime())
      return { contractPrimaryReceiptDate_PrimaryReceiptDateLessThanFinalDate: true };
    return null;
  };
}
