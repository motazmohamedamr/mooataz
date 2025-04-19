import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

export function receiptDateContractSigningValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const contractSigningDate = form.get('contractSigningDate')?.value as NgbDate;
    const contractReceiptDate = form.get('siteReceiptDate')?.value as NgbDate;
    if (!contractSigningDate || !contractReceiptDate) return null;

    const ContractReceiptDate = new Date(
      `${contractReceiptDate.year}-${contractReceiptDate.month}-${contractReceiptDate.day}`
    );
    const ContractSigningDate = new Date(
      `${contractSigningDate.year}-${contractSigningDate.month}-${contractSigningDate.day}`
    );
    if (ContractReceiptDate.getTime() < ContractSigningDate.getTime())
      return { contractReceiptDate_receiptDateLessThanSigningDate: true };
    return null;
  };
}
