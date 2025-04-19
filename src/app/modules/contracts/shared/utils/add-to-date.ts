import { NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export function addToNgbDate(
  date: NgbDate,
  years: number = 0,
  months: number = 0,
  days: number = 0
): NgbDate {
  const jsDate = new Date(date.year, date.month - 1, date.day);

  jsDate.setFullYear(jsDate.getFullYear() + years);
  jsDate.setMonth(jsDate.getMonth() + months);
  jsDate.setDate(jsDate.getDate() + days);

  return new NgbDate(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate());
}
